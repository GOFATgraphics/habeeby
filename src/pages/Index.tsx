import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mic, Brain, Zap, Waves } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-background bg-grid-pattern relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] orb-gradient rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(260 60% 55% / 0.1) 0%, transparent 70%)' }} />

      {/* Hero */}
      <section className="relative z-10">
        <div className="container mx-auto px-4 py-20 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-glass glow-cyan flex items-center justify-center mb-6 animate-float">
              <span className="text-3xl">🌙</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-gradient-neon mb-4 tracking-tight"
          >
            Habibi
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-4 font-light"
          >
            Your Quran Companion
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-muted-foreground/70 text-sm md:text-base max-w-lg mx-auto mb-10"
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
              className="rounded-full px-10 py-6 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan transition-all duration-300 hover:scale-105"
              onClick={() => navigate('/chat')}
            >
              Start Conversation
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
              className="bg-glass rounded-2xl p-6 hover:glow-cyan transition-all duration-500 group"
            >
              <feature.icon className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-display text-base font-semibold text-foreground mb-1.5">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center relative z-10">
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
