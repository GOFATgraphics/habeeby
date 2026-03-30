import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { OnboardingModal } from '@/components/OnboardingModal';
import { useChat, getUserData } from '@/hooks/useChat';
import { useVoice } from '@/hooks/useVoice';

const Chat = () => {
  const navigate = useNavigate();
  const { messages, isLoading, sendMessage, clearHistory } = useChat();
  const { isRecording, playingMessageId, startRecording, stopRecording, playTTS } = useVoice();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userData = getUserData();

  useEffect(() => {
    if (!userData) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Send a greeting
    const user = getUserData();
    if (user) {
      sendMessage(`Assalamu Alaikum! My name is ${user.name}. ${user.intention}`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌙</span>
            <div>
              <h1 className="font-display text-lg font-semibold leading-tight">Habibi</h1>
              <p className="text-xs text-muted-foreground">Your Quran Companion</p>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-destructive"
            onClick={clearHistory}
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && !showOnboarding && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🌙</div>
              <h2 className="font-display text-2xl text-foreground mb-2">Assalamu Alaikum{userData?.name ? `, ${userData.name}` : ''}!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Share what's on your heart — a question, a feeling, a struggle, or a joy.
                I'm here for you, always.
              </p>
            </div>
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
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-habibi-gold flex items-center justify-center text-sm">🌙</div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-gentle" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-gentle" style={{ animationDelay: '0.3s' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-gentle" style={{ animationDelay: '0.6s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />

      {/* Onboarding */}
      <OnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} />
    </div>
  );
};

export default Chat;
