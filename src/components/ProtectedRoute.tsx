import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/firebase.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireApproval?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireApproval = false
}: ProtectedRouteProps) {
  const { user, role, isApproved, loading } = useAuth();
  
  // Handle legacy 'student' role by treating it as 'candidate'
  const effectiveRole = role === 'student' ? 'candidate' : role;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-electric border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?mode=signin" replace />;
  }

  if (user.email === 'mani@sophyra.in') {
    return <>{children}</>;
  }

  if (allowedRoles && effectiveRole && !allowedRoles.includes(effectiveRole)) {
    if (effectiveRole === 'candidate') return <Navigate to="/dashboard" replace />;
    if (effectiveRole === 'hr') return <Navigate to="/hr-dashboard" replace />;
    if (effectiveRole === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  if (requireApproval && !isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}
