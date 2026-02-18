import { motion } from 'framer-motion';
import { ArrowRight, Users, Building2, CheckCircle, Zap, Star } from 'lucide-react';

interface CTAProps {
  onStartMockTest: () => void;
}

export default function CTA({ onStartMockTest }: CTAProps) {
  return (
    <section id="pricing" className="py-28 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(59,130,246,0.05),transparent)]" />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            <Zap className="w-3.5 h-3.5" />
            Get Started Today
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
            Ready to land your
            <br />
            <span className="text-white/30">dream job?</span>
          </h2>
          <p className="text-base text-white/40 leading-relaxed">
            Join thousands of candidates who've transformed their interview performance with Sophyra's adaptive AI coaching.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 lg:p-10 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Start practicing today</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  No setup friction. Get your first AI-evaluated mock interview report within 25 minutes.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  'Personalized to your exact role & resume',
                  'Voice + text response options',
                  'Big-Tech grade performance reports',
                  'Download or share your certificate',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm text-white/50">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white/40">5,000+ candidates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white/40">50+ universities</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={onStartMockTest}
                className="group w-full flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white text-base font-semibold rounded-xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 hover:-translate-y-0.5"
              >
                Start Mock Interview Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-center text-xs text-white/20">No credit card required • Start in under 2 minutes</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="relative bg-white/[0.02] rounded-2xl p-6 border-2 border-blue-500/40">
              <div className="absolute -top-3 left-6">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wide uppercase">
                  Most Popular
                </span>
              </div>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h4 className="text-lg font-bold text-white">Starter</h4>
                  <p className="text-xs text-white/30 mt-0.5">Unlimited practice sessions</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">₹799</p>
                  <p className="text-[10px] text-white/30">/ month</p>
                </div>
              </div>
              <div className="space-y-2.5 mb-5">
                {['Unlimited mock interviews', 'Big-Tech grade PDF reports', 'Body language analysis', 'Adaptive AI questions', 'Certificate download'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-white/50">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-[10px] text-white/30 ml-1.5">4.4/5 from 500+ users</span>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-bold text-white">Single Session</h4>
                  <p className="text-xs text-white/30 mt-0.5">One-time deep practice</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">₹399</p>
                  <p className="text-[10px] text-white/30">/ interview</p>
                </div>
              </div>
              <p className="text-xs text-white/30 mb-4">Perfect before an important real interview</p>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-white/40">Full report + certificate included</span>
              </div>
            </div>

            <p className="text-[10px] text-white/20 text-center pt-1">
              Enterprise plans available for universities and teams — <span className="text-blue-400 cursor-pointer hover:text-blue-300">Contact us</span>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
