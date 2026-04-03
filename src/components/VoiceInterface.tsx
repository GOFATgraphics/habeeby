import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Square, Loader2 } from 'lucide-react';

const NUM_BARS = 22;
const BAR_CONFIGS = Array.from({ length: NUM_BARS }, (_, i) => {
  const center = (NUM_BARS - 1) / 2;
  const dist = Math.abs(i - center) / center; // 0 = center, 1 = edge
  return {
    id: i,
    maxH: Math.round(48 - dist * 26), // taller in the middle
    duration: 0.24 + dist * 0.22,
    delay: dist * 0.09,
  };
});

interface VoiceInterfaceProps {
  isRecording: boolean;
  isProcessing: boolean;
  isAISpeaking: boolean;
  onStart: () => void;
  onStop: () => void;
  onClose: () => void;
}

export function VoiceInterface({
  isRecording,
  isProcessing,
  isAISpeaking,
  onStart,
  onStop,
  onClose,
}: VoiceInterfaceProps) {
  const isActive = isRecording || isAISpeaking;

  const orbClass = isRecording
    ? 'border-primary bg-primary/15 shadow-[0_0_60px_hsl(var(--neon-cyan)/0.45),0_0_120px_hsl(var(--neon-cyan)/0.2)]'
    : isAISpeaking
    ? 'border-secondary bg-secondary/15 shadow-[0_0_60px_hsl(var(--neon-purple)/0.45),0_0_120px_hsl(var(--neon-purple)/0.2)]'
    : isProcessing
    ? 'border-border bg-muted/40'
    : 'border-border/50 bg-glass hover:border-primary/40 hover:shadow-[0_0_30px_hsl(var(--neon-cyan)/0.15)]';

  const ringClass = isRecording
    ? 'border-primary/25'
    : isAISpeaking
    ? 'border-secondary/25'
    : 'border-border/15';

  const barClass = isRecording
    ? 'bg-primary'
    : isAISpeaking
    ? 'bg-secondary'
    : 'bg-muted-foreground/20';

  const statusText = isRecording
    ? 'Listening…'
    : isProcessing
    ? 'Processing your words…'
    : isAISpeaking
    ? 'Habibi is speaking…'
    : 'Tap the orb to speak';

  const statusColor = isRecording
    ? 'text-primary'
    : isAISpeaking
    ? 'text-secondary'
    : 'text-muted-foreground';

  const handleOrb = () => {
    if (isProcessing) return;
    if (isRecording || isAISpeaking) onStop();
    else onStart();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background/96 backdrop-blur-2xl"
    >
      {/* Drifting ambient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--neon-cyan)/0.10) 0%, transparent 70%)' }}
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--neon-purple)/0.10) 0%, transparent 70%)' }}
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        {isRecording && (
          <motion.div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, hsl(var(--neon-cyan)/0.05) 0%, transparent 60%)' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        {isAISpeaking && (
          <motion.div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, hsl(var(--neon-purple)/0.05) 0%, transparent 60%)' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Branding */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-16 text-center"
      >
        <div className="mb-1 flex items-center justify-center gap-2">
          <span className="text-xl">🌙</span>
          <span className="font-display text-xl font-semibold text-foreground">Habibi</span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50">
          Voice Companion
        </p>
      </motion.div>

      {/* Orb + concentric rings */}
      <div className="relative flex items-center justify-center">
        {/* Expanding rings */}
        <AnimatePresence>
          {isActive &&
            Array.from({ length: 4 }, (_, i) => (
              <motion.div
                key={i}
                className={`absolute rounded-full border ${ringClass}`}
                style={{ width: 144 + i * 52, height: 144 + i * 52 }}
                initial={{ opacity: 0.7, scale: 0.88 }}
                animate={{ opacity: 0, scale: 1.18 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: isRecording ? 1.5 : 2.0,
                  repeat: Infinity,
                  delay: i * (isRecording ? 0.38 : 0.5),
                  ease: 'easeOut',
                }}
              />
            ))}
        </AnimatePresence>

        {/* The orb itself */}
        <motion.button
          onClick={handleOrb}
          disabled={isProcessing}
          className={`relative z-10 flex h-36 w-36 items-center justify-center rounded-full border-2 transition-all duration-500 ${orbClass}`}
          animate={
            isRecording
              ? { scale: [1, 1.07, 1] }
              : isAISpeaking
              ? { scale: [1, 1.04, 1.015, 1] }
              : { scale: [1, 1.025, 1] }
          }
          transition={
            isRecording
              ? { duration: 1.1, repeat: Infinity }
              : isAISpeaking
              ? { duration: 1.9, repeat: Infinity }
              : { duration: 3.5, repeat: Infinity }
          }
          whileTap={!isProcessing ? { scale: 0.93 } : {}}
        >
          {isProcessing ? (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          ) : isRecording ? (
            <Square className="h-8 w-8 fill-primary text-primary" />
          ) : isAISpeaking ? (
            /* Mini waveform inside orb when AI speaks */
            <div className="flex items-end gap-1 h-9">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="w-[5px] rounded-full bg-secondary"
                  animate={{ height: [5, 22 + (i % 4) * 7, 5] }}
                  transition={{ duration: 0.45 + i * 0.06, repeat: Infinity, delay: i * 0.08 }}
                />
              ))}
            </div>
          ) : (
            <Mic className="h-11 w-11 text-muted-foreground" />
          )}
        </motion.button>
      </div>

      {/* Waveform bars */}
      <div className="mt-14 flex h-14 items-end justify-center gap-[3px]">
        {BAR_CONFIGS.map(({ id, maxH, duration, delay }) => (
          <motion.div
            key={id}
            className={`w-[3px] rounded-full transition-colors duration-500 ${barClass}`}
            animate={isActive ? { height: [4, maxH, maxH * 0.35, maxH * 0.75, 4] } : { height: 4 }}
            transition={
              isActive
                ? { duration, repeat: Infinity, delay, ease: 'easeInOut' }
                : { duration: 0.4 }
            }
          />
        ))}
      </div>

      {/* Status */}
      <div className="mt-8 flex flex-col items-center gap-1">
        <AnimatePresence mode="wait">
          <motion.p
            key={statusText}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`text-sm font-medium ${statusColor}`}
          >
            {statusText}
          </motion.p>
        </AnimatePresence>
        {!isProcessing && (
          <p className="text-xs text-muted-foreground/40">
            {isActive ? 'Tap orb to stop' : 'or hold to speak'}
          </p>
        )}
      </div>
    </motion.div>
  );
}
