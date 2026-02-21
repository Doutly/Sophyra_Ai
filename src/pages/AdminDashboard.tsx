import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import AdminSidebar, { AdminSection } from '../components/admin/AdminSidebar';
import OverviewSection from '../components/admin/OverviewSection';
import CandidatesSection from '../components/admin/CandidatesSection';
import HRSection from '../components/admin/HRSection';
import RequestsSection from '../components/admin/RequestsSection';
import BlogSection from '../components/admin/BlogSection';
import CareersSection from '../components/admin/CareersSection';
import ContactSection from '../components/admin/ContactSection';
import { Menu, X } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges] = useState<Partial<Record<AdminSection, number>>>({});

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
      return;
    }

    const usersRef = collection(db, 'users');
    const requestsRef = collection(db, 'mockInterviewRequests');

    const unsubHR = onSnapshot(
      query(usersRef, where('role', '==', 'hr')),
      snap => {
        const pending = snap.docs.filter(d => !d.data().isApproved).length;
        setBadges(prev => ({ ...prev, hr: pending > 0 ? pending : undefined }));
      }
    );

    const unsubRequests = onSnapshot(
      query(requestsRef, where('status', '==', 'pending')),
      snap => {
        const count = snap.size;
        setBadges(prev => ({ ...prev, requests: count > 0 ? count : undefined }));
      }
    );

    return () => {
      unsubHR();
      unsubRequests();
    };
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSelect = (s: AdminSection) => {
    setActiveSection(s);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex">
        <AdminSidebar
          active={activeSection}
          onSelect={handleSelect}
          onSignOut={handleSignOut}
          badges={badges}
        />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <AdminSidebar
              active={activeSection}
              onSelect={handleSelect}
              onSignOut={handleSignOut}
              badges={badges}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/lo.png" alt="Sophyra AI" className="w-7 h-7 object-contain" />
            <span className="text-sm font-bold text-slate-900">Sophyra Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <main className="px-6 py-7 max-w-6xl mx-auto">
          {activeSection === 'overview' && <OverviewSection />}
          {activeSection === 'candidates' && <CandidatesSection />}
          {activeSection === 'hr' && <HRSection />}
          {activeSection === 'requests' && <RequestsSection />}
          {activeSection === 'blog' && <BlogSection />}
          {activeSection === 'careers' && <CareersSection />}
          {activeSection === 'contact' && <ContactSection />}
        </main>
      </div>
    </div>
  );
}
