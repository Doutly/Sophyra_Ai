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
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            How Sophyra Works
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Three simple steps to transform your interview performance
          </p>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 hidden lg:block"></div>

          <div className="grid lg:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border-2 border-gray-100 hover:border-teal-200 transition-all h-full">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-6xl font-bold text-gray-100">{step.number}</span>
                      <div className="w-14 h-14 bg-teal-500 rounded-xl flex items-center justify-center">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-4">{step.description}</p>

                    <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-teal-50 rounded-full">
                      <span className="text-xs font-semibold text-teal-700">{step.highlight}</span>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10 w-8 h-8 bg-teal-500 rounded-full items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 text-center">
          <button className="px-8 py-4 bg-teal-500 text-white text-base font-semibold rounded-lg hover:bg-teal-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            Start Your First Mock Test
          </button>
        </div>
      </div>
    </section>
  );
}
