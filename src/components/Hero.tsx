import { motion } from 'framer-motion';
import { Mic, Brain, TrendingUp, ArrowRight, Star, CheckCircle } from 'lucide-react';
import { SplineScene } from './ui/splite';
import { Spotlight } from './ui/spotlight';

interface HeroProps {
  onStartMockTest: () => void;
  onSignIn: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

export default function Hero({ onStartMockTest, onSignIn }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-white">
      <nav className="relative z-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <img src="/lo.png" alt="Sophyra AI" className="w-9 h-9" />
          <span className="text-xl font-bold tracking-tight text-slate-900">Sophyra AI</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Pricing
          </a>
          <button
            onClick={onSignIn}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onStartMockTest}
            className="px-5 py-2.5 bg-brand-electric text-white text-sm font-semibold rounded-lg hover:bg-brand-electric-dark transition-all shadow-sm"
          >
            Get Started Free
          </button>
        </div>
        <button
          onClick={onStartMockTest}
          className="md:hidden px-4 py-2 bg-brand-electric text-white text-sm font-semibold rounded-lg"
        >
          Start Free
        </button>
      </nav>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
          <div className="space-y-8 relative z-10">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100"
            >
              <span className="w-2 h-2 bg-brand-electric rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-brand-electric">AI-Powered Interview Coach</span>
              <span className="ml-1 flex items-center space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.1}
              className="text-5xl sm:text-6xl lg:text-[3.75rem] font-bold leading-[1.1] tracking-tight text-slate-900"
            >
              Ace your next{' '}
              <span className="relative">
                <span className="text-brand-electric">interview</span>
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 9C60 3 120 1 150 3C180 5 240 9 298 4"
                    stroke="#2563EB"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.3"
                  />
                </svg>
              </span>{' '}
              with AI that thinks like a recruiter
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.2}
              className="text-lg text-slate-600 leading-relaxed max-w-lg"
            >
              Sophyra adapts to your resume, role, and real-time answers. Get enterprise-grade
              feedback, actionable growth plans, and the confidence to land your dream job.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.3}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={onStartMockTest}
                className="group inline-flex items-center justify-center px-8 py-4 bg-brand-electric text-white text-base font-semibold rounded-xl hover:bg-brand-electric-dark transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
              >
                Start Mock Interview
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-800 text-base font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
                Watch Demo
              </button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.4}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2"
            >
              {[
                { icon: CheckCircle, label: 'No credit card required' },
                { icon: CheckCircle, label: 'Start in under 2 minutes' },
                { icon: CheckCircle, label: '5,000+ candidates trained' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center space-x-2">
                  <Icon className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-500">{label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.5}
              className="flex items-center gap-8 pt-4 border-t border-slate-100"
            >
              {[
                { icon: Mic, label: 'Voice Analysis' },
                { icon: Brain, label: 'Adaptive AI' },
                { icon: TrendingUp, label: 'Live Feedback' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-brand-electric" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative h-[540px] lg:h-[600px]"
          >
            <div className="absolute inset-0 rounded-3xl overflow-hidden bg-slate-900 shadow-2xl shadow-slate-900/30">
              <Spotlight
                className="-top-40 left-0 md:left-60 md:-top-20"
                fill="white"
              />

              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/60 z-10 pointer-events-none" />

              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />

              <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand-electric rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">Sophyra AI</p>
                    <p className="text-blue-300 text-[10px]">Analyzing your response...</p>
                  </div>
                  <div className="flex space-x-0.5 ml-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-brand-electric-light rounded-full animate-pulse"
                        style={{
                          height: `${8 + (i % 3) * 6}px`,
                          animationDelay: `${i * 100}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-xl px-3 py-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-300 text-xs font-semibold">Live</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 z-30">
              <p className="text-xs text-slate-500 font-medium">Confidence Score</p>
              <p className="text-2xl font-bold text-slate-900">87<span className="text-sm text-slate-400">/100</span></p>
              <div className="mt-1.5 w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-[87%] bg-gradient-to-r from-brand-electric to-brand-electric-light rounded-full" />
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 z-30">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">STAR Method</p>
                  <p className="text-[10px] text-green-600 font-medium">Excellent structure</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-slate-50 border-t border-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <p className="text-center text-sm text-slate-400 font-medium mb-6">Trusted by candidates from leading institutions</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-40 grayscale">
            {['IIT', 'IIM', 'BITS', 'NIT', 'VIT', 'IISC'].map((name) => (
              <span key={name} className="text-xl font-bold text-slate-600 tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
