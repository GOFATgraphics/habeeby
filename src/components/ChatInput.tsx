import { useState, useRef, KeyboardEvent } from 'react';
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
        if (text) {
          setInput(prev => prev ? `${prev} ${text}` : text);
        }
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
    <div className="border-t border-border bg-background p-4">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        {/* Mic button */}
        <Button
          variant="ghost"
          size="icon"
          className={`flex-shrink-0 rounded-full ${isRecording ? 'text-destructive animate-pulse-gentle' : 'text-muted-foreground'}`}
          onClick={handleMicClick}
          disabled={isLoading || isTranscribing}
          title={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isTranscribing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share what's on your heart, ya habibi..."
          className="min-h-[44px] max-h-[120px] resize-none rounded-2xl bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
          rows={1}
          disabled={isLoading}
        />

        {/* Send button */}
        <Button
          size="icon"
          className="flex-shrink-0 rounded-full bg-primary hover:bg-primary/90"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
