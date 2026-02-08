import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Brain, Users, TrendingUp, BarChart3, Download, Search, Filter, LogOut, Ticket, CheckCircle, XCircle, Calendar, Clock, AlertCircle } from 'lucide-react';
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
  preferred_date: string;
  preferred_time: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  created_at: string;
  users: {
    name: string;
    email: string;
  };
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
      const { data: reportsData } = await supabase
        .from('reports')
        .select(`
          overall_score,
          performance_breakdown,
          created_at,
          sessions!inner (
            user_id,
            role,
            experience_level,
            users!inner (
              name
            )
          )
        `);

      if (reportsData) {
        const candidateMap = new Map<string, any>();

        reportsData.forEach((report: any) => {
          const userId = report.sessions.user_id;
          const userName = report.sessions.users.name;

          if (!candidateMap.has(userId)) {
            candidateMap.set(userId, {
              user_id: userId,
              user_name: userName,
              total_interviews: 0,
              scores: [],
              last_interview: report.created_at,
            });
          }

          const candidate = candidateMap.get(userId);
          candidate.total_interviews++;
          candidate.scores.push(report.overall_score);
          if (new Date(report.created_at) > new Date(candidate.last_interview)) {
            candidate.last_interview = report.created_at;
          }
        });

        const candidateStats: CandidateStats[] = Array.from(candidateMap.values()).map(c => ({
          user_id: c.user_id,
          user_name: c.user_name,
          total_interviews: c.total_interviews,
          avg_score: Math.round(c.scores.reduce((a: number, b: number) => a + b, 0) / c.scores.length),
          latest_score: c.scores[c.scores.length - 1],
          last_interview: c.last_interview,
        }));

        setCandidates(candidateStats);

        const metrics: CohortMetric[] = [
          {
            category: 'Clarity',
            avg_score: 7.5,
            count: reportsData.length,
          },
          {
            category: 'Confidence',
            avg_score: 7.8,
            count: reportsData.length,
          },
          {
            category: 'Relevance',
            avg_score: 7.2,
            count: reportsData.length,
          },
          {
            category: 'Professionalism',
            avg_score: 8.1,
            count: reportsData.length,
          },
        ];

        setCohortMetrics(metrics);
      }

      const { data: requestsData } = await supabase
        .from('mock_interview_requests')
        .select(`
          *,
          users:user_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (requestsData) {
        setMockRequests(requestsData.map(r => ({
          ...r,
          users: Array.isArray(r.users) ? r.users[0] : r.users
        })) as any);
      }

      const { data: hrUsersData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'hr')
        .order('created_at', { ascending: false });

      if (hrUsersData) {
        setHrUsers(hrUsersData as any);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
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
      const { error } = await supabase
        .from('mock_interview_requests')
        .update({
          status: action,
          admin_notes: notes || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      await supabase
        .from('admin_actions')
        .insert({
          admin_id: user!.id,
          action_type: action,
          request_id: requestId,
          notes: notes || null,
        });

      await loadAdminData();
    } catch (error) {
      console.error('Error updating request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleHRApproval = async (hrUserId: string, approve: boolean) => {
    setActionLoading(hrUserId);
    try {
      if (approve) {
        const { error } = await supabase
          .from('users')
          .update({
            is_approved: true,
            approved_by: user!.id,
            approved_at: new Date().toISOString(),
          })
          .eq('id', hrUserId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', hrUserId);

        if (error) throw error;
      }

      await loadAdminData();
    } catch (error) {
      console.error('Error updating HR approval:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/lo.png" alt="Sophyra AI" className="w-10 h-10" />
              <div>
                <span className="text-2xl font-bold text-gray-900">Sophyra AI</span>
                <span className="ml-3 px-3 py-1 bg-brand-electric/10 text-brand-electric text-xs font-semibold rounded-full">
                  Admin
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor candidate performance and cohort analytics</p>

          <div className="mt-6 flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'candidates'
                  ? 'text-swiss-accent-teal border-b-2 border-swiss-accent-teal'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Candidates</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'requests'
                  ? 'text-swiss-accent-teal border-b-2 border-swiss-accent-teal'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Ticket className="w-4 h-4" />
                <span>Interview Requests</span>
                {requestStats.pending > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {requestStats.pending}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('hr_approvals')}
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'hr_approvals'
                  ? 'text-swiss-accent-teal border-b-2 border-swiss-accent-teal'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>HR Approvals</span>
                {hrUsers.filter(h => !h.is_approved).length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                    {hrUsers.filter(h => !h.is_approved).length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {activeTab === 'candidates' && (
          <>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-teal-500" />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{candidates.length}</div>
            <div className="text-sm text-gray-600 mt-1">Candidates</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              <span className="text-sm text-gray-500">Interviews</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {candidates.reduce((sum, c) => sum + c.total_interviews, 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Sessions</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <span className="text-sm text-gray-500">Average</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {candidates.length > 0
                ? Math.round(candidates.reduce((sum, c) => sum + c.avg_score, 0) / candidates.length)
                : 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Cohort Score</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <span className="text-sm text-gray-500">This Week</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {candidates.filter(c => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(c.last_interview) > weekAgo;
              }).length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Active Users</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Candidate List</h2>
              <button
                onClick={exportData}
                className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export CSV</span>
              </button>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search candidates..."
                  className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filter</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Candidate</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Interviews</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Avg Score</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Latest</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No candidates found
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((candidate) => (
                      <tr key={candidate.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{candidate.user_name}</div>
                        </td>
                        <td className="py-4 px-4 text-center text-gray-700">
                          {candidate.total_interviews}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">
                            {candidate.avg_score}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            candidate.latest_score >= 80 ? 'bg-green-50 text-green-700' :
                            candidate.latest_score >= 60 ? 'bg-blue-50 text-blue-700' :
                            'bg-yellow-50 text-yellow-700'
                          }`}>
                            {candidate.latest_score}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(candidate.last_interview).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Skill Gap Heatmap</h2>
              <div className="space-y-4">
                {cohortMetrics.map((metric) => (
                  <div key={metric.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{metric.category}</span>
                      <span className="text-sm font-bold text-gray-900">{metric.avg_score}/10</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          metric.avg_score >= 8 ? 'bg-green-500' :
                          metric.avg_score >= 6 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(metric.avg_score / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Benchmarking</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Industry Average</div>
                  <div className="text-2xl font-bold text-gray-900">72</div>
                </div>
                <div className="p-4 bg-teal-50 rounded-lg">
                  <div className="text-sm text-teal-700 mb-1">Your Cohort</div>
                  <div className="text-2xl font-bold text-teal-700">
                    {candidates.length > 0
                      ? Math.round(candidates.reduce((sum, c) => sum + c.avg_score, 0) / candidates.length)
                      : 0}
                  </div>
                </div>
                <div className="text-center pt-4">
                  <span className={`text-lg font-bold ${
                    candidates.length > 0 &&
                    Math.round(candidates.reduce((sum, c) => sum + c.avg_score, 0) / candidates.length) > 72
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}>
                    {candidates.length > 0 &&
                    Math.round(candidates.reduce((sum, c) => sum + c.avg_score, 0) / candidates.length) > 72
                      ? '+' + (Math.round(candidates.reduce((sum, c) => sum + c.avg_score, 0) / candidates.length) - 72)
                      : '---'}
                  </span>
                  <div className="text-sm text-gray-600 mt-1">vs Industry</div>
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {activeTab === 'requests' && (
          <>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <BentoCard>
                <div className="flex items-center justify-between mb-2">
                  <Ticket className="w-8 h-8 text-swiss-accent-teal" />
                  <span className="text-sm text-gray-500">Total</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{requestStats.total}</div>
                <div className="text-sm text-gray-600 mt-1">All Requests</div>
              </BentoCard>

              <BentoCard>
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                  <span className="text-sm text-gray-500">Pending</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{requestStats.pending}</div>
                <div className="text-sm text-gray-600 mt-1">Awaiting Review</div>
              </BentoCard>

              <BentoCard>
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <span className="text-sm text-gray-500">Approved</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{requestStats.approved}</div>
                <div className="text-sm text-gray-600 mt-1">Ready to Schedule</div>
              </BentoCard>

              <BentoCard>
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <span className="text-sm text-gray-500">Rejected</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{requestStats.rejected}</div>
                <div className="text-sm text-gray-600 mt-1">Not Suitable</div>
              </BentoCard>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Interview Requests</h2>
                <button
                  onClick={exportData}
                  className="flex items-center space-x-2 px-4 py-2 bg-swiss-accent-teal text-white rounded-lg hover:bg-swiss-accent-teal-dark transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export</span>
                </button>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, role, or ticket..."
                    className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-swiss-accent-teal focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-swiss-accent-teal focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests found</h3>
                    <p className="text-gray-600">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-xl p-5 hover:border-swiss-accent-teal transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{request.users.name}</h3>
                            <StatusBadge status={request.status} size="sm" />
                            <span className="text-xs text-gray-500 font-mono">{request.ticket_number}</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Role:</span> {request.job_role}
                              {request.company_name && ` at ${request.company_name}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Experience:</span> {request.experience_level}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Preferred:</span>{' '}
                              {new Date(request.preferred_date).toLocaleDateString()} at {request.preferred_time}
                            </p>
                          </div>
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRequestAction(request.id, 'approved')}
                              disabled={actionLoading === request.id}
                              className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRequestAction(request.id, 'rejected')}
                              disabled={actionLoading === request.id}
                              className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center space-x-1"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {request.status === 'approved' && !request.scheduled_date && (
                          <div className="px-4 py-2 bg-swiss-accent-teal-light text-swiss-accent-teal text-sm font-medium rounded-lg flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Ready to Schedule</span>
                          </div>
                        )}

                        {request.scheduled_date && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Scheduled</p>
                            <p className="text-sm font-semibold text-swiss-accent-teal">
                              {new Date(request.scheduled_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-600">{request.scheduled_time}</p>
                          </div>
                        )}
                      </div>

                      <details className="mt-3 pt-3 border-t border-gray-200">
                        <summary className="text-sm text-swiss-accent-teal font-medium cursor-pointer hover:underline">
                          View Job Description
                        </summary>
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.job_description}</p>
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
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <BentoCard>
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-swiss-accent-teal" />
                  <span className="text-sm text-gray-500">Total</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{hrUsers.length}</div>
                <div className="text-sm text-gray-600 mt-1">All HRs</div>
              </BentoCard>

              <BentoCard>
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-amber-500" />
                  <span className="text-sm text-gray-500">Pending</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{hrUsers.filter(h => !h.is_approved).length}</div>
                <div className="text-sm text-gray-600 mt-1">Awaiting Approval</div>
              </BentoCard>

              <BentoCard>
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <span className="text-sm text-gray-500">Approved</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{hrUsers.filter(h => h.is_approved).length}</div>
                <div className="text-sm text-gray-600 mt-1">Active HRs</div>
              </BentoCard>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Pending HR Approvals</h2>
              <div className="space-y-4">
                {hrUsers.filter(h => !h.is_approved).length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending approvals</h3>
                    <p className="text-gray-600">All HR applications have been reviewed</p>
                  </div>
                ) : (
                  hrUsers.filter(h => !h.is_approved).map((hr) => (
                    <div
                      key={hr.id}
                      className="border border-gray-200 rounded-xl p-5 hover:border-swiss-accent-teal transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{hr.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{hr.email}</p>
                          <p className="text-xs text-gray-500">
                            Applied: {new Date(hr.created_at).toLocaleDateString()} at {new Date(hr.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleHRApproval(hr.id, true)}
                            disabled={actionLoading === hr.id}
                            className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleHRApproval(hr.id, false)}
                            disabled={actionLoading === hr.id}
                            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center space-x-1"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Active HRs</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Joined</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hrUsers.filter(h => h.is_approved).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">
                          No active HRs yet
                        </td>
                      </tr>
                    ) : (
                      hrUsers.filter(h => h.is_approved).map((hr) => (
                        <tr key={hr.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900">{hr.name}</div>
                          </td>
                          <td className="py-4 px-4 text-gray-700">
                            {hr.email}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {new Date(hr.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                              Active
                            </span>
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
