import { Target, LineChart, FileCheck, Sparkles } from 'lucide-react';

export default function ValueProps() {
  const features = [
    {
      icon: Target,
      title: 'Adaptive Interview Intelligence',
      description: 'Every question is personalized from your job description, resume, experience, and previous answers.',
    },
    {
      icon: LineChart,
      title: 'Live Body Signals',
      description: 'Real-time analysis of attention, eye contact, pace, and filler words. Privacy-safe and processed locally.',
    },
    {
      icon: FileCheck,
      title: 'Enterprise-Grade Reports',
      description: 'Detailed scores, strengths, gaps, and personalized growth plans. Download as PDF or share with one click.',
    },
    {
      icon: Sparkles,
      title: 'Bias-Aware Evaluation',
      description: 'Fair, objective assessment focused on communication, confidence, relevance, and professionalism.',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Hyper-real practice that drives measurable improvement
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Sophyra doesn't just ask generic questions. It understands your background, adapts to your answers, and evaluates like a senior HR professional from a top-tier company.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-teal-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-teal-100 transition-colors">
                  <Icon className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-gradient-to-r from-gray-50 to-teal-50 rounded-2xl p-12 border border-gray-200">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold text-gray-900 mb-2">85%+</p>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-gray-900 mb-2">&lt;2min</p>
              <p className="text-sm font-medium text-gray-600">Time to First Mock</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-gray-900 mb-2">4.4/5</p>
              <p className="text-sm font-medium text-gray-600">User Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
