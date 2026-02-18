import { motion } from 'framer-motion';
import { Upload, MessageSquare, FileText, ArrowRight, Zap } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      number: '01',
      title: 'Upload resume & job description',
      description: 'Upload your resume, paste the job description, and select your experience level. Setup takes under 2 minutes.',
      highlight: 'Setup takes under 2 minutes',
      color: 'blue',
    },
    {
      icon: MessageSquare,
      number: '02',
      title: 'Live AI-driven mock interview',
      description: 'Sophyra asks 6–10 adaptive questions tailored to your profile. Answer via voice or text with real-time coaching and guidance.',
      highlight: '6–10 adaptive questions tailored to you',
      color: 'cyan',
    },
    {
      icon: FileText,
      number: '03',
      title: 'Get your Performance Certificate',
      description: 'Receive a Big-Tech grade certificate, detailed scores, and a personalized growth plan. Download as PDF or share with employers.',
      highlight: 'Big-Tech grade report with action plan',
      color: 'emerald',
    },
  ];

  const colorConfig: Record<string, { icon: string; number: string; border: string; tag: string; glow: string }> = {
    blue: {
      icon: 'bg-blue-600',
      number: 'text-blue-500/15',
      border: 'hover:border-blue-500/30',
      tag: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      glow: 'from-blue-500/10',
    },
    cyan: {
      icon: 'bg-cyan-600',
      number: 'text-cyan-500/15',
      border: 'hover:border-cyan-500/30',
      tag: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      glow: 'from-cyan-500/10',
    },
    emerald: {
      icon: 'bg-emerald-600',
      number: 'text-emerald-500/15',
      border: 'hover:border-emerald-500/30',
      tag: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      glow: 'from-emerald-500/10',
    },
  };

  return (
    <section id="how-it-works" className="py-32 bg-[#030712] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_-10%,rgba(59,130,246,0.06),transparent)]" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">

        <div className="text-center max-w-4xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full mb-7 tracking-widest uppercase">
              <Zap className="w-3.5 h-3.5" />
              How It Works
            </span>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.05]">
              Three steps to your
              <br />
              <span className="text-white/40">best interview ever</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/50 leading-relaxed">
              From setup to certified report in under 25 minutes
            </p>
          </motion.div>
        </div>

        <div className="relative grid lg:grid-cols-3 gap-6">
          <div className="absolute top-[4.5rem] left-[calc(33.33%-0.75rem)] right-[calc(33.33%-0.75rem)] h-px bg-gradient-to-r from-white/5 via-white/15 to-white/5 hidden lg:block" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            const cfg = colorConfig[step.color];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.15 }}
                className="relative group"
              >
                <div className={`relative bg-white/[0.02] border border-white/5 rounded-3xl p-8 lg:p-10 h-full ${cfg.border} hover:bg-white/[0.04] transition-all duration-300 overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${cfg.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl`} />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-8">
                      <span className={`text-8xl font-black ${cfg.number} select-none leading-none`}>
                        {step.number}
                      </span>
                      <div className={`w-16 h-16 ${cfg.icon} rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-4 leading-tight">{step.title}</h3>
                    <p className="text-base text-white/50 leading-relaxed mb-6">{step.description}</p>

                    <span className={`inline-flex items-center text-xs font-semibold ${cfg.tag} border px-3 py-1.5 rounded-full tracking-wide`}>
                      {step.highlight}
                    </span>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-[4.5rem] -right-3 z-10 w-7 h-7 bg-slate-800 border border-white/10 rounded-full items-center justify-center shadow-lg">
                    <ArrowRight className="w-3.5 h-3.5 text-white/40" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <button className="group inline-flex items-center gap-3 px-10 py-5 bg-blue-600 text-white text-lg font-semibold rounded-2xl hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/25 hover:-translate-y-0.5">
            Start Your First Mock Test
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-4 text-sm text-white/30">No credit card required · Free to start</p>
        </motion.div>
      </div>
    </section>
  );
}
