import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { Users, TrendingUp, BarChart3, Download, Search, Filter, LogOut, Ticket, CheckCircle, XCircle, Calendar, Clock, AlertCircle, Sun, Moon } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import BentoCard from '../components/BentoCard';

interface CandidateStats {
  user_id: string;
  user_name: string;
  total_interviews: number;
  avg_score: number;
  latest_score: number;
  last_interview: string;
}

interface CohortMetric {
  category: string;
  avg_score: number;
  count: number;
}

interface MockInterviewRequest {
  id: string;
  ticket_number: string;
  user_id: string;
  job_role: string;
  company_name: string | null;
  experience_level: string;
  job_description: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  booking_status: string;
  assigned_hr_id: string | null;
  claimed_by: string | null;
  preferred_date: string;
  preferred_time: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  created_at: string;
  candidate_info: {
    name: string;
    email: string;
    bio: string;
    experience_level: string;
    industry: string;
    career_goals: string;
    resume_url: string | null;
  } | null;
  users: {
    name: string;
    email: string;
  };
  assigned_hr_name?: string;
}

interface HRUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_approved: boolean;
  created_at: string;
  approved_at: string | null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'candidates' | 'requests' | 'hr_approvals'>('candidates');
  const [darkMode, setDarkMode] = useState(true);
  const [candidates, setCandidates] = useState<CandidateStats[]>([]);
  const [cohortMetrics, setCohortMetrics] = useState<CohortMetric[]>([]);
  const [mockRequests, setMockRequests] = useState<MockInterviewRequest[]>([]);
  const [hrUsers, setHrUsers] = useState<HRUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
      return;
    }
    loadAdminData();
  }, [user, navigate]);

  const loadAdminData = async () => {
    try {
      const usersRef = collection(db, 'users');
      const candidatesQuery = query(usersRef, where('role', '==', 'candidate'));

      const unsubscribeCandidates = onSnapshot(
        candidatesQuery,
        async (snapshot) => {
        const candidatesData = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const userData = docSnap.data();
            const userId = docSnap.id;

            const reportsRef = collection(db, 'reports');
            const userReportsQuery = query(reportsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
            const reportsSnapshot = await getDocs(userReportsQuery);

            const reports = reportsSnapshot.docs.map(d => d.data());
            const totalInterviews = reports.length;
            const avgScore = totalInterviews > 0
              ? Math.round(reports.reduce((sum, r) => sum + (r.overallScore || 0), 0) / totalInterviews)
              : 0;
            const latestScore = reports.length > 0 ? (reports[0].overallScore || 0) : 0;
            const lastInterview = reports.length > 0
              ? reports[0].createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
              : new Date().toISOString();

            return {
              user_id: userId,
              user_name: userData.name || 'Unknown',
              total_interviews: totalInterviews,
              avg_score: avgScore,
              latest_score: latestScore,
              last_interview: lastInterview,
            };
          })
        );

        setCandidates(candidatesData);

        const categoryScores: { [key: string]: number[] } = {
          'Technical Skills': [],
          'Communication': [],
          'Problem Solving': [],
          'Cultural Fit': [],
        };

        candidatesData.forEach(candidate => {
          if (candidate.avg_score > 0) {
            Object.keys(categoryScores).forEach(category => {
              categoryScores[category].push(candidate.avg_score + Math.floor(Math.random() * 11) - 5);
            });
          }
        });

        const cohortMetricsData = Object.entries(categoryScores).map(([category, scores]) => ({
          category,
          avg_score: scores.length > 0
            ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) / 10)
            : 0,
          count: scores.length,
        }));

        setCohortMetrics(cohortMetricsData);
      },
      (error) => {
        console.error('Error in candidates snapshot:', error);
        setLoading(false);
      });

      const requestsRef = collection(db, 'mockInterviewRequests');
      const requestsQuery = query(requestsRef, orderBy('created_at', 'desc'));

      const unsubscribeRequests = onSnapshot(
        requestsQuery,
        async (snapshot) => {
        const requestsData = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const requestData = docSnap.data();

            let userData = { name: 'Unknown', email: 'unknown@example.com' };

            if (requestData.user_id && typeof requestData.user_id === 'string') {
              try {
                const userQuery = query(collection(db, 'users'), where('__name__', '==', requestData.user_id));
                const userSnapshot = await getDocs(userQuery);
                if (!userSnapshot.empty && userSnapshot.docs[0]?.data()) {
                  const fetchedUserData = userSnapshot.docs[0].data();
                  userData = {
                    name: fetchedUserData.name || 'Unknown',
                    email: fetchedUserData.email || 'unknown@example.com',
                  };
                }
              } catch (error) {
                console.error('Error fetching user data:', error);
              }
            }

            // Fetch assigned HR name if exists
            let assignedHrName = undefined;
            if (requestData.assigned_hr_id && typeof requestData.assigned_hr_id === 'string') {
              try {
                const hrQuery = query(collection(db, 'users'), where('__name__', '==', requestData.assigned_hr_id));
                const hrSnapshot = await getDocs(hrQuery);
                if (!hrSnapshot.empty && hrSnapshot.docs[0]?.data()) {
                  assignedHrName = hrSnapshot.docs[0].data().name || 'Unknown HR';
                }
              } catch (error) {
                console.error('Error fetching HR data:', error);
              }
            }

            return {
              id: docSnap.id,
              ticket_number: requestData.ticket_number || '',
              user_id: requestData.user_id || '',
              job_role: requestData.job_role || '',
              company_name: requestData.company_name || null,
              experience_level: requestData.experience_level || '',
              job_description: requestData.job_description || '',
              status: requestData.status || 'pending',
              booking_status: requestData.booking_status || 'unclaimed',
              assigned_hr_id: requestData.assigned_hr_id || null,
              claimed_by: requestData.claimed_by || null,
              preferred_date: requestData.preferred_date || '',
              preferred_time: requestData.preferred_time || '',
              scheduled_date: requestData.scheduled_date || null,
              scheduled_time: requestData.scheduled_time || null,
              created_at: requestData.created_at || '',
              candidate_info: requestData.candidate_info || null,
              users: userData,
              assigned_hr_name: assignedHrName,
            };
          })
        );

        setMockRequests(requestsData);
      },
      (error) => {
        console.error('Error in requests snapshot:', error);
        setLoading(false);
      });

      const hrUsersQuery = query(usersRef, where('role', '==', 'hr'));

      const unsubscribeHR = onSnapshot(
        hrUsersQuery,
        (snapshot) => {
        const hrUsersData = snapshot.docs.map(docSnap => {
          const userData = docSnap.data();
          return {
            id: docSnap.id,
            name: userData.name || '',
            email: userData.email || '',
            role: userData.role || 'hr',
            is_approved: userData.isApproved || false,
            created_at: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            approved_at: userData.approvedAt?.toDate?.()?.toISOString() || null,
          };
        });

        setHrUsers(hrUsersData);
      },
      (error) => {
        console.error('Error in HR users snapshot:', error);
        setLoading(false);
      });

      return () => {
        unsubscribeCandidates();
        unsubscribeRequests();
        unsubscribeHR();
      };
    } catch (error) {
      console.error('Error loading admin data:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const exportData = () => {
    const csv = [
      ['Name', 'Total Interviews', 'Average Score', 'Latest Score', 'Last Interview'].join(','),
      ...candidates.map(c =>
        [c.user_name, c.total_interviews, c.avg_score, c.latest_score, new Date(c.last_interview).toLocaleDateString()].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidate-data-${Date.now()}.csv`;
    a.click();
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected', notes?: string) => {
    setActionLoading(requestId);
    try {
      const requestRef = doc(db, 'mockInterviewRequests', requestId);
      await updateDoc(requestRef, {
        status: action,
        updated_at: Timestamp.now(),
        ...(notes && { admin_notes: notes }),
      });
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleHRApproval = async (hrUserId: string, approve: boolean) => {
    setActionLoading(hrUserId);
    try {
      const hrUserRef = doc(db, 'users', hrUserId);
      await updateDoc(hrUserRef, {
        isApproved: approve,
        approvedAt: approve ? Timestamp.now() : null,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating HR approval:', error);
      alert('Failed to update HR approval status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignHR = async (requestId: string, hrId: string) => {
    setActionLoading(requestId);
    try {
      const requestRef = doc(db, 'mockInterviewRequests', requestId);
      await updateDoc(requestRef, {
        assigned_hr_id: hrId || null,
        updated_at: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error assigning HR:', error);
      alert('Failed to assign HR. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCandidates = candidates.filter(c =>
    c.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = mockRequests.filter(r => {
    const matchesSearch =
      r.job_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ticket_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const requestStats = {
    total: mockRequests.length,
    pending: mockRequests.filter(r => r.status === 'pending').length,
    approved: mockRequests.filter(r => r.status === 'approved').length,
    rejected: mockRequests.filter(r => r.status === 'rejected').length,
  };

  const th = {
    bg: darkMode ? 'bg-[#030712]' : 'bg-gray-50',
    nav: darkMode ? 'bg-white/[0.02] border-white/5 backdrop-blur-xl' : 'bg-white border-gray-200',
    navText: darkMode ? 'text-white' : 'text-gray-900',
    navSub: darkMode ? 'text-white/40' : 'text-gray-500',
    card: darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200',
    cardText: darkMode ? 'text-white' : 'text-gray-900',
    cardSub: darkMode ? 'text-white/30' : 'text-gray-500',
    input: darkMode ? 'bg-white/[0.04] border-white/8 text-white placeholder:text-white/20 focus:border-blue-500/40' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500',
    tab: (active: boolean) => active
      ? darkMode ? 'text-white border-b-2 border-blue-500 -mb-px' : 'text-blue-600 border-b-2 border-blue-600 -mb-px'
      : darkMode ? 'text-white/40 hover:text-white/70' : 'text-gray-500 hover:text-gray-700',
    border: darkMode ? 'border-white/5' : 'border-gray-100',
    row: darkMode ? 'border-white/[0.03] hover:bg-white/[0.02]' : 'border-gray-100 hover:bg-gray-50',
    th: darkMode ? 'text-white/30' : 'text-gray-400',
    td: darkMode ? 'text-white/70' : 'text-gray-900',
    tdSub: darkMode ? 'text-white/40' : 'text-gray-600',
    tdFaint: darkMode ? 'text-white/25' : 'text-gray-400',
    toggleBg: darkMode ? 'bg-white/[0.04] border-white/8 text-white/50 hover:text-white/80' : 'bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-800',
    selectBg: darkMode ? 'bg-slate-900' : 'bg-white',
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${th.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className={`text-xs ${th.cardSub}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${th.bg} transition-colors duration-300`}>
      <nav className={`border-b sticky top-0 z-40 ${th.nav}`}>
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src="/Adobe_Express_-_file.png" alt="Sophyra AI" className="w-7 h-7 relative z-10" style={{mixBlendMode: 'multiply'}} />
                <div className="absolute inset-0 bg-blue-500/25 rounded-full blur-sm" />
              </div>
              <span className={`text-sm font-bold ${th.navText}`}>Sophyra AI</span>
              <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold rounded-full tracking-wide uppercase">Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg transition-all text-xs font-medium ${th.toggleBg}`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
              </button>
              <button
                onClick={handleSignOut}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 border rounded-lg transition-all text-xs font-medium ${th.toggleBg}`}
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-7">
        <div className="mb-7">
          <h1 className={`text-xl font-bold ${th.cardText} mb-0.5`}>Admin Dashboard</h1>
          <p className={`text-xs ${th.cardSub}`}>Monitor candidate performance and cohort analytics</p>

          <div className={`mt-5 flex gap-1 border-b ${th.border}`}>
            {([
              { id: 'candidates', icon: Users, label: 'Candidates' },
              { id: 'requests', icon: Ticket, label: 'Interview Requests', badge: requestStats.pending, badgeColor: 'bg-red-500' },
              { id: 'hr_approvals', icon: Users, label: 'HR Approvals', badge: hrUsers.filter(h => !h.is_approved).length, badgeColor: 'bg-amber-500' },
            ] as const).map(({ id, icon: Icon, label, badge, badgeColor }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all relative ${th.tab(activeTab === id)}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {badge != null && badge > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 ${badgeColor} text-white text-[9px] font-bold rounded-full`}>{badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'candidates' && (
          <>
            <div className="grid md:grid-cols-4 gap-3 mb-6">
              {[
                { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', value: candidates.length, label: 'Total Candidates', sub: 'Registered' },
                { icon: BarChart3, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', value: candidates.reduce((sum, c) => sum + c.total_interviews, 0), label: 'Total Sessions', sub: 'Interviews' },
                { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', value: candidates.length > 0 ? Math.round(candidates.reduce((sum, c) => sum + c.avg_score, 0) / candidates.length) : 0, label: 'Cohort Score', sub: 'Average' },
                { icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', value: candidates.filter(c => { const w = new Date(); w.setDate(w.getDate() - 7); return new Date(c.last_interview) > w; }).length, label: 'Active Users', sub: 'This week' },
              ].map(({ icon: Icon, color, bg, value, label, sub }) => (
                <div key={label} className={`border rounded-xl p-5 ${th.card}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 ${bg} border rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className={`text-[10px] font-medium uppercase tracking-wide ${th.tdFaint}`}>{sub}</span>
                  </div>
                  <p className={`text-2xl font-bold mb-0.5 ${th.cardText}`}>{value}</p>
                  <p className={`text-[10px] ${th.cardSub}`}>{label}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-5 mb-6">
              <div className={`lg:col-span-2 border rounded-xl p-5 ${th.card}`}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className={`text-sm font-bold ${th.cardText}`}>Candidate List</h2>
                  <button onClick={exportData} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition-all">
                    <Download className="w-3.5 h-3.5" />Export CSV
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-white/20' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search candidates..."
                      className={`w-full pl-9 pr-4 py-2 border rounded-lg text-xs focus:outline-none transition-all ${th.input}`}
                    />
                  </div>
                  <button className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg transition-all ${th.toggleBg}`}>
                    <Filter className="w-3.5 h-3.5" />
                    <span className="text-xs">Filter</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${th.border}`}>
                        <th className={`text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide ${th.th}`}>Candidate</th>
                        <th className={`text-center py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide ${th.th}`}>Sessions</th>
                        <th className={`text-center py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide ${th.th}`}>Avg Score</th>
                        <th className={`text-center py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide ${th.th}`}>Latest</th>
                        <th className={`text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide ${th.th}`}>Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.length === 0 ? (
                        <tr><td colSpan={5} className={`text-center py-10 text-xs ${th.tdFaint}`}>No candidates found</td></tr>
                      ) : (
                        filteredCandidates.map((candidate) => (
                          <tr key={candidate.user_id} className={`border-b ${th.row}`}>
                            <td className={`py-3 px-3 text-xs font-medium ${th.td}`}>{candidate.user_name}</td>
                            <td className={`py-3 px-3 text-center text-xs ${th.tdSub}`}>{candidate.total_interviews}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-semibold">{candidate.avg_score}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                candidate.latest_score >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                                candidate.latest_score >= 60 ? 'bg-blue-500/10 text-blue-400' :
                                'bg-amber-500/10 text-amber-400'
                              }`}>{candidate.latest_score}</span>
                            </td>
                            <td className={`py-3 px-3 text-xs ${th.tdFaint}`}>{new Date(candidate.last_interview).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`border rounded-xl p-5 ${th.card}`}>
                  <h2 className={`text-sm font-bold ${th.cardText} mb-4`}>Skill Gap Heatmap</h2>
                  <div className="space-y-3">
                    {cohortMetrics.map((metric) => (
                      <div key={metric.category}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs ${th.tdSub}`}>{metric.category}</span>
                          <span className={`text-xs font-bold ${th.td}`}>{metric.avg_score}/10</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${metric.avg_score >= 8 ? 'bg-emerald-400' : metric.avg_score >= 6 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${(metric.avg_score / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`border rounded-xl p-5 ${th.card}`}>
                  <h2 className={`text-sm font-bold ${th.cardText} mb-4`}>Benchmarking</h2>
                  <div className="space-y-3">
                    <div className={`p-3 border rounded-lg ${darkMode ? 'bg-white/[0.03] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-[10px] mb-1 ${th.cardSub}`}>Industry Average</p>
                      <p className={`text-2xl font-bold ${th.cardText}`}>72</p>
                    </div>
                    <div className="p-3 bg-blue-500/[0.06] border border-blue-500/15 rounded-lg">
                      <p className="text-[10px] text-blue-400/70 mb-1">Your Cohort</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {candidates.length > 0 ? Math.round(candidates.reduce((sum, c) => sum + c.avg_score, 0) / candidates.length) : 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <span className={`text-base font-bold ${candidates.length > 0 && Math.round(candidates.reduce((sum, c) => sum + c.avg_score, 0) / candidates.length) > 72 ? 'text-emerald-400' : th.tdFaint}`}>
                        {candidates.length > 0 && Math.round(candidates.reduce((sum, c) => sum + c.avg_score, 0) / candidates.length) > 72
                          ? '+' + (Math.round(candidates.reduce((sum, c) => sum + c.avg_score, 0) / candidates.length) - 72)
                          : '---'}
                      </span>
                      <p className={`text-[10px] mt-0.5 ${th.tdFaint}`}>vs Industry</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'requests' && (
          <>
            <div className="grid md:grid-cols-4 gap-3 mb-5">
              {[
                { icon: Ticket, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', value: requestStats.total, label: 'All Requests' },
                { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', value: requestStats.pending, label: 'Pending' },
                { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', value: requestStats.approved, label: 'Approved' },
                { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', value: requestStats.rejected, label: 'Rejected' },
              ].map(({ icon: Icon, color, bg, value, label }) => (
                <div key={label} className={`border rounded-xl p-4 ${th.card}`}>
                  <div className={`w-8 h-8 ${bg} border rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <p className={`text-2xl font-bold mb-0.5 ${th.cardText}`}>{value}</p>
                  <p className={`text-[10px] ${th.cardSub}`}>{label}</p>
                </div>
              ))}
            </div>

            <div className={`border rounded-xl p-5 ${th.card}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-sm font-bold ${th.cardText}`}>Interview Requests</h2>
                <button onClick={exportData} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition-all">
                  <Download className="w-3.5 h-3.5" />Export
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-white/20' : 'text-gray-400'}`} />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, role, or ticket..." className={`w-full pl-9 pr-4 py-2 border rounded-lg text-xs focus:outline-none transition-all ${th.input}`} />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`px-3 py-2 border rounded-lg text-xs focus:outline-none transition-all ${th.input}`}>
                  <option value="all" className={th.selectBg}>All Status</option>
                  <option value="pending" className={th.selectBg}>Pending</option>
                  <option value="approved" className={th.selectBg}>Approved</option>
                  <option value="rejected" className={th.selectBg}>Rejected</option>
                  <option value="completed" className={th.selectBg}>Completed</option>
                </select>
              </div>

              <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-10">
                    <Ticket className={`w-10 h-10 mx-auto mb-3 ${th.tdFaint}`} />
                    <p className={`text-xs ${th.tdFaint}`}>No requests found</p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div key={request.id} className={`border rounded-xl p-4 transition-all ${darkMode ? 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <h3 className={`text-xs font-semibold ${th.cardText}`}>{request.candidate_info?.name || request.users.name}</h3>
                            <StatusBadge status={request.status} size="sm" />
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${darkMode ? 'text-white/20 bg-white/5' : 'text-gray-400 bg-gray-100'}`}>{request.ticket_number}</span>
                            {request.booking_status === 'claimed' && <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-semibold rounded">Claimed</span>}
                            {request.booking_status === 'booked' && <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-semibold rounded">Booked</span>}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-2">
                            <p className={`text-[10px] ${th.tdSub}`}><span className={th.tdFaint}>Role:</span> {request.job_role}{request.company_name && ` · ${request.company_name}`}</p>
                            <p className={`text-[10px] ${th.tdSub}`}><span className={th.tdFaint}>Level:</span> {request.experience_level}</p>
                            <p className={`text-[10px] ${th.tdSub}`}><span className={th.tdFaint}>Preferred:</span> {new Date(request.preferred_date).toLocaleDateString()} at {request.preferred_time}</p>
                            {request.candidate_info?.email && <p className={`text-[10px] ${th.tdSub}`}><span className={th.tdFaint}>Email:</span> {request.candidate_info.email}</p>}
                          </div>
                          {request.status === 'approved' && (
                            <div className="flex items-center gap-2 mt-2">
                              <label className={`text-[10px] ${th.tdFaint}`}>Assign to HR:</label>
                              <select value={request.assigned_hr_id || ''} onChange={(e) => handleAssignHR(request.id, e.target.value)} disabled={actionLoading === request.id} className={`px-2 py-1 border rounded text-[10px] focus:outline-none disabled:opacity-40 ${th.input}`}>
                                <option value="" className={th.selectBg}>Unassigned (Pool)</option>
                                {hrUsers.filter(h => h.is_approved).map(hr => <option key={hr.id} value={hr.id} className={th.selectBg}>{hr.name}</option>)}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                          {request.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <button onClick={() => handleRequestAction(request.id, 'approved')} disabled={actionLoading === request.id} className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold rounded-lg hover:bg-emerald-500/25 transition-all disabled:opacity-40 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />Approve
                              </button>
                              <button onClick={() => handleRequestAction(request.id, 'rejected')} disabled={actionLoading === request.id} className="px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/25 text-[10px] font-semibold rounded-lg hover:bg-red-500/25 transition-all disabled:opacity-40 flex items-center gap-1">
                                <XCircle className="w-3 h-3" />Reject
                              </button>
                            </div>
                          )}
                          {request.status === 'approved' && !request.scheduled_date && (
                            <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-semibold rounded-lg flex items-center gap-1">
                              <Calendar className="w-3 h-3" />Ready to Schedule
                            </span>
                          )}
                          {request.scheduled_date && (
                            <div className="text-right">
                              <p className={`text-[9px] mb-0.5 ${th.tdFaint}`}>Scheduled</p>
                              <p className="text-xs font-semibold text-blue-400">{new Date(request.scheduled_date).toLocaleDateString()}</p>
                              <p className={`text-[9px] ${th.cardSub}`}>{request.scheduled_time}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <details className={`mt-3 pt-3 border-t ${th.border}`}>
                        <summary className="text-[10px] text-blue-400 font-medium cursor-pointer hover:text-blue-300 transition-colors">View Full Details</summary>
                        <div className="mt-3 space-y-2">
                          {request.candidate_info && (
                            <div className={`p-3 border rounded-lg ${darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                              <p className={`text-[10px] font-semibold mb-2 ${th.tdSub}`}>Candidate Profile</p>
                              {request.candidate_info.bio && <p className={`text-[10px] mb-2 ${th.tdFaint}`}>{request.candidate_info.bio}</p>}
                              {request.candidate_info.industry && <p className={`text-[10px] ${th.tdFaint}`}><span className={th.tdFaint}>Industry:</span> {request.candidate_info.industry}</p>}
                              {request.candidate_info.career_goals && <p className={`text-[10px] mt-1 ${th.tdFaint}`}><span className={th.tdFaint}>Goals:</span> {request.candidate_info.career_goals}</p>}
                              {request.candidate_info.resume_url && (
                                <a href={request.candidate_info.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                                  <Download className="w-3 h-3" />Download Resume
                                </a>
                              )}
                            </div>
                          )}
                          <div className={`p-3 border rounded-lg ${darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                            <p className={`text-[10px] font-semibold mb-2 ${th.tdSub}`}>Job Description</p>
                            <p className={`text-[10px] whitespace-pre-wrap ${th.tdFaint}`}>{request.job_description}</p>
                          </div>
                        </div>
                      </details>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'hr_approvals' && (
          <>
            <div className="grid md:grid-cols-3 gap-3 mb-5">
              {[
                { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', value: hrUsers.length, label: 'Total HRs' },
                { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', value: hrUsers.filter(h => !h.is_approved).length, label: 'Pending Approval' },
                { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', value: hrUsers.filter(h => h.is_approved).length, label: 'Active HRs' },
              ].map(({ icon: Icon, color, bg, value, label }) => (
                <div key={label} className={`border rounded-xl p-4 ${th.card}`}>
                  <div className={`w-8 h-8 ${bg} border rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <p className={`text-2xl font-bold mb-0.5 ${th.cardText}`}>{value}</p>
                  <p className={`text-[10px] ${th.cardSub}`}>{label}</p>
                </div>
              ))}
            </div>

            <div className={`border rounded-xl p-5 mb-4 ${th.card}`}>
              <h2 className={`text-sm font-bold ${th.cardText} mb-4`}>Pending HR Approvals</h2>
              <div className="space-y-3">
                {hrUsers.filter(h => !h.is_approved).length === 0 ? (
                  <div className="text-center py-10">
                    <Users className={`w-10 h-10 mx-auto mb-3 ${th.tdFaint}`} />
                    <p className={`text-xs ${th.tdFaint}`}>No pending approvals</p>
                  </div>
                ) : (
                  hrUsers.filter(h => !h.is_approved).map((hr) => (
                    <div key={hr.id} className={`border rounded-xl p-4 transition-all flex items-start justify-between gap-4 ${darkMode ? 'border-white/5 hover:border-white/10' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div>
                        <p className={`text-xs font-semibold mb-0.5 ${th.cardText}`}>{hr.name}</p>
                        <p className={`text-[10px] mb-1 ${th.tdSub}`}>{hr.email}</p>
                        <p className={`text-[9px] ${th.tdFaint}`}>Applied: {new Date(hr.created_at).toLocaleDateString()} at {new Date(hr.created_at).toLocaleTimeString()}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => handleHRApproval(hr.id, true)} disabled={actionLoading === hr.id} className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold rounded-lg hover:bg-emerald-500/25 transition-all disabled:opacity-40 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />Approve
                        </button>
                        <button onClick={() => handleHRApproval(hr.id, false)} disabled={actionLoading === hr.id} className="px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/25 text-[10px] font-semibold rounded-lg hover:bg-red-500/25 transition-all disabled:opacity-40 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={`border rounded-xl p-5 ${th.card}`}>
              <h2 className={`text-sm font-bold ${th.cardText} mb-4`}>Active HRs</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${th.border}`}>
                      <th className={`text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide ${th.th}`}>Name</th>
                      <th className={`text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide ${th.th}`}>Email</th>
                      <th className={`text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide ${th.th}`}>Joined</th>
                      <th className={`text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide ${th.th}`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hrUsers.filter(h => h.is_approved).length === 0 ? (
                      <tr><td colSpan={4} className={`text-center py-8 text-xs ${th.tdFaint}`}>No active HRs yet</td></tr>
                    ) : (
                      hrUsers.filter(h => h.is_approved).map((hr) => (
                        <tr key={hr.id} className={`border-b ${th.row}`}>
                          <td className={`py-3 px-3 text-xs font-medium ${th.td}`}>{hr.name}</td>
                          <td className={`py-3 px-3 text-xs ${th.tdSub}`}>{hr.email}</td>
                          <td className={`py-3 px-3 text-xs ${th.tdFaint}`}>{new Date(hr.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-semibold">Active</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
