import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-card border-border/50 bg-glass-strong" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-14 h-14 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-2 glow-cyan"
          >
            <span className="text-2xl">🌙</span>
          </motion.div>
          <DialogTitle className="font-display text-2xl text-gradient-neon">Welcome</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Assalamu Alaikum — Let me get to know you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="What should I call you?"
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
              className="rounded-xl bg-muted/50 border-border/50 focus-visible:ring-primary"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium glow-cyan transition-all duration-300"
        >
          Begin Journey
        </Button>
      </DialogContent>
    </Dialog>
  );
}
