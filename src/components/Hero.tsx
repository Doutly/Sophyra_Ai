import { Mic, Video, TrendingUp } from 'lucide-react';

interface HeroProps {
  onStartMockTest: () => void;
  onSignIn: () => void;
}

export default function Hero({ onStartMockTest, onSignIn }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <nav className="flex items-center justify-between py-4 mb-8">
          <div className="flex items-center space-x-3">
            <img src="/lo.png" alt="Sophyra AI" className="w-10 h-10" />
            <span className="text-2xl font-bold tracking-tight text-gray-900">Sophyra AI</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <button onClick={onSignIn} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign In</button>
            <button onClick={onStartMockTest} className="px-6 py-2.5 bg-brand-electric text-white text-sm font-semibold rounded-lg hover:bg-brand-electric-dark transition-colors shadow-sm">
              Start Mock Test
            </button>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 items-center pb-12 pt-6">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-electric-light/10 rounded-full border border-blue-100">
              <span className="w-2 h-2 bg-brand-electric rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-brand-electric-dark">Live AI HR Interviews</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-gray-900">
              Sophyra decides{' '}
              <span className="text-brand-electric">before the interviewer does</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
              Sophyra adapts to your role, resume, and experience in real time. Get enterprise-grade feedback with actionable growth plans.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={onStartMockTest} className="px-8 py-4 bg-brand-electric text-white text-base font-semibold rounded-lg hover:bg-brand-electric-dark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Start Mock Test
              </button>
              <button className="px-8 py-4 bg-white text-gray-900 text-base font-semibold rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all">
                Watch Demo
              </button>
            </div>

            <div className="flex items-center space-x-8 pt-8">
              <div className="flex items-center space-x-2">
                <Mic className="w-5 h-5 text-brand-electric" />
                <span className="text-sm text-gray-600">Voice Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <Video className="w-5 h-5 text-brand-electric" />
                <span className="text-sm text-gray-600">Body Language</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-brand-electric" />
                <span className="text-sm text-gray-600">Adaptive AI</span>
              </div>
            </div>
          </div>

          <div className="relative perspective-[1200px]">
            <div className="relative transform transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-electric/20 to-blue-500/20 rounded-2xl blur-2xl"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform rotate-y-[-2deg] hover:rotate-y-0 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-electric/10 to-transparent z-10"></div>
                <img
                  src="/whatsapp_image_2026-02-08_at_3.16.08_pm.jpeg"
                  alt="Sophyra AI Professional"
                  className="w-full h-auto object-cover"
                  style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 102, 255, 0.25), 0 0 0 1px rgba(0, 102, 255, 0.1)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
