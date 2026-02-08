import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';

type UserRole = Database['public']['Tables']['users']['Row']['role'];

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

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'candidate') return <Navigate to="/dashboard" replace />;
    if (role === 'hr') return <Navigate to="/hr-dashboard" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  if (requireApproval && !isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}
