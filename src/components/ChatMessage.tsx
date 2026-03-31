import { motion } from 'framer-motion';
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

  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-secondary">$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-2 md:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-mono border ${
        isUser
          ? 'bg-primary/10 border-primary/30 text-primary'
          : 'bg-secondary/10 border-secondary/30 text-secondary'
      }`}>
        {isUser ? 'You' : 'AI'}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2.5 md:py-3 ${
        isUser
          ? 'bg-primary/10 border border-primary/20 rounded-tr-sm'
          : 'bg-glass rounded-tl-sm'
      }`}>
        <div
          className="text-sm leading-relaxed text-foreground/90 break-words"
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />

        {/* TTS button for assistant messages */}
        {!isUser && message.content && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1.5 h-6 px-2 text-xs text-muted-foreground hover:text-primary"
            onClick={() => onPlayTTS(message.content, message.id)}
          >
            {isPlaying ? (
              <><VolumeX className="w-3 h-3 mr-1" /> Stop</>
            ) : (
              <><Volume2 className="w-3 h-3 mr-1" /> Listen</>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
