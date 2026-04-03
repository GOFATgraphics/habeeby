import { useState, useRef, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff, Loader2, Reply, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from '@/hooks/useChat';

interface ChatInputProps {
  onSend: (message: string) => Promise<void> | void;
  isLoading: boolean;
  isRecording: boolean;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => Promise<string>;
  replyTo?: ChatMessage | null;
  onClearReply?: () => void;
}

export function ChatInput({ onSend, isLoading, isRecording, onStartRecording, onStopRecording, replyTo, onClearReply }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    await onSend(trimmed);
    setInput('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      setIsTranscribing(true);
      try {
        const text = await onStopRecording();
        if (text) setInput(prev => prev ? `${prev} ${text}` : text);
      } catch (err) {
        console.error('Transcription error:', err);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      try {
        await onStartRecording();
      } catch (err) {
        console.error('Recording error:', err);
      }
    }
  };

  return (
    <div className="border-t border-border/50 bg-glass-strong px-3 py-3 md:p-4">
      <div className="max-w-3xl mx-auto">
        {replyTo && (
          <div className="mb-2 flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-muted/40 px-3 py-2">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
                <Reply className="w-3 h-3" />
                Replying to {replyTo.role === 'assistant' ? 'Habibi' : 'you'}
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{replyTo.content}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              onClick={onClearReply}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              className={`flex-shrink-0 rounded-full border h-9 w-9 transition-all duration-300 ${
                isRecording
                  ? 'border-primary text-primary glow-cyan animate-pulse-gentle'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
              }`}
              onClick={handleMicClick}
              disabled={isLoading || isTranscribing}
            >
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          </motion.div>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={replyTo ? 'Write your reply…' : 'Type your message...'}
            className="min-h-[42px] max-h-[100px] resize-none rounded-2xl bg-muted/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary text-sm py-2.5 px-3"
            rows={1}
            disabled={isLoading}
          />

          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="icon"
              className="flex-shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan transition-all duration-300 h-9 w-9 active:scale-95"
              onClick={() => void handleSend()}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
