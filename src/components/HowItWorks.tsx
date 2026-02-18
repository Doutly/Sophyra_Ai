import { motion } from 'framer-motion';
import { Upload, MessageSquare, FileText, ArrowRight, Zap } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      number: '01',
      title: 'Setup Your Session',
      description: 'Upload your resume, paste the job description, and select your experience level. Takes less than 2 minutes.',
      highlight: 'Role-specific context',
      color: 'blue',
    },
    {
      icon: MessageSquare,
      number: '02',
      title: 'Live AI Interview',
      description: 'Sophyra asks 6–10 adaptive questions tailored to your profile. Answer via voice or text with real-time coaching.',
      highlight: '12–18 minutes',
      color: 'cyan',
    },
    {
      icon: FileText,
      number: '03',
      title: 'Get Your Report',
      description: 'Receive a Big-Tech grade certificate, detailed scores, and a personalized growth plan. Download as PDF or share.',
      highlight: 'Enterprise-grade insights',
      color: 'emerald',
    },
  ];

  const colorConfig: Record<string, { icon: string; number: string; line: string; tag: string }> = {
    blue: {
      icon: 'bg-blue-600',
      number: 'text-blue-500/20',
      line: 'from-blue-500/30',
      tag: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    cyan: {
      icon: 'bg-cyan-600',
      number: 'text-cyan-500/20',
      line: 'from-cyan-500/30',
      tag: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    emerald: {
      icon: 'bg-emerald-600',
      number: 'text-emerald-500/20',
      line: 'from-emerald-500/30',
      tag: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
  };

  return (
    <section id="how-it-works" className="py-28 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_-10%,rgba(59,130,246,0.05),transparent)]" />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">

        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-5 tracking-widest uppercase">
              <Zap className="w-3.5 h-3.5" />
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
              Three steps to your
              <br />
              <span className="text-white/30">best interview ever</span>
            </h2>
            <p className="text-base text-white/40 leading-relaxed">
              From setup to certified report in under 25 minutes
            </p>
          </motion.div>
        </div>

        <div className="relative grid lg:grid-cols-3 gap-6">
          <div className="absolute top-[3.5rem] left-[calc(33.33%-1rem)] right-[calc(33.33%-1rem)] h-px bg-gradient-to-r from-white/5 via-white/10 to-white/5 hidden lg:block" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            const cfg = colorConfig[step.color];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.15 }}
                className="relative group"
              >
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-7 h-full hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <span className={`text-7xl font-black ${cfg.number} select-none leading-none`}>
                      {step.number}
                    </span>
                    <div className={`w-14 h-14 ${cfg.icon} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed mb-5">{step.description}</p>

                  <span className={`inline-flex items-center text-[10px] font-semibold ${cfg.tag} border px-2.5 py-1 rounded-full tracking-wide uppercase`}>
                    {step.highlight}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-[3.5rem] -right-3 z-10 w-6 h-6 bg-slate-800 border border-white/10 rounded-full items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-white/30" />
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
          className="mt-14 text-center"
        >
          <button className="group inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-base font-semibold rounded-xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 hover:-translate-y-0.5">
            Start Your First Mock Test
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
