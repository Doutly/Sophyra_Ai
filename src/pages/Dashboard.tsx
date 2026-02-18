import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  Play,
  FileText,
  Lightbulb,
  LogOut,
  User as UserIcon,
  Ticket,
  Calendar,
  Clock,
  AlertCircle,
  LayoutDashboard,
  TrendingUp,
  Brain,
  ChevronRight,
  Award,
  Zap,
  BarChart2,
  ArrowUpRight,
  Settings,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import MockInterviewModal from '../components/MockInterviewModal';

const DEFAULT_TIPS = {
  identified_weaknesses: [
    'Maintain consistent eye contact and smile naturally',
    'Use the STAR method for behavioral questions',
    'Practice active listening and avoid interrupting',
    'Prepare thoughtful questions for the interviewer',
  ],
  suggested_topics: [
    'Company Research',
    'Technical Preparation',
    'Common Interview Questions',
    'Salary Negotiation',
    'Follow-up Etiquette',
  ],
};

interface Report {
  id: string;
  session_id: string;
  overall_score: number;
  created_at: string;
  session: {
    role: string;
    company: string | null;
  };
}

interface Tip {
  id: string;
  category: string;
  identified_weaknesses: string[];
  suggested_topics: string[];
}

interface MockInterviewRequest {
  id: string;
  ticket_number: string;
  job_role: string;
  company_name: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  preferred_date: string;
  preferred_time: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  created_at: string;
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Brain, label: 'AI Interview', action: 'interview' },
  { icon: Zap, label: 'Simulate Interview', action: 'simulate' },
  { icon: FileText, label: 'Reports', action: 'reports' },
  { icon: Ticket, label: 'Manual Interview', action: 'manual' },
  { icon: UserIcon, label: 'Profile', action: 'profile' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [tips, setTips] = useState<Tip | null>(null);
  const [mockRequests, setMockRequests] = useState<MockInterviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  const cleanupListeners = () => {
    unsubscribersRef.current.forEach((fn) => fn());
    unsubscribersRef.current = [];
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
      return;
    }

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Loading took too long. Please try refreshing the page.');
    }, 15000);

    loadDashboardData().then(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
      cleanupListeners();
    };
  }, [user, navigate]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    cleanupListeners();

    try {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) setUserName(snapshot.data().name || '');
          setLoading(false);
        },
        () => setLoading(false)
      );
      unsubscribersRef.current.push(unsubscribeUser);

      const sessionsQuery = query(collection(db, 'sessions'), where('userId', '==', user.uid));
      const unsubscribeSessions = onSnapshot(
        sessionsQuery,
        async (sessionsSnapshot) => {
          const sessionIds = sessionsSnapshot.docs.map((d) => d.id);
          if (sessionIds.length > 0) {
            const reportsQuery = query(
              collection(db, 'reports'),
              where('sessionId', 'in', sessionIds.slice(0, 10)),
              orderBy('createdAt', 'desc'),
              firestoreLimit(10)
            );
            const unsubscribeReports = onSnapshot(
              reportsQuery,
              async (reportsSnapshot) => {
                try {
                  const reportsWithSessions = await Promise.all(
                    reportsSnapshot.docs.map(async (reportDoc) => {
                      const reportData = reportDoc.data();
                      const sessionRef = doc(db, 'sessions', reportData.sessionId);
                      const sessionSnap = await getDoc(sessionRef);
                      const sessionData = sessionSnap.exists() ? sessionSnap.data() : null;
                      const createdAtRaw = reportData.createdAt;
                      const createdAt = createdAtRaw?.toDate
                        ? createdAtRaw.toDate().toISOString()
                        : typeof createdAtRaw === 'string'
                        ? createdAtRaw
                        : new Date().toISOString();
                      return {
                        id: reportDoc.id,
                        session_id: reportData.sessionId,
                        overall_score: reportData.overallScore || 0,
                        created_at: createdAt,
                        session: {
                          role: sessionData?.role || '',
                          company: sessionData?.company || null,
                        },
                      };
                    })
                  );
                  setReports(reportsWithSessions);
                } catch (e) {
                  console.error('Error processing reports:', e);
                }
              },
              (e) => console.error('Reports snapshot error:', e)
            );
            unsubscribersRef.current.push(unsubscribeReports);
          } else {
            setReports([]);
          }
        },
        (e) => console.error('Sessions snapshot error:', e)
      );
      unsubscribersRef.current.push(unsubscribeSessions);

      const tipsQuery = query(
        collection(db, 'tips'),
        where('userId', '==', user.uid),
        firestoreLimit(1)
      );
      const unsubscribeTips = onSnapshot(
        tipsQuery,
        (tipsSnapshot) => {
          if (!tipsSnapshot.empty) {
            const tipData = tipsSnapshot.docs[0].data();
            setTips({
              id: tipsSnapshot.docs[0].id,
              category: tipData.category || '',
              identified_weaknesses: tipData.identifiedWeaknesses || [],
              suggested_topics: tipData.suggestedTopics || [],
            });
          } else {
            setTips(null);
          }
        },
        (e) => console.error('Tips snapshot error:', e)
      );
      unsubscribersRef.current.push(unsubscribeTips);

      const requestsQuery = query(
        collection(db, 'mockInterviewRequests'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );
      const unsubscribeRequests = onSnapshot(
        requestsQuery,
        (requestsSnapshot) => {
          const requestsData = requestsSnapshot.docs.slice(0, 5).map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ticket_number: data.ticket_number || '',
              job_role: data.job_role || '',
              company_name: data.company_name || null,
              status: data.status || 'pending',
              preferred_date: data.preferred_date || '',
              preferred_time: data.preferred_time || '',
              scheduled_date: data.scheduled_date || null,
              scheduled_time: data.scheduled_time || null,
              created_at: data.created_at || new Date().toISOString(),
            };
          });
          setMockRequests(requestsData);
        },
        (e) => console.error('Requests snapshot error:', e)
      );
      unsubscribersRef.current.push(unsubscribeRequests);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data.');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavAction = (action?: string) => {
    if (action === 'interview') setShowInterviewModal(true);
    else if (action === 'simulate') navigate('/interview/simulate');
    else if (action === 'reports' && reports.length > 0) navigate(`/report/${reports[0].id}`);
    else if (action === 'manual') navigate('/interview/manual');
    else if (action === 'profile') navigate('/profile');
  };

  const avgScore =
    reports.length > 0
      ? Math.round(reports.reduce((sum, r) => sum + r.overall_score, 0) / reports.length)
      : 0;
  const bestScore = reports.length > 0 ? Math.max(...reports.map((r) => r.overall_score)) : 0;
  const recentTrend = reports.slice(0, 5).reverse();

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-50 border-emerald-100';
    if (score >= 70) return 'bg-blue-50 border-blue-100';
    if (score >= 50) return 'bg-amber-50 border-amber-100';
    return 'bg-red-50 border-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Strong';
    if (score >= 50) return 'Good';
    return 'Needs Work';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const hourOfDay = new Date().getHours();
  const greeting =
    hourOfDay < 12 ? 'Good morning' : hourOfDay < 18 ? 'Good afternoon' : 'Good evening';
  const firstNameDisplay = (
    userName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'there'
  )
    .split(' ')[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-electric border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-6 text-sm">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => loadDashboardData()}
              className="w-full px-6 py-3 bg-brand-electric text-white font-semibold rounded-xl hover:bg-brand-electric-dark transition-colors text-sm"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-sm"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 bg-white border-r border-slate-100 flex flex-col fixed h-full z-10 shadow-sm">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <img src="/lo.png" alt="Sophyra AI" className="w-8 h-8 rounded-lg" />
            <span className="text-[15px] font-bold text-slate-900 tracking-tight">Sophyra AI</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavAction(item.action)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.active
                  ? 'bg-brand-electric text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100 space-y-0.5">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <div className="flex items-center space-x-3 px-3 py-2.5 mt-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-electric to-brand-electric-dark flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {firstNameDisplay.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{firstNameDisplay}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-[17px] font-bold text-slate-900">
              {greeting}, {firstNameDisplay}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={() => setShowInterviewModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-brand-electric text-white text-sm font-semibold rounded-xl hover:bg-brand-electric-dark transition-all shadow-sm shadow-blue-500/20"
          >
            <Play className="w-3.5 h-3.5" />
            <span>New Interview</span>
          </button>
        </header>

        <main className="flex-1 px-8 py-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: 'Total Sessions',
                value: reports.length,
                icon: Brain,
                color: 'text-brand-electric',
                bg: 'bg-blue-50',
                sub:
                  reports.length === 0
                    ? 'Start your first'
                    : `${reports.length} completed`,
              },
              {
                label: 'Avg. Score',
                value: avgScore || '—',
                icon: BarChart2,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                sub:
                  avgScore >= 70
                    ? 'Above target'
                    : avgScore > 0
                    ? 'Keep practicing'
                    : 'No data yet',
              },
              {
                label: 'Best Score',
                value: bestScore || '—',
                icon: Award,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                sub:
                  bestScore >= 85
                    ? 'Excellent performance'
                    : bestScore > 0
                    ? 'Personal best'
                    : 'No data yet',
              },
              {
                label: 'Mock Requests',
                value: mockRequests.length,
                icon: Ticket,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                sub:
                  mockRequests.filter((r) => r.status === 'approved').length > 0
                    ? `${mockRequests.filter((r) => r.status === 'approved').length} approved`
                    : mockRequests.length > 0
                    ? 'Pending review'
                    : 'None yet',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-0.5">{stat.value}</p>
                <p className="text-xs font-semibold text-slate-500 mb-1">{stat.label}</p>
                <p className="text-[11px] text-slate-400">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-8 space-y-5">
              <div className="bg-gradient-to-br from-slate-800 to-brand-electric-dark rounded-2xl p-7 text-white relative overflow-hidden shadow-lg shadow-blue-900/20">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 transform translate-x-1/3 -translate-y-1/3"></div>
                  <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-brand-electric/10 transform -translate-x-1/3 translate-y-1/3"></div>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                        AI Mock Interview
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 leading-tight">
                      Practice makes
                      <br />
                      perfect
                    </h2>
                    <p className="text-white/60 text-sm mb-6 max-w-xs">
                      Sophyra adapts questions to your role, experience, and resume in real-time.
                    </p>
                    <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                      <button
                        onClick={() => setShowInterviewModal(true)}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-white text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-100 transition-all shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Interview</span>
                      </button>
                      <button
                        onClick={() => navigate('/interview/simulate')}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/15 transition-all border border-white/10"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Simulate</span>
                      </button>
                      <button
                        onClick={() => navigate('/interview/manual')}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/15 transition-all border border-white/10"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Request Manual</span>
                      </button>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="w-32 h-32 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <img src="/lo.png" alt="Sophyra" className="w-24 h-24 opacity-80" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Recent Reports</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{reports.length} total interviews</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-slate-300" />
                </div>

                {reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                      <FileText className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">No interviews yet</p>
                    <p className="text-xs text-slate-400 mb-5 max-w-[200px]">
                      Complete your first AI interview to see performance reports here.
                    </p>
                    <button
                      onClick={() => setShowInterviewModal(true)}
                      className="px-4 py-2 bg-brand-electric text-white text-xs font-semibold rounded-xl hover:bg-brand-electric-dark transition-colors"
                    >
                      Start First Interview
                    </button>
                  </div>
                ) : (
                  <>
                    {recentTrend.length > 1 && (
                      <div className="px-6 py-4 border-b border-slate-50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                          Score Trend
                        </p>
                        <div className="flex items-end space-x-2 h-12">
                          {recentTrend.map((r, i) => (
                            <div
                              key={r.id}
                              className="flex-1 flex flex-col items-center space-y-1 group cursor-default"
                            >
                              <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                {r.overall_score}
                              </span>
                              <div
                                className={`w-full rounded-t-md transition-all ${getScoreBarColor(r.overall_score)} ${
                                  i === recentTrend.length - 1 ? 'opacity-100' : 'opacity-40'
                                }`}
                                style={{ height: `${Math.max(6, (r.overall_score / 100) * 40)}px` }}
                              ></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="divide-y divide-slate-50">
                      {reports.slice(0, 5).map((report) => (
                        <div
                          key={report.id}
                          onClick={() => navigate(`/report/${report.id}`)}
                          className="flex items-center px-6 py-4 hover:bg-slate-50/70 cursor-pointer transition-colors group"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 mr-4 ${getScoreBg(report.overall_score)}`}
                          >
                            <span
                              className={`text-sm font-bold ${getScoreColor(report.overall_score)}`}
                            >
                              {report.overall_score}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {report.session.role}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {report.session.company ? `${report.session.company} · ` : ''}
                              {new Date(report.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${getScoreBg(report.overall_score)} ${getScoreColor(report.overall_score)}`}
                            >
                              {getScoreLabel(report.overall_score)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {reports.length > 5 && (
                      <div className="px-6 py-3 border-t border-slate-50">
                        <button
                          onClick={() => navigate(`/report/${reports[0].id}`)}
                          className="text-xs text-slate-500 font-semibold hover:text-slate-900 transition-colors flex items-center space-x-1"
                        >
                          <span>View all {reports.length} reports</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="col-span-4 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">My Requests</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manual interviews</p>
                  </div>
                  <Ticket className="w-4 h-4 text-slate-300" />
                </div>

                {mockRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-3">
                      <Ticket className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">No requests yet</p>
                    <p className="text-[11px] text-slate-400 mb-4">
                      Request an interview with an HR professional.
                    </p>
                    <button
                      onClick={() => navigate('/interview/manual')}
                      className="px-3 py-1.5 bg-brand-electric text-white text-xs font-semibold rounded-lg hover:bg-brand-electric-dark transition-colors"
                    >
                      Request Interview
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {mockRequests.slice(0, 4).map((request) => (
                      <div
                        key={request.id}
                        className="px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <p className="text-xs font-semibold text-slate-900 truncate flex-1 pr-2 leading-relaxed">
                            {request.job_role}
                          </p>
                          <StatusBadge status={request.status} size="sm" />
                        </div>
                        <div className="flex items-center text-[11px] text-gray-400">
                          <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span>
                            {new Date(request.preferred_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        {request.status === 'approved' && request.scheduled_date && (
                          <div className="mt-2 pt-2 border-t border-slate-50">
                            <p className="text-[11px] text-emerald-600 font-semibold flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(request.scheduled_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              at {request.scheduled_time}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    {mockRequests.length > 4 && (
                      <div className="px-5 py-3">
                        <button className="text-[11px] text-gray-500 font-semibold hover:text-gray-900 transition-colors">
                          +{mockRequests.length - 4} more
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Coaching Tips</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {tips ? 'Personalized feedback' : 'General advice'}
                    </p>
                  </div>
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                </div>

                <div className="p-5 space-y-4">
                  {!tips && (
                    <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <AlertCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                        Complete an interview to get personalized coaching tips.
                      </p>
                    </div>
                  )}

                  {(tips?.identified_weaknesses || DEFAULT_TIPS.identified_weaknesses).length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                        Focus Areas
                      </p>
                      <ul className="space-y-2">
                        {(tips?.identified_weaknesses || DEFAULT_TIPS.identified_weaknesses)
                          .slice(0, 3)
                          .map((w, i) => (
                            <li
                              key={i}
                              className="flex items-start space-x-2 text-[12px] text-slate-600"
                            >
                              <span className="w-1.5 h-1.5 bg-brand-electric rounded-full mt-1.5 flex-shrink-0"></span>
                              <span className="leading-relaxed">{w}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {(tips?.suggested_topics || DEFAULT_TIPS.suggested_topics).length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                        Prep Topics
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(tips?.suggested_topics || DEFAULT_TIPS.suggested_topics)
                          .slice(0, 4)
                          .map((topic, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg"
                            >
                              {topic}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showInterviewModal && (
        <MockInterviewModal onClose={() => setShowInterviewModal(false)} />
      )}
    </div>
  );
}
