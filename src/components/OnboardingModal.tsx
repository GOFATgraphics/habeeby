import { useState } from 'react';
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
      <DialogContent className="sm:max-w-md bg-card border-border" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="text-4xl mb-2">🌙</div>
          <DialogTitle className="font-display text-2xl">Assalamu Alaikum!</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Welcome to Habibi — your personal Quran companion. Let me get to know you a little.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">What should I call you?</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl bg-muted border-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intention" className="text-sm font-medium">What brings you here today?</Label>
            <Input
              id="intention"
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder="e.g., I want to understand the Quran better"
              className="rounded-xl bg-muted border-0"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full rounded-xl bg-primary hover:bg-primary/90 font-medium"
        >
          Begin My Journey 🤲
        </Button>
      </DialogContent>
    </Dialog>
  );
}
