import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Mic, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { VoiceInterface } from '@/components/VoiceInterface';
import { OnboardingModal } from '@/components/OnboardingModal';
import { ChatMessage as ChatMessageType, useChat, getUserData } from '@/hooks/useChat';
import { useVoice } from '@/hooks/useVoice';
import { useSpeechToSpeech } from '@/hooks/useSpeechToSpeech';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading: authLoading } = useAuth();
  const { messages, isLoading, isLoadingHistory, sendMessage, clearHistory, toggleReaction } = useChat(
    user?.id,
    () => {
      // ProtectedRoute already ensures the user is authenticated.
      // A 401 here is a transient token issue — just show an error and stay on the page.
      toast.error('Connection issue — please try again.');
    }
  );
  const { isRecording, playingMessageId, startRecording, stopRecording, playTTS } = useVoice();
  const {
    isRecording: isVoiceRecording,
    isProcessing,
    isAISpeaking,
    startListening,
    stopListening,
    speakResponse,
    stopSpeaking,
  } = useSpeechToSpeech(sendMessage);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>(
    (location.state as { mode?: string } | null)?.mode === 'voice' ? 'voice' : 'text'
  );
  const [replyTo, setReplyTo] = useState<ChatMessageType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const userData = getUserData(user?.id);

  useEffect(() => {
    if (!authLoading && !userData) setShowOnboarding(true);
  }, [authLoading, userData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (mode !== 'voice' || isLoading || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role === 'assistant' &&
      lastMessage.content &&
      !isAISpeaking &&
      lastMessage.id !== lastSpokenIdRef.current
    ) {
      lastSpokenIdRef.current = lastMessage.id;
      void speakResponse(lastMessage.content, lastMessage.id);
    }
  }, [mode, isLoading, messages, isAISpeaking, speakResponse]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    const currentUserData = getUserData();
    if (currentUserData) {
      void sendMessage(`Assalamu Alaikum! My name is ${currentUserData.name}. ${currentUserData.intention}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSend = async (content: string) => {
    await sendMessage(content, replyTo);
    setReplyTo(null);
  };

  if (authLoading || isLoadingHistory) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background bg-grid-pattern">
      <div className="pointer-events-none absolute right-[-20%] top-[-30%] h-[400px] w-[400px] rounded-full orb-gradient blur-3xl" />

      <header className="safe-top relative z-10 flex shrink-0 items-center justify-between border-b border-border/50 bg-glass-strong px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10 glow-cyan">
              <span className="text-sm">🌙</span>
            </div>
            <div>
              <h1 className="font-display text-sm font-semibold leading-tight text-foreground">Habibi</h1>
              <p className="font-mono text-[10px] leading-none text-muted-foreground">QURAN COMPANION</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full transition-all ${mode === 'voice' ? 'bg-primary/20 text-primary glow-cyan' : 'text-muted-foreground hover:text-primary'}`}
            onClick={() => setMode(mode === 'voice' ? 'text' : 'voice')}
            title={mode === 'voice' ? 'Switch to text' : 'Switch to voice'}
          >
            <Mic className="h-3.5 w-3.5" />
          </Button>

          {messages.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear conversation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all messages in this conversation. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Clear all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => navigate('/home')}>
            <Home className="h-3.5 w-3.5" />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-4 md:py-6">
        <div className="mx-auto max-w-3xl space-y-3 md:space-y-4">
          {messages.length === 0 && !showOnboarding && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-16 text-center md:py-20">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-glass glow-cyan animate-float md:h-16 md:w-16">
                <span className="text-xl md:text-2xl">🌙</span>
              </div>
              <h2 className="mb-2 font-display text-lg text-foreground md:text-xl">
                Assalamu Alaikum{userData?.name ? `, ${userData.name}` : ''}
              </h2>
              <p className="mx-auto max-w-xs text-sm text-muted-foreground md:max-w-sm">
                {mode === 'voice' ? 'Tap the orb below to start a voice conversation.' : 'Type a message or switch to voice mode to begin.'}
              </p>
            </motion.div>
          )}

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isPlaying={playingMessageId === message.id}
              onPlayTTS={playTTS}
              onReact={toggleReaction}
              onReply={setReplyTo}
            />
          ))}

          {isLoading && messages[messages.length - 1]?.content === '' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 md:gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-secondary/30 bg-secondary/10 text-[10px] font-mono text-secondary md:h-8 md:w-8 md:text-xs">AI</div>
              <div className="rounded-2xl rounded-tl-sm bg-glass px-3 py-2.5 md:px-4 md:py-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <motion.div key="text" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="safe-bottom relative z-10 shrink-0">
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
        />
      </motion.div>

      <AnimatePresence>
        {mode === 'voice' && (
          <VoiceInterface
            isRecording={isVoiceRecording}
            isProcessing={isProcessing}
            isAISpeaking={isAISpeaking}
            onStart={startListening}
            onStop={isAISpeaking ? stopSpeaking : stopListening}
            onClose={() => setMode('text')}
          />
        )}
      </AnimatePresence>

      <OnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} userId={user?.id} />
    </div>
  );
};

export default Chat;
