import { motion } from 'framer-motion';
import { ArrowRight, Users, Building2, CheckCircle } from 'lucide-react';

interface CTAProps {
  onStartMockTest: () => void;
}

export default function CTA({ onStartMockTest }: CTAProps) {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-10 lg:p-14 space-y-8 border-b lg:border-b-0 lg:border-r border-white/5">
              <div>
                <span className="inline-block text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-4">
                  Get Started Today
                </span>
                <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                  Ready to land your dream job?
                </h2>
              </div>
              <p className="text-lg text-slate-300 leading-relaxed">
                Join thousands of candidates who've transformed their interview performance with Sophyra's adaptive AI coaching.
              </p>

              <div className="space-y-3">
                <button
                  onClick={onStartMockTest}
                  className="group w-full sm:w-auto px-8 py-4 bg-brand-electric text-white text-base font-semibold rounded-xl hover:bg-brand-electric-dark transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center sm:justify-start"
                >
                  <span>Start Mock Interview Free</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-sm text-slate-400">No credit card required • Start in under 2 minutes</p>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-brand-electric-light" />
                  <span className="text-sm text-slate-300">5,000+ candidates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-brand-electric-light" />
                  <span className="text-sm text-slate-300">50+ universities</span>
                </div>
              </div>
            </div>

            <div className="p-10 lg:p-14">
              <h3 className="text-lg font-bold text-white mb-6">Choose Your Plan</h3>
              <div className="space-y-4">
                <div className="relative bg-white/5 rounded-2xl p-6 border-2 border-brand-electric">
                  <div className="absolute -top-3 left-6 bg-brand-electric text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">Starter</h4>
                      <p className="text-slate-400 text-sm mt-0.5">Unlimited practice</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">₹799</p>
                      <p className="text-xs text-slate-400">/ month</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {['Unlimited mock interviews', 'Detailed PDF reports', 'Body language analysis', 'Adaptive AI questions'].map((item) => (
                      <li key={item} className="flex items-center text-sm text-slate-300 space-x-2">
                        <CheckCircle className="w-4 h-4 text-brand-electric-light flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-white">Single Session</h4>
                      <p className="text-slate-400 text-sm mt-0.5">One-time practice</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">₹399</p>
                      <p className="text-xs text-slate-400">/ interview</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">Perfect before an important interview</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-5 text-center">
                Enterprise plans available for universities and teams
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
