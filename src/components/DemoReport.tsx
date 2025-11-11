import { TrendingUp, AlertCircle, Target, Download } from 'lucide-react';

export default function DemoReport() {
  const scores = [
    { label: 'Communication', value: 8.5, color: 'teal' },
    { label: 'Confidence', value: 7.2, color: 'blue' },
    { label: 'Relevance', value: 9.0, color: 'teal' },
    { label: 'Professionalism', value: 8.8, color: 'teal' },
  ];

  const strengths = [
    'Clear articulation with minimal filler words',
    'Strong use of specific metrics and outcomes',
    'Excellent eye contact and engaged body language',
  ];

  const gaps = [
    'Could expand on leadership decision-making process',
    'Provide more context on stakeholder management',
    'Strengthen answers with concrete examples',
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Big-Tech Grade Reports
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Get the same level of feedback you'd receive from a FAANG recruiter. Every insight is actionable and designed to accelerate your growth.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-gray-50 to-teal-50 px-8 py-6 border-b-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Interview Report</h3>
                  <p className="text-sm text-gray-600">Product Manager • Senior Level • Session #2847</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-gray-900 mb-1">84</div>
                  <p className="text-sm font-semibold text-teal-600">Strong Performance</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="w-5 h-5 text-teal-500 mr-2" />
                  Performance Breakdown
                </h4>
                <div className="grid sm:grid-cols-2 gap-6">
                  {scores.map((score, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">{score.label}</span>
                        <span className="text-sm font-bold text-gray-900">{score.value}/10</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            score.color === 'teal' ? 'bg-teal-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${score.value * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-teal-50 rounded-xl p-6 border border-teal-100">
                  <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                    <Target className="w-4 h-4 text-teal-600 mr-2" />
                    Key Strengths
                  </h4>
                  <ul className="space-y-3">
                    {strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
                    Growth Areas
                  </h4>
                  <ul className="space-y-3">
                    {gaps.map((gap, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-base font-bold text-gray-900 mb-3">Recommended Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {['Stakeholder Management', 'STAR Framework', 'Leadership Principles', 'Metrics Communication', 'Decision-Making Process', 'Conflict Resolution'].map(
                    (topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-white text-sm font-medium text-gray-700 rounded-lg border border-gray-200"
                      >
                        {topic}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Generated on Nov 11, 2025</p>
                <button className="flex items-center space-x-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Sample report • Actual reports include body language analysis, voice metrics, and personalized growth plans
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
