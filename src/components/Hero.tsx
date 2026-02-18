import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Brain, TrendingUp, ArrowRight, Star, CheckCircle, Zap, Shield, Award } from 'lucide-react';
import { SplineScene } from './ui/splite';
import { Spotlight } from './ui/spotlight';

interface HeroProps {
  onStartMockTest: () => void;
  onSignIn: () => void;
}

const words = ['Frontend Engineer', 'Product Manager', 'Data Scientist', 'Software Engineer', 'UX Designer'];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

function FloatingMetric({
  className,
  children,
  delay = 0,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function NavBar({ onStartMockTest, onSignIn }: HeroProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img src="/lo.png" alt="Sophyra AI" className="w-9 h-9 relative z-10" />
            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-md" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Sophyra AI</span>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <a href="#how-it-works" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
            Pricing
          </a>
          <a href="#reports" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
            Reports
          </a>
          <button
            onClick={onSignIn}
            className="text-sm font-medium text-white/60 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onStartMockTest}
            className="group relative px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg overflow-hidden transition-all hover:bg-blue-500 shadow-lg shadow-blue-600/30"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              Get Started Free
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>

        <button
          onClick={onStartMockTest}
          className="md:hidden px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg"
        >
          Start Free
        </button>
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
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-blue-400"
        >
          {words[index]}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export default function Hero({ onStartMockTest, onSignIn }: HeroProps) {
  return (
    <>
      <NavBar onStartMockTest={onStartMockTest} onSignIn={onSignIn} />

      <section className="relative min-h-screen bg-slate-950 overflow-hidden flex flex-col">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="rgba(59,130,246,0.3)" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.08),rgba(255,255,255,0))]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative flex-1 grid lg:grid-cols-2 min-h-screen">
          <div className="relative z-10 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 pt-28 pb-16 lg:pt-0 lg:pb-0">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6 w-fit"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 tracking-wide uppercase">AI-Powered Interview Intelligence</span>
              <span className="flex items-center space-x-0.5 ml-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                ))}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.1}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-white mb-4"
            >
              Sophyra decides
              <br />
              <span className="text-white/30">before the</span>
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                  interviewer does
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.9, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-blue-500/0 via-blue-400/60 to-blue-500/0 origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.2}
              className="text-base sm:text-lg text-white/50 leading-relaxed max-w-lg mb-2"
            >
              Practice as a{' '}
              <span className="inline-block min-w-[160px]">
                <TypingRole />
              </span>
            </motion.p>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.25}
              className="text-base text-white/40 leading-relaxed max-w-lg mb-8"
            >
              Sophyra adapts to your resume, role, and real-time answers — delivering enterprise-grade
              feedback before any real interviewer sees your face.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.35}
              className="flex flex-col sm:flex-row gap-3 mb-8"
            >
              <button
                onClick={onStartMockTest}
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white text-base font-semibold rounded-xl overflow-hidden transition-all hover:bg-blue-500 shadow-2xl shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Mock Interview
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <button className="inline-flex items-center justify-center px-8 py-4 bg-white/5 text-white text-base font-semibold rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
                Watch Demo
              </button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.45}
              className="flex flex-wrap items-center gap-x-5 gap-y-2"
            >
              {[
                { icon: CheckCircle, label: 'No credit card required' },
                { icon: Shield, label: 'Privacy-safe' },
                { icon: CheckCircle, label: '5,000+ trained' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center space-x-1.5">
                  <Icon className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs text-white/40">{label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.55}
              className="flex items-center gap-6 pt-8 mt-8 border-t border-white/5"
            >
              {[
                { icon: Mic, label: 'Voice Analysis' },
                { icon: Brain, label: 'Adaptive AI' },
                { icon: TrendingUp, label: 'Live Feedback' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-white/40">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="relative lg:flex items-center justify-center hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              className="absolute inset-0"
            >
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </motion.div>

            <FloatingMetric
              className="absolute top-24 right-8 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 z-20 shadow-2xl"
              delay={1.0}
            >
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1">Confidence Score</p>
              <p className="text-3xl font-bold text-white">87<span className="text-sm font-normal text-white/30">/100</span></p>
              <div className="mt-2 w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '87%' }}
                  transition={{ duration: 1.2, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                />
              </div>
            </FloatingMetric>

            <FloatingMetric
              className="absolute bottom-32 right-10 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 z-20 shadow-2xl"
              delay={1.2}
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">STAR Method</p>
                  <p className="text-[10px] text-green-400 font-medium">Excellent structure</p>
                </div>
              </div>
            </FloatingMetric>

            <FloatingMetric
              className="absolute top-1/2 -translate-y-1/2 left-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 z-20 shadow-2xl"
              delay={1.4}
            >
              <div className="flex items-center space-x-2.5 mb-2">
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-white">Sophyra AI</p>
                  <p className="text-[9px] text-blue-400">Analyzing your response...</p>
                </div>
              </div>
              <div className="flex space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-500 rounded-full animate-pulse"
                    style={{
                      height: `${8 + (i % 3) * 6}px`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
            </FloatingMetric>

            <FloatingMetric
              className="absolute bottom-20 left-8 bg-green-500/10 backdrop-blur-xl border border-green-500/20 rounded-xl px-3 py-2 z-20"
              delay={1.6}
            >
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-300 text-xs font-semibold">Live Session</span>
              </div>
            </FloatingMetric>

            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none" />
          </div>

          <div className="lg:hidden absolute inset-0 z-0 opacity-20">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </div>

        <div className="relative z-10 border-t border-white/5 py-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <p className="text-center text-[11px] text-white/20 font-medium tracking-widest uppercase mb-4">
              Trusted by candidates from India's leading institutions
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {['IIT', 'IIM', 'BITS', 'NIT', 'VIT', 'IISC', 'NSIT'].map((name) => (
                <span key={name} className="text-base font-bold text-white/15 tracking-widest">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
