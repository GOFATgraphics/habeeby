import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, SmilePlus } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';

const QUICK_EMOJIS = ['❤️', '👍', '🤲', '🌙', '✨', '😊', '🔥', '💎'];
const LONG_PRESS_MS = 400;

interface ChatMessageProps {
  message: ChatMessageType;
  isPlaying: boolean;
  onPlayTTS: (text: string, messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
}

export function ChatMessage({ message, isPlaying, onPlayTTS, onReact }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [showPicker, setShowPicker] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Close picker on outside tap
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-reaction-picker]') && !target.closest('[data-reaction-trigger]')) {
        setShowPicker(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [showPicker]);

  const handleTouchStart = useCallback(() => {
    if (!message.content) return;
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setShowPicker(p => !p);
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(30);
    }, LONG_PRESS_MS);
  }, [message.content]);

  const handleTouchEnd = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-secondary">$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const reactions = message.reactions || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-2 md:gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-mono border ${
        isUser
          ? 'bg-primary/10 border-primary/30 text-primary'
          : 'bg-secondary/10 border-secondary/30 text-secondary'
      }`}>
        {isUser ? 'You' : 'AI'}
      </div>

      {/* Message bubble + reactions */}
      <div className="relative max-w-[85%] md:max-w-[80%]">
        <div
          className={`rounded-2xl px-3 md:px-4 py-2.5 md:py-3 select-none ${
            isUser
              ? 'bg-primary/10 border border-primary/20 rounded-tr-sm'
              : 'bg-glass rounded-tl-sm'
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={clearTimer}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            className="text-sm leading-relaxed text-foreground/90 break-words"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />

          {/* Action row */}
          <div className="flex items-center gap-1 mt-1.5">
            {!isUser && message.content && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={() => onPlayTTS(message.content, message.id)}
              >
                {isPlaying ? (
                  <><VolumeX className="w-3 h-3 mr-1" /> Stop</>
                ) : (
                  <><Volume2 className="w-3 h-3 mr-1" /> Listen</>
                )}
              </Button>
            )}

            {/* React button - visible on hover (desktop) */}
            {message.content && (
              <Button
                variant="ghost"
                size="sm"
                data-reaction-trigger
                className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
                onClick={() => setShowPicker(p => !p)}
              >
                <SmilePlus className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Emoji picker */}
        <AnimatePresence>
          {showPicker && (
            <motion.div
              data-reaction-picker
              initial={{ opacity: 0, scale: 0.85, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute z-20 mt-1 ${isUser ? 'right-0' : 'left-0'}`}
            >
              <div className="flex gap-0.5 bg-card/95 backdrop-blur-xl border border-border/60 rounded-full px-2 py-1.5 shadow-lg shadow-black/20">
                {QUICK_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(message.id, emoji);
                      setShowPicker(false);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-primary/20 hover:scale-125 active:scale-95 transition-all duration-150 text-base"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Displayed reactions */}
        <AnimatePresence>
          {reactions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-wrap gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {reactions.map((emoji, i) => (
                <motion.button
                  key={`${emoji}-${i}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25, delay: i * 0.03 }}
                  onClick={() => onReact(message.id, emoji)}
                  className="h-6 px-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm hover:bg-primary/20 hover:scale-110 active:scale-90 transition-all duration-150"
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
