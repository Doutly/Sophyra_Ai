import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Clock, LogOut } from 'lucide-react';

export default function PendingApproval() {
  const navigate = useNavigate();
  const { user, isApproved, signOut, refreshUserData } = useAuth();

  useEffect(() => {
    if (isApproved) {
      navigate('/hr-dashboard');
    }
  }, [isApproved, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshUserData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-deep via-brand-deep-light to-brand-deep flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-brand-electric/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-brand-electric animate-pulse" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Account Under Review
          </h1>

          <p className="text-gray-600 mb-6">
            Your HR account is currently being reviewed by our admin team. You'll receive access once approved.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 mb-1">Account Email</div>
            <div className="font-medium text-gray-900">{user?.email}</div>
          </div>

          <div className="bg-brand-electric/5 border border-brand-electric/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              This page will automatically redirect once your account is approved.
              You can also check back by signing in again.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>

        <p className="text-center text-white/60 text-sm mt-4">
          Need help? Contact support at support@sophyra.ai
        </p>
      </div>
    </div>
  );
}
