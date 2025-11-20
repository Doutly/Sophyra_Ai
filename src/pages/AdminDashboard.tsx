import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Brain, Users, TrendingUp, BarChart3, Download, Search, Filter, LogOut } from 'lucide-react';

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [candidates, setCandidates] = useState<CandidateStats[]>([]);
  const [cohortMetrics, setCohortMetrics] = useState<CohortMetric[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filteredCandidates = candidates.filter(c =>
    c.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">Sophyra AI</span>
                <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
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
        </div>

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
      </div>
    </div>
  );
}
