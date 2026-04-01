import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, MessageSquare, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { VoiceOrb } from '@/components/VoiceOrb';
import { OnboardingModal } from '@/components/OnboardingModal';
import { useChat, getUserData } from '@/hooks/useChat';
import { useVoice } from '@/hooks/useVoice';
import { useSpeechToSpeech } from '@/hooks/useSpeechToSpeech';

const Chat = () => {
  const navigate = useNavigate();
  const { messages, isLoading, sendMessage, clearHistory, toggleReaction } = useChat();
  const { isRecording, playingMessageId, startRecording, stopRecording, playTTS } = useVoice();
  const speechToSpeech = useSpeechToSpeech(sendMessage);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userData = getUserData();

  useEffect(() => {
    if (!userData) setShowOnboarding(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-play TTS for last assistant message in voice mode
  useEffect(() => {
    if (mode === 'voice' && !isLoading && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.content && !speechToSpeech.isAISpeaking) {
        speechToSpeech.speakResponse(lastMsg.content, lastMsg.id);
      }
    }
  }, [isLoading, messages.length]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    const user = getUserData();
    if (user) {
      sendMessage(`Assalamu Alaikum! My name is ${user.name}. ${user.intention}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background bg-grid-pattern relative overflow-hidden">
      {/* Ambient orb */}
      <div className="absolute top-[-30%] right-[-20%] w-[400px] h-[400px] orb-gradient rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2.5 border-b border-border/50 bg-glass-strong relative z-10 safe-top flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground h-8 w-8" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center glow-cyan">
              <span className="text-sm">🌙</span>
            </div>
            <div>
              <h1 className="font-display text-sm font-semibold leading-tight text-foreground">Habibi</h1>
              <p className="text-[10px] text-muted-foreground font-mono leading-none">QURAN COMPANION</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Mode toggle */}
          <div className="flex bg-muted/50 rounded-full p-0.5 mr-1">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full h-7 px-2.5 text-xs transition-all ${mode === 'text' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
              onClick={() => setMode('text')}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Text
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full h-7 px-2.5 text-xs transition-all ${mode === 'voice' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
              onClick={() => setMode('voice')}
            >
              <Mic className="w-3 h-3 mr-1" />
              Voice
            </Button>
          </div>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-destructive h-8 w-8"
              onClick={clearHistory}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 md:py-6 relative z-10 min-h-0">
        <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
          {messages.length === 0 && !showOnboarding && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 md:py-20"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full bg-glass border border-border flex items-center justify-center mb-4 animate-float glow-cyan">
                <span className="text-xl md:text-2xl">🌙</span>
              </div>
              <h2 className="font-display text-lg md:text-xl text-foreground mb-2">
                Assalamu Alaikum{userData?.name ? `, ${userData.name}` : ''}
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs md:max-w-sm mx-auto">
                {mode === 'voice'
                  ? 'Tap the orb below to start a voice conversation.'
                  : 'Type a message or switch to voice mode to begin.'}
              </p>
            </motion.div>
          )}

          {messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
              isPlaying={playingMessageId === message.id}
              onPlayTTS={playTTS}
            />
          ))}

          {isLoading && messages[messages.length - 1]?.content === '' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2 md:gap-3"
            >
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center text-[10px] md:text-xs font-mono text-secondary flex-shrink-0">AI</div>
              <div className="bg-glass rounded-2xl rounded-tl-sm px-3 md:px-4 py-2.5 md:py-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 bg-primary rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <AnimatePresence mode="wait">
        {mode === 'voice' ? (
          <motion.div
            key="voice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border/50 bg-glass-strong p-6 md:p-8 flex justify-center relative z-10 safe-bottom flex-shrink-0"
          >
            <VoiceOrb
              isRecording={speechToSpeech.isRecording}
              isProcessing={speechToSpeech.isProcessing}
              isAISpeaking={speechToSpeech.isAISpeaking}
              onPress={speechToSpeech.startListening}
              onStop={speechToSpeech.isAISpeaking ? speechToSpeech.stopSpeaking : speechToSpeech.stopListening}
            />
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex-shrink-0 safe-bottom"
          >
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              isRecording={isRecording}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding */}
      <OnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} />
    </div>
  );
};

export default Chat;
