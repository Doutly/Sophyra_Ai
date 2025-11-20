import { ArrowRight, Users, Building2 } from 'lucide-react';

interface CTAProps {
  onStartMockTest: () => void;
}

export default function CTA({ onStartMockTest }: CTAProps) {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-12 p-12 lg:p-16">
            <div className="space-y-8">
              <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                Ready to ace your next interview?
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                Join thousands of candidates who've improved their interview performance with Sophyra's adaptive AI coaching.
              </p>

              <div className="space-y-4">
                <button onClick={onStartMockTest} className="w-full sm:w-auto px-8 py-4 bg-teal-500 text-white text-base font-semibold rounded-lg hover:bg-teal-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center group">
                  <span>Start Mock Test</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-sm text-gray-400">No credit card required • Get started in under 2 minutes</p>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-teal-400" />
                  <span className="text-sm text-gray-300">5,000+ candidates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-teal-400" />
                  <span className="text-sm text-gray-300">50+ universities</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-6">Choose Your Plan</h3>

                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-xl p-6 border-2 border-teal-500">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-white">Starter</h4>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white">₹799</p>
                        <p className="text-xs text-gray-400">per month</p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm text-gray-300">
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-3"></span>
                        Unlimited mock interviews
                      </li>
                      <li className="flex items-center text-sm text-gray-300">
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-3"></span>
                        Detailed PDF reports
                      </li>
                      <li className="flex items-center text-sm text-gray-300">
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-3"></span>
                        Body language analysis
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-white">Single Session</h4>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white">₹399</p>
                        <p className="text-xs text-gray-400">per interview</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">Perfect for one-time practice before an important interview</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-6 text-center">
                  Enterprise plans available for universities and teams
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
