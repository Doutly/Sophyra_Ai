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
import HRReport from './pages/HRReport';

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
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['candidate']}>
                    <Dashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />

            <Route
              path="/profile"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['candidate']}>
                    <Profile />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />

            <Route
              path="/hr-dashboard"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['hr']} requireApproval={true}>
                    <HRDashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />

            <Route
              path="/pending-approval"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['hr']}>
                    <PendingApproval />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />

            <Route
              path="/admin"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />

            <Route
              path="/interview/setup"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['candidate']}>
                    <InterviewSetup />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />

            <Route
              path="/interview/:sessionId"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['candidate']}>
                    <InterviewRoomV2 />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />

            <Route
              path="/interview/manual"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['candidate']}>
                    <ManualMockInterview />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />

            <Route
              path="/report/:reportId"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['candidate']}>
                    <Report />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />

            <Route
              path="/hr-report/:ticketId"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={['hr']} requireApproval={true}>
                    <HRReport />
                  </ProtectedRoute>
                </ErrorBoundary>
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
