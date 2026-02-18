import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, AlertCircle, UserCheck, Briefcase, ArrowLeft, Zap, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../lib/firebase.types';
import { motion } from 'framer-motion';

const DotMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const routes = [
    { start: { x: 100, y: 150, delay: 0 }, end: { x: 200, y: 80, delay: 2 }, color: '#2563eb' },
    { start: { x: 200, y: 80, delay: 2 }, end: { x: 260, y: 120, delay: 4 }, color: '#2563eb' },
    { start: { x: 50, y: 50, delay: 1 }, end: { x: 150, y: 180, delay: 3 }, color: '#2563eb' },
    { start: { x: 280, y: 60, delay: 0.5 }, end: { x: 180, y: 180, delay: 2.5 }, color: '#2563eb' },
  ];

  const generateDots = (width: number, height: number) => {
    const dots = [];
    const gap = 14;
    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        const inShape =
          ((x < width * 0.25 && x > width * 0.05) && (y < height * 0.4 && y > height * 0.1)) ||
          ((x < width * 0.25 && x > width * 0.15) && (y < height * 0.8 && y > height * 0.4)) ||
          ((x < width * 0.45 && x > width * 0.3) && (y < height * 0.35 && y > height * 0.15)) ||
          ((x < width * 0.5 && x > width * 0.35) && (y < height * 0.65 && y > height * 0.35)) ||
          ((x < width * 0.7 && x > width * 0.45) && (y < height * 0.5 && y > height * 0.1)) ||
          ((x < width * 0.8 && x > width * 0.65) && (y < height * 0.8 && y > height * 0.6));
        if (inShape && Math.random() > 0.3) {
          dots.push({ x, y, radius: 1.2, opacity: Math.random() * 0.35 + 0.15 });
        }
      }
    }
    return dots;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });
    observer.observe(canvas.parentElement as Element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dots = generateDots(dimensions.width, dimensions.height);
    let animId: number;
    let startTime = Date.now();

    function drawDots() {
      ctx!.clearRect(0, 0, dimensions.width, dimensions.height);
      dots.forEach(d => {
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(37,99,235,${d.opacity})`;
        ctx!.fill();
      });
    }

    function drawRoutes() {
      const t = (Date.now() - startTime) / 1000;
      routes.forEach(r => {
        const elapsed = t - r.start.delay;
        if (elapsed <= 0) return;
        const prog = Math.min(elapsed / 3, 1);
        const x = r.start.x + (r.end.x - r.start.x) * prog;
        const y = r.start.y + (r.end.y - r.start.y) * prog;
        ctx!.beginPath();
        ctx!.moveTo(r.start.x, r.start.y);
        ctx!.lineTo(x, y);
        ctx!.strokeStyle = r.color;
        ctx!.lineWidth = 1.2;
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.arc(r.start.x, r.start.y, 3, 0, Math.PI * 2);
        ctx!.fillStyle = r.color;
        ctx!.fill();
        ctx!.beginPath();
        ctx!.arc(x, y, 3, 0, Math.PI * 2);
        ctx!.fillStyle = '#3b82f6';
        ctx!.fill();
        ctx!.beginPath();
        ctx!.arc(x, y, 6, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(59,130,246,0.3)';
        ctx!.fill();
        if (prog === 1) {
          ctx!.beginPath();
          ctx!.arc(r.end.x, r.end.y, 3, 0, Math.PI * 2);
          ctx!.fillStyle = r.color;
          ctx!.fill();
        }
      });
    }

    function animate() {
      drawDots();
      drawRoutes();
      if ((Date.now() - startTime) / 1000 > 15) startTime = Date.now();
      animId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animId);
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-sky-50" />
        <DotMap />

        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2.5"
          >
            <div className="relative">
              <img src="/lo.png" alt="Sophyra AI" className="w-8 h-8 relative z-10" />
              <div className="absolute inset-0 bg-blue-400/25 rounded-full blur-sm" />
            </div>
            <span className="text-base font-bold text-slate-800">Sophyra AI</span>
          </motion.div>

          <div className="space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full tracking-widest uppercase mb-5">
                <Zap className="w-3 h-3" />
                AI Interview Intelligence
              </span>
              <h2 className="text-4xl font-bold text-slate-900 mb-3 leading-[1.08]">
                Sophyra decides{' '}
                <span className="text-slate-400">before the</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  interviewer does
                </span>
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                AI that adapts to your resume and role. Big-Tech grade feedback before your real interview.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              className="space-y-2.5"
            >
              {[
                { n: '01', t: 'Upload resume & job description' },
                { n: '02', t: 'Live AI-driven mock interview' },
                { n: '03', t: 'Get your Performance Certificate' },
              ].map(({ n, t }, idx) => (
                <motion.div
                  key={n}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + idx * 0.09 }}
                  className="flex items-center gap-3.5 px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
                  style={{ boxShadow: '0 2px 12px 0 rgba(59,130,246,0.05), 0 1px 3px 0 rgba(0,0,0,0.04)' }}
                >
                  <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-blue-600">{n}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{t}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.52 }}
              className="flex items-stretch bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 2px 16px 0 rgba(59,130,246,0.06), 0 1px 4px 0 rgba(0,0,0,0.05)' }}
            >
              {[['5,000+', 'Candidates'], ['50+', 'Universities'], ['4.4/5', 'Satisfaction']].map(([val, lbl], i) => (
                <div key={lbl} className={`flex-1 text-center py-4 px-2 ${i < 2 ? 'border-r border-slate-200/70' : ''}`}>
                  <p className="text-xl font-bold text-slate-900 leading-none mb-1">{val}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">{lbl}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.75 }}
            className="text-[10px] text-slate-400"
          >
            © 2025 Sophyra AI. All rights reserved.
          </motion.p>
        </div>

        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8 bg-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_60%_40%,rgba(59,130,246,0.03),transparent)]" />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="mb-6">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="relative">
                <img src="/lo.png" alt="Sophyra AI" className="w-7 h-7 relative z-10" />
                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-sm" />
              </div>
              <span className="text-sm font-bold text-slate-900">Sophyra AI</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1.5">{titles[authMode].h}</h1>
            <p className="text-sm text-slate-400">{titles[authMode].p}</p>
          </div>

          <div
            className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm"
            style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.06), 0 1px 4px 0 rgba(0,0,0,0.04)' }}
          >
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {resetSent ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Check your email</h3>
                <p className="text-xs text-slate-500 mb-5">
                  We've sent reset instructions to <span className="text-slate-700 font-medium">{email}</span>
                </p>
                <button
                  onClick={() => { setAuthMode('signin'); setResetSent(false); }}
                  className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">I am signing up as</label>
                      <div className="space-y-2">
                        {[
                          { value: 'candidate', icon: UserCheck, title: 'Student / Job Seeker', desc: 'Practice AI interviews and request mock sessions' },
                          { value: 'hr', icon: Briefcase, title: 'HR Professional', desc: 'Conduct mock interviews for candidates' },
                        ].map(({ value, icon: Icon, title, desc }) => (
                          <label
                            key={value}
                            className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                              selectedRole === value
                                ? 'border-blue-300 bg-blue-50/70'
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
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
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${selectedRole === value ? 'border-blue-500' : 'border-slate-300'}`}>
                              {selectedRole === value && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Icon className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-xs font-bold text-slate-800">{title}</span>
                              </div>
                              <p className="text-[10px] text-slate-500">{desc}</p>
                              {selectedRole === 'hr' && value === 'hr' && (
                                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                  <p className="text-[10px] text-amber-700">Account requires admin approval before access is granted</p>
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {authMode !== 'forgot' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {authMode === 'signin' && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 active:bg-slate-950 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Please wait...' : (
                      authMode === 'signup' ? 'Create Account' :
                      authMode === 'signin' ? 'Sign In' : 'Send Reset Link'
                    )}
                  </button>
                </div>
              </form>
            )}

            {!resetSent && (
              <div className="mt-5 pt-5 relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-slate-100" />
                <div className="text-center">
                  {authMode === 'signin' ? (
                    <p className="text-sm text-slate-500">
                      Don't have an account?{' '}
                      <button onClick={() => setAuthMode('signup')} className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">Sign up</button>
                    </p>
                  ) : authMode === 'signup' ? (
                    <p className="text-sm text-slate-500">
                      Already have an account?{' '}
                      <button onClick={() => setAuthMode('signin')} className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">Sign in</button>
                    </p>
                  ) : (
                    <button onClick={() => setAuthMode('signin')} className="text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                      Back to sign in
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/')}
            className="mt-5 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </button>
        </motion.div>
      </div>
    </div>
  );
}
