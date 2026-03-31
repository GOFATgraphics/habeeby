import { useState, useRef, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  isRecording: boolean;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => Promise<string>;
}

export function ChatInput({ onSend, isLoading, isRecording, onStartRecording, onStopRecording }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
    <div className="border-t border-border/50 bg-glass-strong p-4">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            className={`flex-shrink-0 rounded-full border transition-all duration-300 ${
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
          placeholder="Type your message..."
          className="min-h-[44px] max-h-[120px] resize-none rounded-2xl bg-muted/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary text-sm"
          rows={1}
          disabled={isLoading}
        />

        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            size="icon"
            className="flex-shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan transition-all duration-300"
            onClick={handleSend}
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
  );
}
