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
    <section className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
            Sample Interview Report
          </h2>
          <p className="text-base text-white/40 leading-relaxed">
            Get the same level of feedback you'd receive from a FAANG recruiter. Every insight is actionable and designed to accelerate your growth.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-white/[0.02] px-8 py-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Interview Report</h3>
                  <p className="text-sm text-white/30">Product Manager • Senior Level • Session #2847</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-white mb-1">84</div>
                  <p className="text-sm font-semibold text-blue-400">Strong Performance</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div>
                <h4 className="text-base font-bold text-white/70 mb-6 flex items-center">
                  <TrendingUp className="w-4 h-4 text-blue-400 mr-2" />
                  Performance Breakdown
                </h4>
                <div className="grid sm:grid-cols-2 gap-5">
                  {scores.map((score, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white/50">{score.label}</span>
                        <span className="text-sm font-bold text-white/80">{score.value}/10</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            score.color === 'teal' ? 'bg-blue-400' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${score.value * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                  <h4 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-400" />
                    Key Strengths
                  </h4>
                  <ul className="space-y-3">
                    {strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 flex-shrink-0" />
                        <span className="text-sm text-white/40">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                  <h4 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    Growth Areas
                  </h4>
                  <ul className="space-y-3">
                    {gaps.map((gap, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0" />
                        <span className="text-sm text-white/40">{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                <h4 className="text-sm font-bold text-white/60 mb-3">Recommended Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {['Stakeholder Management', 'STAR Framework', 'Leadership Principles', 'Metrics Communication', 'Decision-Making Process', 'Conflict Resolution'].map(
                    (topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-white/5 border border-white/5 text-xs font-medium text-white/40 rounded-lg hover:border-white/10 hover:text-white/60 transition-all cursor-default"
                      >
                        {topic}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <p className="text-xs text-white/20">Generated on Nov 11, 2025</p>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-lg hover:bg-white/10 transition-all">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-white/20">
              Sample report • Actual reports include body language analysis, voice metrics, and personalized growth plans
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
