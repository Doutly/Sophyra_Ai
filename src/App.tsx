import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import InterviewRoomV2 from './pages/InterviewRoomV2';
import ManualMockInterview from './pages/ManualMockInterview';
import Report from './pages/Report';
import AdminDashboard from './pages/AdminDashboard';
import HRDashboard from './pages/HRDashboard';
import PendingApproval from './pages/PendingApproval';
import Profile from './pages/Profile';
import SharedReport from './pages/SharedReport';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/shared/:shareToken" element={<SharedReport />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hr-dashboard"
              element={
                <ProtectedRoute allowedRoles={['hr']} requireApproval={true}>
                  <HRDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pending-approval"
              element={
                <ProtectedRoute allowedRoles={['hr']}>
                  <PendingApproval />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/interview/setup"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <InterviewSetup />
                </ProtectedRoute>
              }
            />

            <Route
              path="/interview/:sessionId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <InterviewRoomV2 />
                </ProtectedRoute>
              }
            />

            <Route
              path="/interview/manual"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ManualMockInterview />
                </ProtectedRoute>
              }
            />

            <Route
              path="/report/:reportId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Report />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
