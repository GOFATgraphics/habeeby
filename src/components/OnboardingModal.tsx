import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveUserData } from '@/hooks/useChat';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [name, setName] = useState('');
  const [intention, setIntention] = useState('');

  const handleSubmit = () => {
    saveUserData({ name: name.trim() || 'Friend', intention: intention.trim() || 'To grow closer to Allah' });
    onComplete();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-10 w-full max-w-sm bg-card border border-border/50 bg-glass-strong rounded-2xl p-6"
      >
        <div className="text-center mb-4">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-14 h-14 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-3 glow-cyan"
          >
            <span className="text-2xl">🌙</span>
          </motion.div>
          <h2 className="font-display text-xl text-gradient-neon mb-1">Welcome</h2>
          <p className="text-muted-foreground text-sm">
            Assalamu Alaikum — Let me get to know you.
          </p>
        </div>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="What should I call you?"
              maxLength={50}
              className="rounded-xl bg-muted/50 border-border/50 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intention" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Intention</Label>
            <Input
              id="intention"
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder="e.g., understand the Quran better"
              maxLength={200}
              className="rounded-xl bg-muted/50 border-border/50 focus-visible:ring-primary"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full mt-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium glow-cyan transition-all duration-300 active:scale-95"
        >
          Begin Journey
        </Button>
      </motion.div>
    </div>
  );
}
