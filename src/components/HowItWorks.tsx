import { motion } from 'framer-motion';
import { Upload, MessageSquare, FileText, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      number: '01',
      title: 'Setup Your Session',
      description: 'Upload your resume, paste the job description, and select your experience level. Takes less than 2 minutes.',
      highlight: 'Role-specific context',
    },
    {
      icon: MessageSquare,
      number: '02',
      title: 'Live Interview',
      description: 'Sophyra asks 6-10 adaptive questions tailored to your profile. Answer via voice or text while getting real-time feedback.',
      highlight: '12-18 minutes',
    },
    {
      icon: FileText,
      number: '03',
      title: 'Get Your Report',
      description: 'Receive detailed scores, strengths, gaps, and a personalized growth plan. Download as PDF or share with recruiters.',
      highlight: 'Enterprise-grade insights',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block text-sm font-semibold text-brand-electric bg-blue-50 px-4 py-1.5 rounded-full mb-4">
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Three steps to your best interview ever
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            From setup to report in under 25 minutes
          </p>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 -translate-y-1/2 hidden lg:block"></div>

          <div className="grid lg:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative"
                >
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:border-blue-100 hover:shadow-md transition-all h-full">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-6xl font-bold text-slate-100 select-none">{step.number}</span>
                      <div className="w-14 h-14 bg-brand-electric rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                    <p className="text-slate-500 leading-relaxed mb-5">{step.description}</p>

                    <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-full">
                      <span className="text-xs font-semibold text-brand-electric">{step.highlight}</span>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10 w-8 h-8 bg-brand-electric rounded-full items-center justify-center shadow-md">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 text-center">
          <button className="group inline-flex items-center px-8 py-4 bg-brand-electric text-white text-base font-semibold rounded-xl hover:bg-brand-electric-dark transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5">
            Start Your First Mock Test
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
