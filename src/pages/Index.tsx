import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircleHeart, BookOpen, Mic, Sparkles } from 'lucide-react';

const features = [
  {
    icon: MessageCircleHeart,
    title: 'Heart-to-Heart Conversations',
    description: 'Share your joys, struggles, and questions — Habibi responds with Quranic wisdom and warmth.',
  },
  {
    icon: BookOpen,
    title: 'Quran & Sunnah Integration',
    description: 'Every response is grounded in authentic verses and hadith, cited beautifully.',
  },
  {
    icon: Mic,
    title: 'Voice Interaction',
    description: 'Speak your heart and listen to Habibi\'s responses — like talking to a wise friend.',
  },
  {
    icon: Sparkles,
    title: 'Personalized Guidance',
    description: 'Habibi remembers your journey and tailors advice to your life and emotional state.',
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background bg-pattern-islamic">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32 text-center">
          {/* Decorative crescent */}
          <div className="text-6xl md:text-8xl mb-6 animate-fade-in-up">🌙</div>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 animate-fade-in-up">
            Habibi
          </h1>
          <p className="text-gradient-gold font-display text-xl md:text-2xl mb-6 animate-fade-in-up">
            Your Quran Companion
          </p>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 font-body animate-fade-in-up">
            A warm, wise companion who helps you internalize the Quran and Sunnah
            into your daily life, emotions, and heart.
          </p>

          <Button
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-medium bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all animate-fade-in-up"
            onClick={() => navigate('/chat')}
          >
            Begin Your Journey 🤲
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow"
            >
              <feature.icon className="w-8 h-8 text-habibi-gold mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-muted-foreground text-sm font-body">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          In the name of Allah, the Most Gracious, the Most Merciful
        </p>
      </footer>
    </div>
  );
};

export default Index;
