import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  reactions?: string[];
  dbId?: string;
}

const USER_KEY = 'habibi-user';

export function getUserData(): { name: string; intention: string } | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveUserData(data: { name: string; intention: string }) {
  localStorage.setItem(USER_KEY, JSON.stringify(data));
}

async function loadMessagesFromDB(userId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map(m => ({
    id: m.id,
    dbId: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    timestamp: new Date(m.created_at).getTime(),
    reactions: m.reactions || [],
  }));
}

async function saveMessageToDB(userId: string, msg: ChatMessage): Promise<string | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      user_id: userId,
      role: msg.role,
      content: msg.content,
      reactions: msg.reactions || [],
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save message:', error);
    return null;
  }
  return data?.id || null;
}

async function updateMessageInDB(dbId: string, updates: { content?: string; reactions?: string[] }) {
  await supabase
    .from('messages')
    .update(updates)
    .eq('id', dbId);
}

export function useChat(userId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // Load messages from DB on mount
  useEffect(() => {
    if (!userId) {
      setIsLoadingHistory(false);
      return;
    }
    setIsLoadingHistory(true);
    loadMessagesFromDB(userId).then(msgs => {
      setMessages(msgs);
      setIsLoadingHistory(false);
    });
  }, [userId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!userId) return;
    const userData = getUserData();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Save user message to DB
    const userDbId = await saveMessageToDB(userId, userMessage);
    if (userDbId) userMessage.dbId = userDbId;

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages([...updatedMessages, assistantMessage]);

    try {
      abortRef.current = new AbortController();

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          userName: userData?.name,
          userId,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: fullText,
                  };
                  return updated;
                });
              }
            } catch { /* skip */ }
          }
        }
      }

      // Save assistant message to DB
      assistantMessage.content = fullText;
      const assistantDbId = await saveMessageToDB(userId, assistantMessage);
      if (assistantDbId) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], dbId: assistantDbId };
          return updated;
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        const errorContent = 'Forgive me, ya habibi — I encountered an issue. Please try again. 🤲';
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: errorContent,
          };
          return updated;
        });
        // Save error message to DB too
        assistantMessage.content = errorContent;
        await saveMessageToDB(userId, assistantMessage);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages, userId]);

  const clearHistory = useCallback(async () => {
    if (userId) {
      await supabase.from('messages').delete().eq('user_id', userId);
    }
    setMessages([]);
  }, [userId]);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id !== messageId) return msg;
        const reactions = msg.reactions || [];
        const hasReaction = reactions.includes(emoji);
        const newReactions = hasReaction
          ? reactions.filter(r => r !== emoji)
          : [...reactions, emoji];

        // Update in DB if we have a dbId
        if (msg.dbId) {
          updateMessageInDB(msg.dbId, { reactions: newReactions });
        }

        return { ...msg, reactions: newReactions };
      });
      return updated;
    });
  }, []);

  return { messages, isLoading, isLoadingHistory, sendMessage, clearHistory, toggleReaction };
}
