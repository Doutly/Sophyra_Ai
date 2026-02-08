import { Mic, Video, Brain } from 'lucide-react';

interface HeroProps {
  onStartMockTest: () => void;
  onSignIn: () => void;
}

export default function Hero({ onStartMockTest, onSignIn }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <nav className="flex items-center justify-between py-8 mb-20">
          <div className="flex items-center space-x-3">
            <img src="/lo.png" alt="Sophyra AI" className="w-10 h-10" />
            <span className="text-2xl font-bold tracking-tight text-gray-900">Sophyra AI</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <button onClick={onSignIn} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign In</button>
            <button onClick={onStartMockTest} className="px-6 py-2.5 bg-brand-electric500 text-white text-sm font-semibold rounded-lg hover:bg-brand-electric600 transition-colors shadow-sm">
              Start Mock Test
            </button>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-16 items-center pb-24 pt-12">
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-electric50 rounded-full border border-teal-100">
              <span className="w-2 h-2 bg-brand-electric500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-brand-electric700">Live AI HR Interviews</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-gray-900">
              Practice interviews with an AI HR who{' '}
              <span className="text-brand-electric500">actually feels human.</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
              Sophyra adapts to your role, resume, and experience in real time. Get enterprise-grade feedback with actionable growth plans.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={onStartMockTest} className="px-8 py-4 bg-brand-electric500 text-white text-base font-semibold rounded-lg hover:bg-brand-electric600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Start Mock Test
              </button>
              <button className="px-8 py-4 bg-white text-gray-900 text-base font-semibold rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all">
                Watch Demo
              </button>
            </div>

            <div className="flex items-center space-x-8 pt-8">
              <div className="flex items-center space-x-2">
                <Mic className="w-5 h-5 text-brand-electric500" />
                <span className="text-sm text-gray-600">Voice Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <Video className="w-5 h-5 text-brand-electric500" />
                <span className="text-sm text-gray-600">Body Language</span>
              </div>
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-brand-electric500" />
                <span className="text-sm text-gray-600">Adaptive AI</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-brand-electric500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">S</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Sophyra AI</p>
                      <p className="text-xs text-gray-500">Senior HR Interviewer</p>
                    </div>
                  </div>
                  <p className="text-gray-200 leading-relaxed">
                    "Tell me about a time when you had to handle a challenging stakeholder situation. What specific steps did you take?"
                  </p>
                </div>

                <div className="flex justify-end">
                  <div className="bg-brand-electric500 rounded-lg p-4 max-w-md">
                    <p className="text-white text-sm leading-relaxed">
                      Analyzing response clarity, confidence, and relevance...
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Pace</p>
                    <p className="text-lg font-semibold text-brand-electric400">142 WPM</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Clarity</p>
                    <p className="text-lg font-semibold text-brand-electric400">8.5/10</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-teal-200 to-blue-200 opacity-20 blur-3xl rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
