import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, Square } from 'lucide-react';

interface VoiceOrbProps {
  isRecording: boolean;
  isProcessing: boolean;
  isAISpeaking: boolean;
  onPress: () => void;
  onStop: () => void;
}

export function VoiceOrb({ isRecording, isProcessing, isAISpeaking, onPress, onStop }: VoiceOrbProps) {
  const isActive = isRecording || isProcessing || isAISpeaking;

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings */}
      <AnimatePresence>
        {isRecording && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute w-20 h-20 rounded-full border border-primary/30"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
        {isAISpeaking && (
          <>
            {[0, 1].map((i) => (
              <motion.div
                key={`speak-ring-${i}`}
                className="absolute w-20 h-20 rounded-full border border-secondary/30"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main orb */}
      <motion.button
        onClick={isRecording ? onStop : isAISpeaking ? onStop : onPress}
        disabled={isProcessing}
        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ${
          isRecording
            ? 'bg-primary/20 border-2 border-primary glow-cyan'
            : isAISpeaking
            ? 'bg-secondary/20 border-2 border-secondary glow-purple'
            : isProcessing
            ? 'bg-muted border-2 border-border'
            : 'bg-glass border-2 border-border hover:border-primary/50 hover:glow-cyan'
        }`}
        whileTap={{ scale: 0.92 }}
        whileHover={!isActive ? { scale: 1.05 } : {}}
        animate={isRecording ? { scale: [1, 1.04, 1] } : {}}
        transition={isRecording ? { duration: 1.5, repeat: Infinity } : {}}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        ) : isRecording ? (
          <Square className="w-6 h-6 text-primary fill-primary" />
        ) : isAISpeaking ? (
          <motion.div
            className="flex gap-1 items-end h-8"
            initial={false}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-secondary rounded-full"
                animate={{ height: [8, 20 + Math.random() * 12, 8] }}
                transition={{
                  duration: 0.6 + Math.random() * 0.4,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        ) : (
          <Mic className="w-8 h-8 text-muted-foreground" />
        )}
      </motion.button>

      {/* Status label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={isRecording ? 'rec' : isProcessing ? 'proc' : isAISpeaking ? 'speak' : 'idle'}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="absolute -bottom-8 text-xs text-muted-foreground whitespace-nowrap"
        >
          {isRecording
            ? 'Listening... tap to stop'
            : isProcessing
            ? 'Processing...'
            : isAISpeaking
            ? 'Habibi is speaking...'
            : 'Tap to speak'}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
