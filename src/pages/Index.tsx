import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mic, Brain, Zap, Waves } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Wisdom',
    description: 'Deep conversations grounded in Quranic knowledge and authentic Hadith.',
  },
  {
    icon: Mic,
    title: 'Voice-to-Voice',
    description: 'Speak naturally and hear Habibi respond — real-time speech-to-speech.',
  },
  {
    icon: Waves,
    title: 'Streaming Responses',
    description: 'Watch answers flow in real-time with beautiful streaming text.',
  },
  {
    icon: Zap,
    title: 'Instant Guidance',
    description: 'Personalized spiritual companionship tailored to your journey.',
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate('/chat', { replace: true });
  }, [user, loading, navigate]);

  if (!loading && user) return null;

  return (
    <div className="h-full overflow-y-auto bg-background bg-grid-pattern relative">
      {/* Ambient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] orb-gradient rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(260 60% 55% / 0.1) 0%, transparent 70%)' }} />

      {/* Hero */}
      <section className="relative z-10 safe-top">
        <div className="container mx-auto px-6 py-16 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-glass glow-cyan flex items-center justify-center mb-5 animate-float">
              <span className="text-2xl md:text-3xl">🌙</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-display text-4xl md:text-7xl lg:text-8xl font-bold text-gradient-neon mb-3 tracking-tight"
          >
            Habibi
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground text-base md:text-xl max-w-xl mx-auto mb-3 font-light"
          >
            Your Quran Companion
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-muted-foreground/70 text-sm max-w-md mx-auto mb-8"
          >
            A wise AI companion that helps you internalize the Quran and Sunnah through voice conversations and heartfelt guidance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button
              size="lg"
              className="rounded-full px-8 py-5 md:px-10 md:py-6 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan transition-all duration-300 active:scale-95"
              onClick={() => navigate('/chat')}
            >
              Start Conversation
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-16 md:py-24 relative z-10">
        <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-3xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
              className="bg-glass rounded-2xl p-4 md:p-6 transition-all duration-500 group"
            >
              <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-primary mb-2 md:mb-3" />
              <h3 className="font-display text-sm md:text-base font-semibold text-foreground mb-1">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 md:py-8 text-center relative z-10 safe-bottom">
        <p className="text-muted-foreground/60 text-sm font-mono">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <p className="text-muted-foreground/40 text-xs mt-1">
          In the name of Allah, the Most Gracious, the Most Merciful
        </p>
      </footer>
    </div>
  );
};

export default Index;
