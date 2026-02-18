import { motion } from 'framer-motion';
import { Target, LineChart, FileCheck, Sparkles } from 'lucide-react';

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-brand-electric',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
};

export default function ValueProps() {
  const features = [
    {
      icon: Target,
      title: 'Adaptive Interview Intelligence',
      description: 'Every question is personalized from your job description, resume, experience, and previous answers.',
      color: 'blue',
    },
    {
      icon: LineChart,
      title: 'Live Body Signals',
      description: 'Real-time analysis of attention, eye contact, pace, and filler words. Privacy-safe and processed locally.',
      color: 'emerald',
    },
    {
      icon: FileCheck,
      title: 'Enterprise-Grade Reports',
      description: 'Detailed scores, strengths, gaps, and personalized growth plans. Download as PDF or share with one click.',
      color: 'blue',
    },
    {
      icon: Sparkles,
      title: 'Bias-Aware Evaluation',
      description: 'Fair, objective assessment focused on communication, confidence, relevance, and professionalism.',
      color: 'amber',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-brand-electric bg-blue-50 px-4 py-1.5 rounded-full mb-4">
            Why Sophyra
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Hyper-real practice that drives measurable improvement
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Sophyra doesn't just ask generic questions. It understands your background, adapts to your answers, and evaluates like a senior HR professional from a top-tier company.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-white border border-slate-100 rounded-2xl p-8 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300"
              >
                <div className={`w-12 h-12 ${colorMap[feature.color]} rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12"
        >
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { value: '85%+', label: 'Completion Rate' },
              { value: '<2min', label: 'Time to First Mock' },
              { value: '4.4/5', label: 'User Satisfaction' },
            ].map(({ value, label }) => (
              <div key={label} className="space-y-2">
                <p className="text-5xl font-bold text-white">{value}</p>
                <p className="text-sm font-medium text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
