import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Brain, TrendingUp, ArrowRight, Star, CheckCircle, Zap, Shield, BookOpen, Tag, FileText } from 'lucide-react';
import { SplineScene } from './ui/splite';
import { Spotlight } from './ui/spotlight';
import { ShimmerButton } from './ui/shimmer-button';
import { TubelightNavBar } from './ui/tubelight-navbar';
import InstitutionScroll from './InstitutionScroll';

interface HeroProps {
  onStartMockTest: () => void;
  onSignIn: () => void;
}

const words = ['Frontend Engineer', 'Product Manager', 'Data Scientist', 'Software Engineer', 'UX Designer'];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

function FloatingMetric({ className, children, delay = 0 }: { className?: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const navItems = [
  { name: 'How It Works', url: '#how-it-works', icon: BookOpen },
  { name: 'Pricing', url: '#pricing', icon: Tag },
  { name: 'Reports', url: '#reports', icon: FileText },
];

function NavBar({ onStartMockTest, onSignIn }: HeroProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#030712]/80 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/20'
          : 'bg-transparent backdrop-blur-sm border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <div className="relative">
            <img src="/Adobe_Express_-_file.png" alt="Sophyra AI" className="w-8 h-8 relative z-10" style={{mixBlendMode: 'multiply'}} />
            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-sm" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">Sophyra AI</span>
        </div>

        <div className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2">
          <TubelightNavBar items={navItems} />
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={onSignIn} className="hidden md:block text-xs font-medium text-white/50 hover:text-white/90 transition-colors">
            Sign In
          </button>
          <button
            onClick={onStartMockTest}
            className="group hidden md:flex px-4 py-2 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 border border-blue-500/30 items-center gap-1.5"
          >
            Get Started
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button onClick={onStartMockTest} className="md:hidden px-3.5 py-1.5 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-semibold rounded-lg border border-blue-500/30">
            Start Free
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

function TypingRole() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 350);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-blue-400"
        >
          {words[index]}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export default function Hero({ onStartMockTest, onSignIn }: HeroProps) {
  const [splineReady, setSplineReady] = useState(false);
  const splineRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    splineRef.current = setTimeout(() => setSplineReady(true), 800);
    return () => { if (splineRef.current) clearTimeout(splineRef.current); };
  }, []);

  return (
    <>
      <NavBar onStartMockTest={onStartMockTest} onSignIn={onSignIn} />

      <section className="relative min-h-screen bg-[#030712] overflow-hidden flex flex-col">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="rgba(59,130,246,0.25)" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(59,130,246,0.07),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }}
        />

        <div className="relative flex-1 grid lg:grid-cols-2 min-h-screen">
          <div className="relative z-10 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-18 pt-24 pb-14 lg:pt-0 lg:pb-0">

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-5 w-fit"
            >
              <Zap className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-semibold text-blue-400 tracking-widest uppercase">AI Interview Intelligence</span>
              <span className="flex items-center gap-0.5 ml-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-2 h-2 fill-amber-400 text-amber-400" />)}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={0.08}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-bold leading-[1.08] tracking-tight text-white mb-3"
            >
              Sophyra decides
              <br />
              <span className="text-white/25">before the</span>
              <br />
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                  interviewer does
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-blue-500/0 via-blue-400/50 to-blue-500/0 origin-left"
                />
              </span>
            </motion.h1>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={0.16}
              className="text-sm text-white/40 mb-1"
            >
              Practice as a <span className="inline-block min-w-[140px]"><TypingRole /></span>
            </motion.div>

            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={0.2}
              className="text-sm text-white/30 leading-relaxed max-w-sm mb-7"
            >
              Adapts to your resume, role, and real-time answers. Enterprise-grade feedback before any interviewer sees your face.
            </motion.p>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={0.28}
              className="flex flex-col sm:flex-row gap-2.5 mb-6"
            >
              <ShimmerButton
                onClick={onStartMockTest}
                borderRadius="12px"
                background="rgba(37, 99, 235, 1)"
                shimmerColor="rgba(255,255,255,0.6)"
                shimmerDuration="2.5s"
                className="group px-6 py-3 text-sm font-semibold shadow-xl shadow-blue-600/25"
              >
                Start Mock Interview
                <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </ShimmerButton>
            </motion.div>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={0.35}
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
            >
              {[
                { icon: CheckCircle, label: 'No credit card' },
                { icon: Shield, label: 'Privacy-safe' },
                { icon: CheckCircle, label: '5,000+ trained' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <Icon className="w-3 h-3 text-green-400" />
                  <span className="text-[11px] text-white/30">{label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={0.42}
              className="flex items-center gap-5 pt-6 mt-6 border-t border-white/5"
            >
              {[
                { icon: Mic, label: 'Voice Analysis' },
                { icon: Brain, label: 'Adaptive AI' },
                { icon: TrendingUp, label: 'Live Feedback' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-white/[0.04] border border-white/8 rounded-lg flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-[11px] text-white/30">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="relative hidden lg:flex items-center justify-center">
            {splineReady && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="w-full h-full" />
              </motion.div>
            )}

            <FloatingMetric
              className="absolute top-24 right-6 bg-[#0a0f1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3.5 z-20 shadow-2xl"
              delay={1.0}
            >
              <p className="text-[9px] font-semibold text-white/30 uppercase tracking-widest mb-1">Confidence Score</p>
              <p className="text-2xl font-bold text-white">87<span className="text-xs font-normal text-white/25">/100</span></p>
              <div className="mt-2 w-28 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '87%' }}
                  transition={{ duration: 1.1, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                />
              </div>
            </FloatingMetric>

            <FloatingMetric
              className="absolute bottom-36 right-8 bg-[#0a0f1e]/90 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2.5 z-20 shadow-2xl"
              delay={1.2}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-green-500/15 border border-green-500/25 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-white">STAR Method</p>
                  <p className="text-[9px] text-green-400">Excellent structure</p>
                </div>
              </div>
            </FloatingMetric>

            <FloatingMetric
              className="absolute top-1/2 -translate-y-1/2 left-3 bg-[#0a0f1e]/90 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-3 z-20 shadow-2xl"
              delay={1.35}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-white">Sophyra AI</p>
                  <p className="text-[8px] text-blue-400">Analyzing...</p>
                </div>
              </div>
              <div className="flex items-end gap-0.5 h-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-500 rounded-full animate-pulse"
                    style={{ height: `${6 + (i % 3) * 4}px`, animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            </FloatingMetric>

            <FloatingMetric
              className="absolute bottom-24 left-6 bg-green-500/[0.08] backdrop-blur-xl border border-green-500/15 rounded-lg px-2.5 py-1.5 z-20"
              delay={1.5}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-300 text-[10px] font-semibold">Live Session</span>
              </div>
            </FloatingMetric>

            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#030712] to-transparent z-10 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#030712] to-transparent z-10 pointer-events-none" />
          </div>

          {splineReady && (
            <div className="lg:hidden absolute inset-0 z-0 opacity-15 pointer-events-none">
              <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="w-full h-full" />
            </div>
          )}
        </div>

        <InstitutionScroll />
      </section>
    </>
  );
}
