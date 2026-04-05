import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Volume2, VolumeX, SmilePlus, Reply } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';

const QUICK_EMOJIS = ['❤️', '👍', '🤲', '🌙', '✨', '😊', '🔥', '💎'];
const LONG_PRESS_MS = 400;
const REPLY_SWIPE_THRESHOLD = 64;

interface ChatMessageProps {
  message: ChatMessageType;
  isPlaying: boolean;
  onPlayTTS: (text: string, messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: ChatMessageType) => void;
}

export const ChatMessage = React.memo(function ChatMessage({ message, isPlaying, onPlayTTS, onReact, onReply }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [showPicker, setShowPicker] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyTriggered = useRef(false);

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

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
    longPressTimer.current = setTimeout(() => {
      setShowPicker((prev) => !prev);
      if (navigator.vibrate) navigator.vibrate(30);
    }, LONG_PRESS_MS);
  }, [message.content]);

  const handleTouchEnd = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isUser) return;
    const nextX = Math.max(0, Math.min(info.offset.x, REPLY_SWIPE_THRESHOLD + 24));
    setSwipeX(nextX);
    if (nextX >= REPLY_SWIPE_THRESHOLD && !replyTriggered.current) {
      replyTriggered.current = true;
      onReply(message);
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }, [isUser, message, onReply]);

  const handleDragEnd = useCallback(() => {
    replyTriggered.current = false;
    setSwipeX(0);
  }, []);

  const formatContent = (text: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    // Strip <inner_thoughts> blocks and <response> wrapper tags added by the system prompt
    const cleaned = text
      .replace(/<inner_thoughts>[\s\S]*?<\/inner_thoughts>/g, '')
      .replace(/<\/?response>/g, '')
      .trim();
    const parts = cleaned.split(/(\*\*.*?\*\*|\*.*?\*|\n)/g);
    parts.forEach((part, i) => {
      if (part === '\n') {
        nodes.push(<br key={i} />);
      } else if (part.startsWith('**') && part.endsWith('**')) {
        nodes.push(<strong key={i} className="text-primary font-semibold">{part.slice(2, -2)}</strong>);
      } else if (part.startsWith('*') && part.endsWith('*')) {
        nodes.push(<em key={i} className="text-secondary">{part.slice(1, -1)}</em>);
      } else {
        nodes.push(part);
      }
    });
    return nodes;
  };

  const reactions = message.reactions || [];

  return (
    <div className={`relative flex gap-2 md:gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Swipe-to-reply indicator */}
      {!isUser && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <div
            className="flex items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary transition-all duration-200"
            style={{
              width: 28,
              height: 28,
              opacity: Math.min(swipeX / REPLY_SWIPE_THRESHOLD, 1),
              transform: `scale(${0.85 + Math.min(swipeX / REPLY_SWIPE_THRESHOLD, 1) * 0.25})`,
            }}
            aria-hidden="true"
          >
            <Reply className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        drag={isUser ? false : 'x'}
        dragConstraints={{ left: 0, right: REPLY_SWIPE_THRESHOLD + 24 }}
        dragElastic={0.12}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x: isUser ? 0 : swipeX }}
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

        {/* Bubble + actions */}
        <div className={`relative flex flex-col gap-1 max-w-[82%] md:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Bubble */}
          <div
            className={`rounded-2xl px-3 md:px-4 py-2.5 md:py-3 select-none w-fit ${
              isUser
                ? 'bg-primary/10 border border-primary/20 rounded-tr-sm'
                : 'bg-glass rounded-tl-sm'
            }`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={clearTimer}
            onContextMenu={(e) => e.preventDefault()}
          >
            {message.replyToContent && (
              <div className="mb-2 rounded-2xl rounded-bl-md border border-border/60 bg-muted/40 px-3 py-2">
                <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  <Reply className="w-3 h-3" />
                  Replying to {message.replyToRole === 'assistant' ? 'Habibi' : 'you'}
                </div>
                <div className="line-clamp-2 text-xs text-muted-foreground">{message.replyToContent}</div>
              </div>
            )}

            <div className="text-sm leading-relaxed text-foreground/90 break-words">
              {formatContent(message.content)}
            </div>
          </div>

          {/* Action row — visible on hover */}
          {message.content && (
            <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-primary"
                  onClick={() => onPlayTTS(message.content, message.id)}
                >
                  {isPlaying ? (
                    <><VolumeX className="mr-1 h-3 w-3" />Stop</>
                  ) : (
                    <><Volume2 className="mr-1 h-3 w-3" />Listen</>
                  )}
                </Button>
              )}
              {!isUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-primary"
                  onClick={() => onReply(message)}
                >
                  <Reply className="mr-1 h-3 w-3" />Reply
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                data-reaction-trigger
                className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-primary"
                onClick={() => setShowPicker((prev) => !prev)}
              >
                <SmilePlus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Reactions */}
          <AnimatePresence>
            {reactions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-wrap gap-1 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {reactions.map((emoji, i) => (
                  <motion.button
                    key={`${emoji}-${i}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25, delay: i * 0.03 }}
                    onClick={() => onReact(message.id, emoji)}
                    className="h-6 rounded-full border border-primary/20 bg-primary/10 px-1.5 text-sm transition-all duration-150 hover:scale-110 hover:bg-primary/20 active:scale-90"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emoji picker */}
          <AnimatePresence>
            {showPicker && (
              <motion.div
                data-reaction-picker
                initial={{ opacity: 0, scale: 0.85, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`absolute z-20 top-full mt-1 ${isUser ? 'right-0' : 'left-0'}`}
              >
                <div className="flex gap-0.5 rounded-full border border-border/60 bg-card/95 px-2 py-1.5 shadow-lg shadow-black/20 backdrop-blur-xl">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(message.id, emoji);
                        setShowPicker(false);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-base transition-all duration-150 hover:scale-125 hover:bg-primary/20 active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
});
