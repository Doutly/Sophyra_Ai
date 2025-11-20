import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Brain, Play, FileText, Share2, Download, TrendingUp, Target, Lightbulb, LogOut, User as UserIcon } from 'lucide-react';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [tips, setTips] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
      return;
    }
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();

      if (userData) {
        setUserName(userData.name);
      }

      const { data: reportsData } = await supabase
        .from('reports')
        .select(`
          id,
          session_id,
          overall_score,
          created_at,
          sessions:session_id (
            role,
            company
          )
        `)
        .eq('sessions.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reportsData) {
        setReports(reportsData.map(r => ({
          ...r,
          session: Array.isArray(r.sessions) ? r.sessions[0] : r.sessions
        })) as any);
      }

      const { data: tipsData } = await supabase
        .from('tips')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (tipsData) {
        setTips(tipsData);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return { text: 'Excellent', color: 'bg-green-100 text-green-700 border-green-200' };
    if (score >= 70) return { text: 'Strong', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (score >= 50) return { text: 'Good', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { text: 'Needs Work', color: 'bg-red-100 text-red-700 border-red-200' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
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
              <span className="text-2xl font-bold text-gray-900">Sophyra AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <UserIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userName || 'there'}
          </h1>
          <p className="text-gray-600">Ready to practice and improve your interview skills?</p>
        </div>

        <div className="grid gap-6 mb-8">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Start Mock Test</h2>
                <p className="text-teal-100 mb-6">Practice with AI that adapts to your role and experience</p>
                <button
                  onClick={() => navigate('/interview/setup')}
                  className="px-8 py-3 bg-white text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-colors inline-flex items-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Begin Interview</span>
                </button>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Brain className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Past Interview Reports</h2>
                <FileText className="w-5 h-5 text-gray-400" />
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No interviews yet</h3>
                  <p className="text-gray-600 mb-6">Start your first mock test to see your reports here</p>
                  <button
                    onClick={() => navigate('/interview/setup')}
                    className="px-6 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    Start Mock Test
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => {
                    const badge = getScoreBadge(report.overall_score);
                    return (
                      <div
                        key={report.id}
                        className="border border-gray-200 rounded-xl p-5 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/report/${report.id}`)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{report.session.role}</h3>
                            {report.session.company && (
                              <p className="text-sm text-gray-600">{report.session.company}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900">{report.overall_score}</div>
                            <div className="text-xs text-gray-500">out of 100</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                            {badge.text}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/report/${report.id}`);
                                }}
                                className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {reports.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Progress Overview</h2>
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {reports.length}
                    </div>
                    <div className="text-sm text-gray-600">Interviews</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {Math.round(reports.reduce((acc, r) => acc + r.overall_score, 0) / reports.length)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Score</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-teal-600 mb-1">
                      {reports[0]?.overall_score || 0}
                    </div>
                    <div className="text-sm text-gray-600">Latest</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {Math.max(...reports.map(r => r.overall_score), 0)}
                    </div>
                    <div className="text-sm text-gray-600">Best</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">HR Tips</h2>
                <Lightbulb className="w-5 h-5 text-yellow-500" />
              </div>

              {tips ? (
                <div className="space-y-4">
                  {tips.identified_weaknesses && tips.identified_weaknesses.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Focus Areas</h3>
                      <ul className="space-y-2">
                        {tips.identified_weaknesses.slice(0, 3).map((weakness, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start">
                            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tips.suggested_topics && tips.suggested_topics.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Practice Topics</h3>
                      <div className="flex flex-wrap gap-2">
                        {tips.suggested_topics.slice(0, 5).map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600">Complete your first interview to get personalized tips</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                <Target className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/interview/setup')}
                  className="w-full px-4 py-3 bg-teal-50 text-teal-700 font-medium rounded-lg hover:bg-teal-100 transition-colors text-left"
                >
                  New Mock Interview
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full px-4 py-3 bg-gray-50 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
