import { motion } from 'framer-motion';
import { Target, LineChart, FileCheck, Sparkles, Award, Shield, TrendingUp, Star, CheckCircle, Brain, Mic } from 'lucide-react';

export default function ValueProps() {
  const features = [
    {
      icon: Target,
      title: 'Adaptive Interview Intelligence',
      description: 'Every question is personalized from your job description, resume, experience, and previous answers — never generic, always relevant.',
      tag: 'Hyper-personalized',
      color: 'blue',
    },
    {
      icon: LineChart,
      title: 'Live Body Signal Analysis',
      description: 'Real-time attention, eye contact, pacing, and filler word detection. Privacy-safe, processed locally on your device.',
      tag: 'Privacy-safe',
      color: 'emerald',
    },
    {
      icon: FileCheck,
      title: 'Big-Tech Grade Reports',
      description: 'Detailed scores, strengths, gaps, and personalized growth plans — the same depth of feedback used at Google, Amazon, and McKinsey.',
      tag: 'Enterprise-grade',
      color: 'blue',
    },
    {
      icon: Sparkles,
      title: 'Bias-Aware Evaluation',
      description: 'Fair, objective scoring that focuses on communication, confidence, relevance, and professionalism — not your background.',
      tag: 'Objective & fair',
      color: 'amber',
    },
  ];

  const colorConfig: Record<string, { card: string; icon: string; tag: string; dot: string }> = {
    blue: {
      card: 'hover:border-blue-500/30 hover:shadow-blue-500/5',
      icon: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      tag: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      dot: 'bg-blue-400',
    },
    emerald: {
      card: 'hover:border-emerald-500/30 hover:shadow-emerald-500/5',
      icon: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      tag: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    amber: {
      card: 'hover:border-amber-500/30 hover:shadow-amber-500/5',
      icon: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      tag: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      dot: 'bg-amber-400',
    },
  };

  return (
    <section className="py-28 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(59,130,246,0.04),transparent)]" />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">

        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-5 tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Why Sophyra
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
              Hyper-real practice that
              <br />
              <span className="text-white/30">drives measurable improvement</span>
            </h2>
            <p className="text-base text-white/40 leading-relaxed">
              Sophyra doesn't ask generic questions. It understands your background, adapts in real time,
              and evaluates with the rigor of a senior HR at a top-tier company.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const cfg = colorConfig[feature.color];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`group relative bg-white/[0.02] border border-white/5 rounded-2xl p-7 ${cfg.card} hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-11 h-11 ${cfg.icon} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-semibold ${cfg.tag} border px-2.5 py-1 rounded-full tracking-wide uppercase`}>
                    {feature.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2.5">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>

                <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-4 mb-20"
        >
          {[
            { value: '85%+', label: 'Interview completion rate', icon: TrendingUp },
            { value: '<2min', label: 'Time to first mock session', icon: Sparkles },
            { value: '4.4/5', label: 'Candidate satisfaction score', icon: Star },
          ].map(({ value, label, icon: Icon }, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center">
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-4xl font-bold text-white mb-1">{value}</p>
              <p className="text-xs text-white/30 font-medium">{label}</p>
            </div>
          ))}
        </motion.div>

        <div id="reports" className="relative">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full mb-5 tracking-widest uppercase">
              <Award className="w-3.5 h-3.5" />
              Interview Reports
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 tracking-tight">
              Big-Tech Grade Reports
            </h2>
            <p className="text-base text-white/40 max-w-2xl mx-auto leading-relaxed">
              Every session generates a comprehensive performance certificate with the depth and precision expected
              from Google, Amazon, McKinsey, and tier-1 firms worldwide.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="absolute -inset-px bg-gradient-to-br from-amber-500/20 via-blue-500/10 to-emerald-500/20 rounded-3xl blur-sm" />
            <div className="relative bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border-b border-white/5 px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Performance Certificate</p>
                    <p className="text-[10px] text-white/30">Sophyra AI — Interview Intelligence Report</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wide">Verified Report</span>
                </div>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest mb-1">Overall Score</p>
                        <div className="flex items-end gap-1">
                          <span className="text-5xl font-bold text-white">87</span>
                          <span className="text-xl text-white/30 mb-1">/100</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest mb-1">Grade</p>
                        <span className="text-2xl font-bold text-amber-400">A</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: 'Communication', score: 92, color: 'bg-blue-400' },
                        { label: 'Technical Depth', score: 84, color: 'bg-emerald-400' },
                        { label: 'Confidence', score: 88, color: 'bg-amber-400' },
                        { label: 'Relevance', score: 79, color: 'bg-blue-400' },
                        { label: 'Professionalism', score: 95, color: 'bg-emerald-400' },
                      ].map(({ label, score, color }) => (
                        <div key={label}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-white/50 font-medium">{label}</span>
                            <span className="text-xs text-white/70 font-bold">{score}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${score}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                              className={`h-full ${color} rounded-full`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mb-3">Key Strengths</p>
                      <div className="space-y-2">
                        {[
                          'Excellent STAR method usage',
                          'Strong problem-solving narrative',
                          'Professional vocabulary & tone',
                          'Clear and concise answers',
                        ].map((s) => (
                          <div key={s} className="flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                            <span className="text-xs text-white/50">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mb-3">Growth Areas</p>
                      <div className="space-y-2">
                        {[
                          'Reduce filler words (um, like)',
                          'Add quantifiable metrics to answers',
                          'Improve eye contact consistency',
                        ].map((s) => (
                          <div key={s} className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            <span className="text-xs text-white/50">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5">
                      <div className="flex flex-wrap gap-2">
                        {[
                          { icon: Mic, label: 'Voice Analyzed' },
                          { icon: Brain, label: 'AI Evaluated' },
                          { icon: Shield, label: 'Privacy-safe' },
                        ].map(({ icon: Icon, label }) => (
                          <div key={label} className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5">
                            <Icon className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] text-white/40 font-medium">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/lo.png" alt="Sophyra AI" className="w-6 h-6 opacity-60" />
                    <span className="text-[10px] text-white/20 font-medium">Certified by Sophyra AI</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[10px] text-white/30 ml-1">Big-Tech Grade</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
