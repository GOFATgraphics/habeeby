import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Mic, LogOut, RotateCcw, ChevronRight, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { getUserData } from '@/hooks/useChat';

// ─── Static data ────────────────────────────────────────────────────────────

const VERSES = [
  { arabic: 'أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ', translation: 'Verily, in the remembrance of Allah do hearts find rest.', surah: 'Ar-Ra\'d', ref: '13:28' },
  { arabic: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', translation: 'Indeed, with hardship comes ease.', surah: 'Al-Inshirah', ref: '94:6' },
  { arabic: 'وَٱللَّهُ مَعَ ٱلصَّـٰبِرِينَ', translation: 'And Allah is with the patient.', surah: 'Al-Baqarah', ref: '2:153' },
  { arabic: 'ٱدْعُونِى أَسْتَجِبْ لَكُمْ', translation: 'Call upon Me; I will respond to you.', surah: 'Ghāfir', ref: '40:60' },
  { arabic: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ', translation: 'So remember Me; I will remember you.', surah: 'Al-Baqarah', ref: '2:152' },
  { arabic: 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ', translation: 'And He is with you wherever you are.', surah: 'Al-Hadid', ref: '57:4' },
  { arabic: 'لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ', translation: 'Do not despair of the mercy of Allah.', surah: 'Az-Zumar', ref: '39:53' },
  { arabic: 'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ', translation: 'Whoever relies upon Allah — He is sufficient for him.', surah: 'At-Talaq', ref: '65:3' },
  { arabic: 'إِنَّ ٱللَّهَ قَرِيبٌ مُّجِيبٌ', translation: 'Indeed, my Lord is near and responsive.', surah: 'Hud', ref: '11:61' },
  { arabic: 'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ ٱلْوَرِيدِ', translation: 'We are closer to him than his jugular vein.', surah: 'Qaf', ref: '50:16' },
  { arabic: 'حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ', translation: 'Allah is sufficient for us, and He is the best disposer of affairs.', surah: 'Āl \'Imrān', ref: '3:173' },
  { arabic: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ', translation: 'And your Lord is going to give you, and you will be satisfied.', surah: 'Ad-Duha', ref: '93:5' },
  { arabic: 'إِنَّ ٱللَّهَ لَا يُضِيعُ أَجْرَ ٱلْمُحْسِنِينَ', translation: 'Indeed, Allah does not allow to be lost the reward of the good-doers.', surah: 'At-Tawbah', ref: '9:120' },
  { arabic: 'رَبَّنَآ ءَاتِنَا فِى ٱلدُّنْيَا حَسَنَةً وَفِى ٱلْءَاخِرَةِ حَسَنَةً', translation: 'Our Lord, give us good in this world and good in the next.', surah: 'Al-Baqarah', ref: '2:201' },
];

const HADITHS = [
  { text: 'The best of you are those who learn the Quran and teach it.', source: 'Sahih al-Bukhari' },
  { text: 'None of you truly believes until he loves for his brother what he loves for himself.', source: 'Bukhari & Muslim' },
  { text: 'The most beloved deeds to Allah are those done consistently, even if they are small.', source: 'Sahih al-Bukhari' },
  { text: 'Smiling at your brother is an act of charity.', source: 'Jami\' at-Tirmidhi' },
  { text: 'A strong man is not one who wrestles; rather a strong man is one who controls himself when angry.', source: 'Sahih al-Bukhari' },
  { text: 'Speak good or remain silent.', source: 'Bukhari & Muslim' },
  { text: 'Make things easy and do not make them difficult; give glad tidings and do not repel people.', source: 'Sahih al-Bukhari' },
];

const DHIKR_ITEMS = [
  { key: 'subhanallah', arabic: 'سُبْحَانَ اللَّهِ', label: 'SubhanAllah', meaning: 'Glory be to Allah', target: 33, color: 'hsl(var(--neon-cyan))' },
  { key: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', label: 'Alhamdulillah', meaning: 'Praise be to Allah', target: 33, color: 'hsl(var(--neon-purple))' },
  { key: 'allahuakbar', arabic: 'اللَّهُ أَكْبَرُ', label: 'Allahu Akbar', meaning: 'Allah is the Greatest', target: 34, color: 'hsl(330 80% 55%)' },
] as const;

type DhikrKey = 'subhanallah' | 'alhamdulillah' | 'allahuakbar';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDailyItem<T>(arr: T[]): T {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return arr[dayOfYear % arr.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { arabic: 'صَبَاحُ الْخَيْرِ', english: 'Good Morning' };
  if (h >= 12 && h < 17) return { arabic: 'أَهْلاً وَسَهْلاً', english: 'Good Afternoon' };
  if (h >= 17 && h < 21) return { arabic: 'مَسَاءُ الْخَيْرِ', english: 'Good Evening' };
  return { arabic: 'السَّلَامُ عَلَيْكُمْ', english: 'Peace be upon you' };
}

function getHijriDate(): string {
  const now = new Date();
  const jd = Math.floor(now.getTime() / 86400000) + 2440587;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  const months = ["Muharram","Ṣafar","Rabī' al-Awwal","Rabī' al-Thānī","Jumādā al-Awwal","Jumādā al-Thānī","Rajab","Sha'bān","Ramaḍān","Shawwāl","Dhū al-Qi'dah","Dhū al-Ḥijjah"];
  return `${day} ${months[Math.max(0, month - 1)]}, ${year} AH`;
}

function loadDhikr(): Record<DhikrKey, number> {
  try {
    const stored = JSON.parse(localStorage.getItem('habibi-dhikr') ?? '{}');
    const today = new Date().toISOString().split('T')[0];
    if (stored.date === today) return stored.counts;
  } catch {}
  return { subhanallah: 0, alhamdulillah: 0, allahuakbar: 0 };
}

function saveDhikr(counts: Record<DhikrKey, number>) {
  localStorage.setItem('habibi-dhikr', JSON.stringify({ date: new Date().toISOString().split('T')[0], counts }));
}

// ─── SVG progress ring ───────────────────────────────────────────────────────

function RingProgress({ count, target, color, size = 72 }: { count: number; target: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const progress = Math.min(count / target, 1);
  const offset = circ - progress * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.35s ease' }} />
    </svg>
  );
}

// ─── Fade-in card wrapper ────────────────────────────────────────────────────

function FadeCard({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const userData = getUserData();
  const greeting = getGreeting();
  const dailyVerse = getDailyItem(VERSES);
  const dailyHadith = getDailyItem(HADITHS);
  const hijriDate = getHijriDate();

  const [dhikr, setDhikr] = useState<Record<DhikrKey, number>>(loadDhikr);

  // Persist dhikr counts
  useEffect(() => { saveDhikr(dhikr); }, [dhikr]);

  const incrementDhikr = useCallback((key: DhikrKey) => {
    setDhikr(prev => {
      const item = DHIKR_ITEMS.find(d => d.key === key)!;
      const next = prev[key] >= item.target ? 0 : prev[key] + 1;
      return { ...prev, [key]: next };
    });
    if (navigator.vibrate) navigator.vibrate(8);
  }, []);

  const resetDhikr = useCallback(() => {
    setDhikr({ subhanallah: 0, alhamdulillah: 0, allahuakbar: 0 });
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const displayName = userData?.name || user?.email?.split('@')[0] || 'Friend';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="h-full overflow-y-auto bg-background bg-grid-pattern relative">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-24 -top-24 h-[450px] w-[450px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--neon-cyan)/0.09) 0%, transparent 70%)' }}
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--neon-purple)/0.09) 0%, transparent 70%)' }}
          animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Header */}
      <header className="safe-top sticky top-0 z-20 flex items-center justify-between border-b border-border/30 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">{hijriDate}</p>
          <p className="text-sm font-medium text-foreground">
            <span className="text-muted-foreground">{greeting.english}, </span>
            <span className="text-gradient-neon font-semibold">{displayName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary glow-cyan">
            {initials}
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-lg space-y-4 px-4 pb-12 pt-5">

        {/* Arabic greeting */}
        <FadeCard delay={0.05}>
          <div className="text-center">
            <p className="font-display text-2xl text-gradient-neon" style={{ direction: 'rtl', fontVariant: 'normal' }}>
              {greeting.arabic}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60 font-mono">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          </div>
        </FadeCard>

        {/* Daily Verse — hero card */}
        <FadeCard delay={0.12}>
          <div className="rounded-2xl border border-border/50 bg-glass overflow-hidden">
            {/* Gradient band at top */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary opacity-70" />
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Verse of the Day</span>
              </div>

              {/* Arabic */}
              <p
                className="mb-4 text-right font-display text-2xl leading-loose text-foreground"
                style={{ direction: 'rtl', lineHeight: '2.2' }}
              >
                {dailyVerse.arabic}
              </p>

              {/* Translation */}
              <p className="mb-3 text-sm italic leading-relaxed text-muted-foreground">
                "{dailyVerse.translation}"
              </p>

              {/* Reference badge */}
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 font-mono text-[10px] text-primary">
                  {dailyVerse.surah} · {dailyVerse.ref}
                </span>
              </div>
            </div>
          </div>
        </FadeCard>

        {/* Quick actions */}
        <FadeCard delay={0.2}>
          <div className="grid grid-cols-2 gap-3">
            {/* Chat */}
            <button
              onClick={() => navigate('/chat')}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-glass p-4 text-left transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_24px_hsl(var(--neon-cyan)/0.15)] active:scale-95"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 group-hover:glow-cyan transition-all">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Start Chatting</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Text with Habibi</p>
              <ChevronRight className="absolute right-3 bottom-3 h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </button>

            {/* Voice */}
            <button
              onClick={() => navigate('/chat', { state: { mode: 'voice' } })}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-glass p-4 text-left transition-all duration-300 hover:border-secondary/40 hover:shadow-[0_0_24px_hsl(var(--neon-purple)/0.15)] active:scale-95"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(ellipse at top right, hsl(var(--neon-purple)/0.08) 0%, transparent 60%)' }} />
              <div className="relative mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 border border-secondary/20 group-hover:shadow-[0_0_16px_hsl(var(--neon-purple)/0.3)] transition-all">
                <Mic className="h-5 w-5 text-secondary" />
              </div>
              <p className="relative text-sm font-semibold text-foreground">Voice Mode</p>
              <p className="relative mt-0.5 text-xs text-muted-foreground">Talk to Habibi</p>
              <ChevronRight className="absolute right-3 bottom-3 h-4 w-4 text-muted-foreground/40 group-hover:text-secondary transition-colors" />
            </button>
          </div>
        </FadeCard>

        {/* Dhikr counter */}
        <FadeCard delay={0.28}>
          <div className="rounded-2xl border border-border/50 bg-glass p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Daily Dhikr</span>
              </div>
              <button
                onClick={resetDhikr}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {DHIKR_ITEMS.map((item) => {
                const count = dhikr[item.key];
                const done = count >= item.target;
                return (
                  <button
                    key={item.key}
                    onClick={() => incrementDhikr(item.key)}
                    className="group flex flex-col items-center gap-2 rounded-xl p-2 transition-all active:scale-90"
                  >
                    <div className="relative">
                      <RingProgress count={count} target={item.target} color={item.color} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-bold tabular-nums ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {count}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-medium leading-none text-foreground">{item.label}</p>
                      <p className="mt-0.5 text-[9px] text-muted-foreground/60">of {item.target}</p>
                    </div>
                    {done && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-[10px]"
                      >
                        ✅
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-center text-[10px] text-muted-foreground/40 font-mono">
              Tap to count · Resets daily
            </p>
          </div>
        </FadeCard>

        {/* Hadith of the day */}
        <FadeCard delay={0.36}>
          <div className="rounded-2xl border border-border/50 bg-glass p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-secondary">Hadith of the Day</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 italic">
              "{dailyHadith.text}"
            </p>
            <p className="mt-3 text-right font-mono text-[10px] text-muted-foreground/60">
              — {dailyHadith.source}
            </p>
          </div>
        </FadeCard>

        {/* Footer dua */}
        <FadeCard delay={0.44}>
          <div className="py-4 text-center">
            <p className="font-display text-sm text-muted-foreground/50" style={{ direction: 'rtl' }}>
              رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً
            </p>
            <p className="mt-1 text-xs text-muted-foreground/30">
              Our Lord, give us good in this world and good in the Hereafter.
            </p>
          </div>
        </FadeCard>

      </main>
    </div>
  );
}
