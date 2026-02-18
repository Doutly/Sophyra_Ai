import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, AlertCircle, UserCheck, Briefcase, ArrowLeft, Zap } from 'lucide-react';
import { UserRole } from '../lib/firebase.types';
import { motion } from 'framer-motion';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  const navigate = useNavigate();
  const { signUp, signIn, resetPassword, user, role, isApproved } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>(mode as any);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('candidate');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.email === 'mani@sophyra.in') { navigate('/admin'); return; }
      if (role) {
        if (role === 'admin') navigate('/admin');
        else if (role === 'hr') navigate(isApproved ? '/hr-dashboard' : '/pending-approval');
        else navigate('/dashboard');
      }
    }
  }, [user, role, isApproved, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (authMode === 'signup') {
        if (!fullName.trim()) { setError('Please enter your full name'); setLoading(false); return; }
        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) setError(error.message);
        else navigate(selectedRole === 'hr' ? '/pending-approval' : '/dashboard');
      } else if (authMode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
      } else if (authMode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) setError(error.message);
        else setResetSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    signup: { h: 'Create your account', p: 'Start your AI interview practice journey' },
    signin: { h: 'Welcome back', p: 'Sign in to continue your journey' },
    forgot: { h: 'Reset password', p: 'Enter your email to receive reset instructions' },
  };

  return (
    <div className="min-h-screen bg-black flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_40%,rgba(59,130,246,0.07),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-10 w-full h-full">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2.5"
          >
            <div className="relative">
              <img src="/lo.png" alt="Sophyra AI" className="w-8 h-8 relative z-10" />
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-sm" />
            </div>
            <span className="text-base font-bold text-slate-900">Sophyra AI</span>
          </motion.div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full tracking-widest uppercase mb-5">
                <Zap className="w-3 h-3" />
                AI Interview Intelligence
              </span>
              <h2 className="text-4xl font-bold text-slate-900 mb-3 leading-[1.1]">
                Sophyra decides{' '}
                <span className="text-slate-400">before the</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  interviewer does
                </span>
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                AI that adapts to your resume and role. Big-Tech grade feedback before your real interview.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {[
                { n: '01', t: 'Upload resume & job description' },
                { n: '02', t: 'Live AI-driven mock interview' },
                { n: '03', t: 'Get your Performance Certificate' },
              ].map(({ n, t }, idx) => (
                <motion.div
                  key={n}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.25 + idx * 0.09, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-4 p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
                >
                  <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">{n}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{t}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-1 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm"
            >
              {[['5,000+', 'Candidates'], ['50+', 'Universities'], ['4.4/5', 'Satisfaction']].map(([val, lbl], i) => (
                <div key={lbl} className={`flex-1 text-center ${i < 2 ? 'border-r border-slate-200' : ''}`}>
                  <p className="text-xl font-bold text-slate-900">{val}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{lbl}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="text-[10px] text-slate-400"
          >
            © 2025 Sophyra AI. All rights reserved.
          </motion.p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_70%_50%,rgba(59,130,246,0.04),transparent)]" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="mb-5">
            <div className="lg:hidden flex items-center gap-2 mb-5">
              <div className="relative">
                <img src="/lo.png" alt="Sophyra AI" className="w-7 h-7 relative z-10" />
                <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-sm" />
              </div>
              <span className="text-sm font-bold text-white">Sophyra AI</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{titles[authMode].h}</h1>
            <p className="text-base text-white/40">{titles[authMode].p}</p>
          </div>

          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-7 backdrop-blur-sm shadow-2xl shadow-black/40">
            {error && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {resetSent ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">Check your email</h3>
                <p className="text-xs text-white/35 mb-5">
                  We've sent reset instructions to <span className="text-white/60">{email}</span>
                </p>
                <button
                  onClick={() => { setAuthMode('signin'); setResetSent(false); }}
                  className="text-xs text-blue-400 font-medium hover:text-blue-300 transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white/50 mb-1.5">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 bg-white/[0.04] border border-white/8 rounded-lg text-base text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/50 mb-2">I am signing up as</label>
                      <div className="space-y-2">
                        {[
                          { value: 'candidate', icon: UserCheck, title: 'Student / Job Seeker', desc: 'Practice AI interviews and request mock sessions' },
                          { value: 'hr', icon: Briefcase, title: 'HR Professional', desc: 'Conduct mock interviews for candidates' },
                        ].map(({ value, icon: Icon, title, desc }) => (
                          <label
                            key={value}
                            className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                              selectedRole === value
                                ? 'border-blue-500/40 bg-blue-500/[0.06]'
                                : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                            }`}
                          >
                            <input
                              type="radio"
                              name="role"
                              value={value}
                              checked={selectedRole === value}
                              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                              className="hidden"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${selectedRole === value ? 'border-blue-400' : 'border-white/20'}`}>
                              {selectedRole === value && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Icon className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-xs font-semibold text-white">{title}</span>
                              </div>
                              <p className="text-[10px] text-white/30">{desc}</p>
                              {selectedRole === 'hr' && value === 'hr' && (
                                <div className="mt-2 p-2 bg-amber-500/[0.08] border border-amber-500/20 rounded-lg">
                                  <p className="text-[10px] text-amber-400/80">Account requires admin approval before access is granted</p>
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-white/50 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-white/[0.04] border border-white/8 rounded-lg text-base text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {authMode !== 'forgot' && (
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-white/[0.04] border border-white/8 rounded-lg text-base text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                {authMode === 'signin' && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-600 text-white text-base font-semibold rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                >
                  {loading ? 'Please wait...' : (
                    authMode === 'signup' ? 'Create Account' :
                    authMode === 'signin' ? 'Sign In' : 'Send Reset Link'
                  )}
                </button>
              </form>
            )}

            {!resetSent && (
              <div className="mt-5 text-center border-t border-white/5 pt-5">
                {authMode === 'signin' ? (
                  <p className="text-sm text-white/35">
                    Don't have an account?{' '}
                    <button onClick={() => setAuthMode('signup')} className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Sign up</button>
                  </p>
                ) : authMode === 'signup' ? (
                  <p className="text-sm text-white/35">
                    Already have an account?{' '}
                    <button onClick={() => setAuthMode('signin')} className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Sign in</button>
                  </p>
                ) : (
                  <button onClick={() => setAuthMode('signin')} className="text-sm text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                    Back to sign in
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/')}
            className="mt-6 flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </button>
        </motion.div>
      </div>
    </div>
  );
}
