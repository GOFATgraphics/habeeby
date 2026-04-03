import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  reactions?: string[];
  dbId?: string;
  replyToId?: string;
  replyToRole?: 'user' | 'assistant';
  replyToContent?: string;
}

const STORAGE_KEY = 'habibi-chat-history';
const USER_KEY = 'habibi-user';
const MAX_CONTEXT_MESSAGES = 6;

type MessagePersistenceShape = Pick<ChatMessage, 'role' | 'content' | 'reactions' | 'replyToId' | 'replyToRole' | 'replyToContent'>;

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

function mapDbMessage(m: any): ChatMessage {
  return {
    id: m.id,
    dbId: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    timestamp: new Date(m.created_at).getTime(),
    reactions: m.reactions || [],
    replyToId: m.reply_to_id || undefined,
    replyToRole: m.reply_to_role || undefined,
    replyToContent: m.reply_to_content || undefined,
  };
}

function toPersistedMessage(msg: ChatMessage): MessagePersistenceShape {
  return {
    role: msg.role,
    content: msg.content,
    reactions: msg.reactions || [],
    replyToId: msg.replyToId,
    replyToRole: msg.replyToRole,
    replyToContent: msg.replyToContent,
  };
}

async function loadMessagesFromDB(userId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data.map(mapDbMessage);
}

async function saveMessageToDB(userId: string, msg: ChatMessage): Promise<string | null> {
  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    role: msg.role,
    content: msg.content,
    reactions: msg.reactions || [],
  };

  if (msg.replyToId) insertPayload.reply_to_id = msg.replyToId;
  if (msg.replyToRole) insertPayload.reply_to_role = msg.replyToRole;
  if (msg.replyToContent) insertPayload.reply_to_content = msg.replyToContent;

  const { data, error } = await supabase
    .from('messages')
    .insert(insertPayload)
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
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!userId) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setMessages(stored ? JSON.parse(stored) : []);
      } catch {
        setMessages([]);
      }
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    void loadMessagesFromDB(userId).then(async (dbMsgs) => {
      if (dbMsgs.length > 0) {
        setMessages(dbMsgs);
        localStorage.removeItem(STORAGE_KEY);
      } else {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const localMsgs: ChatMessage[] = JSON.parse(stored);
            if (localMsgs.length > 0) {
              const migratedMsgs: ChatMessage[] = [];
              for (const msg of localMsgs) {
                if (!msg.content) continue;
                const dbId = await saveMessageToDB(userId, msg);
                migratedMsgs.push({ ...msg, dbId: dbId || undefined });
              }
              setMessages(migratedMsgs);
              localStorage.removeItem(STORAGE_KEY);
            } else {
              setMessages([]);
            }
          } else {
            setMessages([]);
          }
        } catch {
          setMessages([]);
        }
      }
      setIsLoadingHistory(false);
    });
  }, [userId]);

  useEffect(() => {
    if (userId) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, userId]);

  const sendMessage = useCallback(async (content: string, replyTo?: ChatMessage | null) => {
    const activeMessages = messagesRef.current;
    const userData = getUserData();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
      reactions: [],
      replyToId: replyTo?.dbId || replyTo?.id,
      replyToRole: replyTo?.role,
      replyToContent: replyTo?.content,
    };

    const messagesWithUser = [...activeMessages, userMessage];
    setMessages(messagesWithUser);
    setIsLoading(true);

    if (userId) {
      const userDbId = await saveMessageToDB(userId, userMessage);
      if (userDbId) {
        userMessage.dbId = userDbId;
        setMessages(prev => prev.map(msg => msg.id === userMessage.id ? { ...msg, dbId: userDbId } : msg));
      }
    }

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      reactions: [],
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      abortRef.current = new AbortController();

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const conversationForAI = messagesWithUser.slice(-MAX_CONTEXT_MESSAGES).map(toPersistedMessage);

      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          messages: conversationForAI,
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
        const lines = buffer.split('
');
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
            } catch {
              // skip
            }
          }
        }
      }

      assistantMessage.content = fullText;
      if (userId) {
        const assistantDbId = await saveMessageToDB(userId, assistantMessage);
        if (assistantDbId) {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], dbId: assistantDbId };
            return updated;
          });
        }
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

        assistantMessage.content = errorContent;
        if (userId) {
          await saveMessageToDB(userId, assistantMessage);
        }
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [userId]);

  const clearHistory = useCallback(async () => {
    if (userId) {
      await supabase.from('messages').delete().eq('user_id', userId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setMessages([]);
  }, [userId]);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      const reactions = msg.reactions || [];
      const hasReaction = reactions.includes(emoji);
      const newReactions = hasReaction
        ? reactions.filter(r => r !== emoji)
        : [...reactions, emoji];

      if (msg.dbId) {
        void updateMessageInDB(msg.dbId, { reactions: newReactions });
      }

      return { ...msg, reactions: newReactions };
    }));
  }, []);

  return { messages, isLoading, isLoadingHistory, sendMessage, clearHistory, toggleReaction };
}
