import { Volume2, VolumeX } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  message: ChatMessageType;
  isPlaying: boolean;
  onPlayTTS: (text: string, messageId: string) => void;
}

export function ChatMessage({ message, isPlaying, onPlayTTS }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Simple markdown-like formatting for Quran verses
  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className={`flex gap-3 animate-fade-in-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-display ${
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-habibi-gold text-primary-foreground'
      }`}>
        {isUser ? '🤲' : '🌙'}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-sm'
          : 'bg-card border border-border rounded-tl-sm'
      }`}>
        <div
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />

        {/* TTS button for assistant messages */}
        {!isUser && message.content && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onPlayTTS(message.content, message.id)}
          >
            {isPlaying ? (
              <><VolumeX className="w-3.5 h-3.5 mr-1" /> Stop</>
            ) : (
              <><Volume2 className="w-3.5 h-3.5 mr-1" /> Listen</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
