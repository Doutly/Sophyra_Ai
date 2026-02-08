import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, AlertCircle, UserCheck, Briefcase } from 'lucide-react';
import { Database } from '../lib/database.types';

type UserRole = Database['public']['Tables']['users']['Row']['role'];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  const navigate = useNavigate();
  const { signUp, signIn, resetPassword, user, role, isApproved } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>(mode as any);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.email === 'mani@sophyra.in') {
        navigate('/admin');
        return;
      }

      if (role) {
        if (role === 'admin') {
          navigate('/admin');
        } else if (role === 'hr') {
          if (isApproved) {
            navigate('/hr-dashboard');
          } else {
            navigate('/pending-approval');
          }
        } else {
          navigate('/dashboard');
        }
      }
    }
  }, [user, role, isApproved, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        if (!fullName.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) {
          setError(error.message);
        } else {
          if (selectedRole === 'hr') {
            navigate('/pending-approval');
          } else {
            navigate('/dashboard');
          }
        }
      } else if (authMode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
      } else if (authMode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setResetSent(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {authMode === 'signup' && 'Create your account'}
            {authMode === 'signin' && 'Welcome back'}
            {authMode === 'forgot' && 'Reset your password'}
          </h2>
          <p className="text-gray-600">
            {authMode === 'signup' && 'Start practicing interviews with AI'}
            {authMode === 'signin' && 'Sign in to continue your journey'}
            {authMode === 'forgot' && 'Enter your email to receive reset instructions'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {resetSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-brand-electric/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-brand-electric" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email</h3>
              <p className="text-gray-600 mb-6">
                We've sent password reset instructions to {email}
              </p>
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setResetSent(false);
                }}
                className="text-brand-electric font-medium hover:text-brand-electric-dark"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      I am signing up as
                    </label>
                    <div className="space-y-3">
                      <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === 'student' ? 'border-brand-electric bg-brand-electric/5' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="role"
                          value="student"
                          checked={selectedRole === 'student'}
                          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                          className="mt-1 w-4 h-4 text-brand-electric focus:ring-brand-electric"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <UserCheck className="w-5 h-5 text-brand-electric" />
                            <span className="font-semibold text-gray-900">Student / Job Seeker</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Practice interviews with AI and request manual mock interviews
                          </p>
                        </div>
                      </label>

                      <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === 'hr' ? 'border-brand-electric bg-brand-electric/5' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="role"
                          value="hr"
                          checked={selectedRole === 'hr'}
                          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                          className="mt-1 w-4 h-4 text-brand-electric focus:ring-brand-electric"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <Briefcase className="w-5 h-5 text-brand-electric" />
                            <span className="font-semibold text-gray-900">HR Professional</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Conduct mock interviews for students
                          </p>
                          {selectedRole === 'hr' && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                              Your account will require admin approval before access is granted
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {authMode !== 'forgot' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {authMode === 'signin' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-sm text-brand-electric hover:text-brand-electric-dark font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-electric text-white font-semibold rounded-lg hover:bg-brand-electric-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : (
                  <>
                    {authMode === 'signup' && 'Create Account'}
                    {authMode === 'signin' && 'Sign In'}
                    {authMode === 'forgot' && 'Send Reset Link'}
                  </>
                )}
              </button>
            </form>
          )}

          {!resetSent && (
            <div className="mt-6 text-center">
              {authMode === 'signin' ? (
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setAuthMode('signup')}
                    className="text-brand-electric font-medium hover:text-brand-electric-dark"
                  >
                    Sign up
                  </button>
                </p>
              ) : authMode === 'signup' ? (
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthMode('signin')}
                    className="text-brand-electric font-medium hover:text-brand-electric-dark"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <button
                  onClick={() => setAuthMode('signin')}
                  className="text-sm text-brand-electric font-medium hover:text-brand-electric-dark"
                >
                  Back to sign in
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
