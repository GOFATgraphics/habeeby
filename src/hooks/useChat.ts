import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  reactions?: string[];
  dbId?: string;
  replyToRole?: 'user' | 'assistant';
  replyToContent?: string;
}

const STORAGE_KEY = 'habibi-chat-history';
const USER_KEY = 'habibi-user';
const MAX_CONTEXT_MESSAGES = 40;

type ConversationMessage = Pick<ChatMessage, 'role' | 'content' | 'replyToRole' | 'replyToContent'>;

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

async function getAuthHeader() {
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    console.warn('getAuthHeader: no active session, request will be rejected by the server');
  }
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${session?.access_token ?? supabaseKey}`,
  };
}

function mapDbMessage(message: {
  id: string;
  role: string;
  content: string;
  created_at: string;
  reactions: string[] | null;
}): ChatMessage {
  return {
    id: message.id,
    dbId: message.id,
    role: message.role as 'user' | 'assistant',
    content: message.content,
    timestamp: new Date(message.created_at).getTime(),
    reactions: message.reactions || [],
  };
}

function toConversationMessage(message: ChatMessage): ConversationMessage {
  return {
    role: message.role,
    content: message.content,
    replyToRole: message.replyToRole,
    replyToContent: message.replyToContent,
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

async function saveMessageToDB(userId: string, message: ChatMessage): Promise<string | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      user_id: userId,
      role: message.role,
      content: message.content,
      reactions: message.reactions || [],
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

    void loadMessagesFromDB(userId).then(async (dbMessages) => {
      if (dbMessages.length > 0) {
        setMessages(dbMessages);
        localStorage.removeItem(STORAGE_KEY);
        setIsLoadingHistory(false);
        return;
      }

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          setMessages([]);
          setIsLoadingHistory(false);
          return;
        }

        const localMessages: ChatMessage[] = JSON.parse(stored);
        if (localMessages.length === 0) {
          setMessages([]);
          setIsLoadingHistory(false);
          return;
        }

        const migratedMessages: ChatMessage[] = [];
        for (const message of localMessages) {
          if (!message.content) continue;
          const dbId = await saveMessageToDB(userId, message);
          migratedMessages.push({ ...message, dbId: dbId || undefined });
        }

        // Prime message_count so the next send triggers a memory summary
        // of the migrated history, giving the AI full context immediately.
        if (migratedMessages.length > 0) {
          await supabase
            .from('profiles')
            .upsert({ user_id: userId, message_count: 9, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        }

        setMessages(migratedMessages);
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    });
  }, [userId]);

  useEffect(() => {
    if (userId) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, userId]);

  const sendMessage = useCallback(async (content: string, replyTo?: ChatMessage | null) => {
    const userData = getUserData();
    const currentMessages = messagesRef.current;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
      reactions: [],
      replyToRole: replyTo?.role,
      replyToContent: replyTo?.content,
    };

    const assistantPlaceholder: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      reactions: [],
    };

    const messagesWithPlaceholder = [...currentMessages, userMessage, assistantPlaceholder];
    const conversationForAI = [...currentMessages, userMessage]
      .slice(-MAX_CONTEXT_MESSAGES)
      .map(toConversationMessage);

    setMessages(messagesWithPlaceholder);
    setIsLoading(true);

    if (userId) {
      void saveMessageToDB(userId, userMessage).then((dbId) => {
        if (!dbId) return;
        setMessages((prev) => prev.map((message) => (
          message.id === userMessage.id ? { ...message, dbId } : message
        )));
      });
    }

    try {
      abortRef.current = new AbortController();

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const authHeaders = await getAuthHeader();
      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          messages: conversationForAI,
          userName: userData?.name,
          userId,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Missing response stream');

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
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (!parsed.text) continue;

            fullText += parsed.text;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: fullText,
              };
              return updated;
            });
          } catch {
            // Ignore malformed stream chunks.
          }
        }
      }

      if (userId) {
        const assistantDbId = await saveMessageToDB(userId, { ...assistantPlaceholder, content: fullText });
        if (assistantDbId) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              dbId: assistantDbId,
            };
            return updated;
          });
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        const errorContent = 'Forgive me, ya habibi — I encountered an issue. Please try again. 🤲';

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: errorContent,
          };
          return updated;
        });

        if (userId) {
          await saveMessageToDB(userId, { ...assistantPlaceholder, content: errorContent });
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
    setMessages((prev) => prev.map((message) => {
      if (message.id !== messageId) return message;

      const reactions = message.reactions || [];
      const nextReactions = reactions.includes(emoji)
        ? reactions.filter((reaction) => reaction !== emoji)
        : [...reactions, emoji];

      if (message.dbId) {
        void updateMessageInDB(message.dbId, { reactions: nextReactions });
      }

      return { ...message, reactions: nextReactions };
    }));
  }, []);

  return { messages, isLoading, isLoadingHistory, sendMessage, clearHistory, toggleReaction };
}
