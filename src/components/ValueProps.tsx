import { motion } from 'framer-motion';
import { Target, LineChart, FileCheck, Sparkles, Award, Shield, TrendingUp, Star, CheckCircle, Brain, Mic } from 'lucide-react';
import { ContainerScroll } from './ui/container-scroll-animation';

export default function ValueProps() {
  const features = [
    {
      icon: Target,
      title: 'Adaptive Interview Intelligence',
      description: 'Every question is personalized from your job description, resume, experience, and previous answers — never generic.',
      tag: 'Hyper-personalized',
      color: 'blue',
    },
    {
      icon: LineChart,
      title: 'Live Body Signal Analysis',
      description: 'Real-time attention, eye contact, pacing, and filler word detection. Privacy-safe, processed locally.',
      tag: 'Privacy-safe',
      color: 'emerald',
    },
    {
      icon: FileCheck,
      title: 'Big-Tech Grade Reports',
      description: 'Detailed scores, strengths, gaps, and growth plans — the same depth used at Google, Amazon, and McKinsey.',
      tag: 'Enterprise-grade',
      color: 'blue',
    },
    {
      icon: Sparkles,
      title: 'Bias-Aware Evaluation',
      description: 'Fair, objective scoring that focuses on communication, confidence, and professionalism — not your background.',
      tag: 'Objective & fair',
      color: 'amber',
    },
  ];

  const colorConfig: Record<string, { card: string; icon: string; tag: string }> = {
    blue: {
      card: 'hover:border-blue-500/25',
      icon: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      tag: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    emerald: {
      card: 'hover:border-emerald-500/25',
      icon: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      tag: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    amber: {
      card: 'hover:border-amber-500/25',
      icon: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      tag: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
  };

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(59,130,246,0.03),transparent)]" />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3.5 py-1.5 rounded-full mb-5 tracking-widest uppercase">
              <Sparkles className="w-3 h-3" />
              Why Sophyra
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight leading-[1.1]">
              Hyper-real practice that
              <br />
              <span className="text-white/70">drives measurable improvement</span>
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Sophyra understands your background, adapts in real time, and evaluates with the rigor of a senior HR at a top-tier company.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const cfg = colorConfig[feature.color];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className={`group relative bg-white/[0.02] border border-white/8 rounded-2xl p-7 ${cfg.card} hover:shadow-2xl hover:bg-white/[0.04] transition-all duration-300 overflow-hidden`}
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/[0.03] to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-11 h-11 ${cfg.icon} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[9px] font-semibold ${cfg.tag} border px-2.5 py-1 rounded-full tracking-wide uppercase`}>
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2.5">{feature.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="grid md:grid-cols-3 gap-3 mb-24"
        >
          {[
            { value: '85%+', label: 'Interview completion rate', icon: TrendingUp },
            { value: '<2min', label: 'Time to first mock session', icon: Sparkles },
            { value: '4.4/5', label: 'Candidate satisfaction score', icon: Star },
          ].map(({ value, label, icon: Icon }, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
              <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{value}</p>
              <p className="text-[10px] text-white/50 font-medium">{label}</p>
            </div>
          ))}
        </motion.div>

        <div id="reports" className="relative">
          <ContainerScroll
            titleComponent={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-4"
              >
                <span className="inline-flex items-center gap-2 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full mb-4 tracking-widest uppercase">
                  <Award className="w-3 h-3" />
                  Interview Reports
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
                  Big-Tech Grade Reports
                </h2>
                <p className="text-sm text-white/70 max-w-xl mx-auto leading-relaxed">
                  Every session generates a comprehensive performance certificate with the depth and precision expected from Google, Amazon, and McKinsey.
                </p>
              </motion.div>
            }
          >
            <div className="w-full h-full bg-[#0a0f1e] rounded-2xl overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border-b border-white/5 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Performance Certificate</p>
                    <p className="text-[9px] text-white">Sophyra AI — Interview Intelligence Report</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span className="text-[9px] font-semibold text-green-400 uppercase tracking-wide">Verified</span>
                </div>
              </div>

              <div className="p-6 flex-1 overflow-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-[9px] text-white/45 font-medium uppercase tracking-widest mb-1">Overall Score</p>
                        <div className="flex items-end gap-1">
                          <span className="text-4xl font-bold text-white">87</span>
                          <span className="text-base text-white/45 mb-0.5">/100</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-white/45 font-medium uppercase tracking-widest mb-1">Grade</p>
                        <span className="text-xl font-bold text-amber-400">A</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { label: 'Communication', score: 92, color: 'bg-blue-400' },
                        { label: 'Technical Depth', score: 84, color: 'bg-emerald-400' },
                        { label: 'Confidence', score: 88, color: 'bg-amber-400' },
                        { label: 'Relevance', score: 79, color: 'bg-blue-400' },
                        { label: 'Professionalism', score: 95, color: 'bg-emerald-400' },
                      ].map(({ label, score, color }) => (
                        <div key={label}>
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] text-white/40 font-medium">{label}</span>
                            <span className="text-[10px] text-white/60 font-bold">{score}</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] text-white/45 font-semibold uppercase tracking-widest mb-2.5">Key Strengths</p>
                      <div className="space-y-1.5">
                        {['Excellent STAR method usage', 'Strong problem-solving narrative', 'Professional vocabulary & tone', 'Clear and concise answers'].map((s) => (
                          <div key={s} className="flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                            <span className="text-[10px] text-white/40">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] text-white/45 font-semibold uppercase tracking-widest mb-2.5">Growth Areas</p>
                      <div className="space-y-1.5">
                        {['Reduce filler words (um, like)', 'Add quantifiable metrics', 'Improve eye contact'].map((s) => (
                          <div key={s} className="flex items-center gap-1.5">
                            <TrendingUp className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span className="text-[10px] text-white/40">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-white/5 flex flex-wrap gap-1.5">
                      {[{ icon: Mic, label: 'Voice Analyzed' }, { icon: Brain, label: 'AI Evaluated' }, { icon: Shield, label: 'Privacy-safe' }].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-md px-2 py-1">
                          <Icon className="w-2.5 h-2.5 text-blue-400" />
                          <span className="text-[9px] text-white/50">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img src="/Adobe_Express_-_file.png" alt="Sophyra AI" className="w-5 h-5 opacity-40" style={{mixBlendMode: 'multiply'}} />
                    <span className="text-[9px] text-white/40">Certified by Sophyra AI</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                    <span className="text-[9px] text-white/40 ml-1">Big-Tech Grade</span>
                  </div>
                </div>
              </div>
            </div>
          </ContainerScroll>
        </div>
      </div>
    </section>
  );
}
