import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw } from 'lucide-react';
import { MailboxFullState } from '../components/ui/state';

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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <MailboxFullState
        imageUrl="https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=400&q=80&auto=format&fit=crop"
        title="Account Under Review"
        description="Your HR account is currently being reviewed by our admin team. You'll receive full access once your profile is approved. This page refreshes automatically."
        primaryAction={{
          text: "Refresh Status",
          onClick: refreshUserData,
          icon: <RefreshCw className="h-4 w-4" />,
        }}
        secondaryAction={{
          text: "Sign Out",
          onClick: handleSignOut,
        }}
      />

      <div className="mt-6 text-center space-y-1">
        {user?.email && (
          <p className="text-xs text-slate-500">
            Signed in as <span className="font-semibold text-slate-700">{user.email}</span>
          </p>
        )}
        <p className="text-xs text-slate-400">
          Need help? Contact{' '}
          <a href="mailto:support@sophyra.ai" className="text-blue-500 hover:underline">
            support@sophyra.ai
          </a>
        </p>
      </div>
    </div>
  );
}
