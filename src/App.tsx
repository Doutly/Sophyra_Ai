import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import InterviewRoomV2 from './pages/InterviewRoomV2';
import ManualMockInterview from './pages/ManualMockInterview';
import Report from './pages/Report';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import SharedReport from './pages/SharedReport';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/interview/setup" element={<InterviewSetup />} />
              <Route path="/interview/:sessionId" element={<InterviewRoomV2 />} />
              <Route path="/interview/manual" element={<ManualMockInterview />} />
              <Route path="/report/:reportId" element={<Report />} />
              <Route path="/shared/:shareToken" element={<SharedReport />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
