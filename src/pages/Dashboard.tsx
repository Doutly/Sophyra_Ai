import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit as firestoreLimit, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Play, FileText, Share2, Download, TrendingUp, Target, Lightbulb, LogOut, User as UserIcon, Ticket, Calendar, Clock, AlertCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [tips, setTips] = useState<Tip | null>(null);
  const [mockRequests, setMockRequests] = useState<MockInterviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
      return;
    }

    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Loading took too long. Please try refreshing the page.');
      }
    }, 10000);

    loadDashboardData().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, [user, navigate]);

  const loadDashboardData = async () => {
    if (!user) return;

    setError(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setUserName(snapshot.data().name || '');
          }
        },
        (error) => {
          console.error('Error in user snapshot:', error);
          setError('Failed to load user data. Please refresh the page.');
        }
      );

      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', user.uid)
      );

      const unsubscribeSessions = onSnapshot(
        sessionsQuery,
        async (sessionsSnapshot) => {
          try {
            const sessionIds = sessionsSnapshot.docs.map(d => d.id);

            if (sessionIds.length > 0) {
              const reportsQuery = query(
                collection(db, 'reports'),
                where('sessionId', 'in', sessionIds.slice(0, 10)),
                orderBy('createdAt', 'desc'),
                firestoreLimit(10)
              );

              onSnapshot(
                reportsQuery,
                async (reportsSnapshot) => {
                  try {
                    const reportsWithSessions = await Promise.all(
                      reportsSnapshot.docs.map(async (reportDoc) => {
                        const reportData = reportDoc.data();
                        const sessionRef = doc(db, 'sessions', reportData.sessionId);
                        const sessionSnap = await getDoc(sessionRef);
                        const sessionData = sessionSnap.exists() ? sessionSnap.data() : null;

                        return {
                          id: reportDoc.id,
                          session_id: reportData.sessionId,
                          overall_score: reportData.overallScore || 0,
                          created_at: reportData.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
                          session: {
                            role: sessionData?.role || '',
                            company: sessionData?.company || null
                          }
                        };
                      })
                    );

                    setReports(reportsWithSessions);
                  } catch (error) {
                    console.error('Error processing reports:', error);
                  }
                },
                (error) => {
                  console.error('Error in reports snapshot:', error);
                }
              );
            } else {
              setReports([]);
            }
          } catch (error) {
            console.error('Error processing sessions:', error);
          }
        },
        (error) => {
          console.error('Error in sessions snapshot:', error);
          setError('Failed to load interview sessions. Please refresh the page.');
        }
      );

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
              suggested_topics: tipData.suggestedTopics || []
            });
          } else {
            setTips(null);
          }
        },
        (error) => {
          console.error('Error in tips snapshot:', error);
        }
      );

      const requestsQuery = query(
        collection(db, 'mockInterviewRequests'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
        firestoreLimit(5)
      );

      const unsubscribeRequests = onSnapshot(
        requestsQuery,
        (requestsSnapshot) => {
          const requestsData = requestsSnapshot.docs.map(d => {
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
              created_at: data.created_at || new Date().toISOString()
            };
          });

          setMockRequests(requestsData);
        },
        (error) => {
          console.error('Error in requests snapshot:', error);
        }
      );

      setLoading(false);

      return () => {
        unsubscribeUser();
        unsubscribeSessions();
        unsubscribeTips();
        unsubscribeRequests();
      };
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
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
          <div className="w-16 h-16 border-4 border-brand-electric border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                loadDashboardData();
              }}
              className="w-full px-6 py-3 bg-brand-electric text-white font-semibold rounded-lg hover:bg-brand-electric-dark transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          </div>
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

        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="hidden lg:block lg:col-span-1"></div>

          <div className="col-span-12 lg:col-span-7 space-y-6">
            <div className="bg-gradient-to-br from-brand-electric to-brand-electric-dark rounded-2xl p-8 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Start Mock Test</h2>
                  <p className="text-white/90 text-lg mb-6">Practice with AI that adapts to your role and experience</p>
                  <button
                    onClick={() => navigate('/interview/setup')}
                    className="px-10 py-4 bg-white text-brand-electric font-bold rounded-lg hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center space-x-2"
                  >
                    <Play className="w-6 h-6" />
                    <span>Begin Interview</span>
                  </button>
                </div>
                <div className="hidden xl:block">
                  <div className="w-40 h-40 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <img src="/lo.png" alt="Sophyra AI" className="w-32 h-32 opacity-90" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
                <Target className="w-6 h-6 text-gray-400" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/interview/setup')}
                  className="p-6 bg-brand-electric/5 text-brand-electric font-semibold rounded-xl hover:bg-brand-electric/10 transition-all border-2 border-brand-electric/20 hover:border-brand-electric/40 text-left group"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Play className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-xl">AI Mock Interview</span>
                  </div>
                  <p className="text-sm text-gray-600">Practice with adaptive AI interviewer</p>
                </button>
                <button
                  onClick={() => navigate('/interview/manual')}
                  className="p-6 bg-blue-50 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition-all border-2 border-blue-100 hover:border-blue-200 text-left group"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Ticket className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-xl">Request Manual Interview</span>
                  </div>
                  <p className="text-sm text-blue-600">Get interviewed by HR professional</p>
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Past Reports</h2>
                <FileText className="w-5 h-5 text-gray-400" />
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-4">No reports yet</p>
                  <button
                    onClick={() => navigate('/interview/setup')}
                    className="px-4 py-2 bg-brand-electric text-white text-sm font-medium rounded-lg hover:bg-brand-electric-dark transition-colors"
                  >
                    Start Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reports.slice(0, 4).map((report) => {
                    const badge = getScoreBadge(report.overall_score);
                    return (
                      <div
                        key={report.id}
                        className="border border-gray-200 rounded-lg p-3 hover:border-brand-electric/50 hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => navigate(`/report/${report.id}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <h3 className="font-medium text-gray-900 text-sm truncate">{report.session.role}</h3>
                            {report.session.company && (
                              <p className="text-xs text-gray-500 truncate">{report.session.company}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">{report.overall_score}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                            {badge.text}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {reports.length > 4 && (
                    <button className="w-full text-center text-sm text-brand-electric font-medium hover:underline py-2">
                      View All Reports →
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">My Requests</h2>
                <Ticket className="w-5 h-5 text-brand-electric" />
              </div>

              {mockRequests.length === 0 ? (
                <div className="text-center py-6">
                  <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 mb-3">No requests yet</p>
                  <button
                    onClick={() => navigate('/interview/manual')}
                    className="px-3 py-1.5 bg-brand-electric text-white text-xs font-medium rounded-lg hover:bg-brand-electric-dark transition-colors"
                  >
                    Request Interview
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {mockRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-brand-electric hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate flex-1 pr-2">{request.job_role}</p>
                        <StatusBadge status={request.status} size="sm" />
                      </div>

                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{new Date(request.preferred_date).toLocaleDateString()}</span>
                      </div>

                      {request.status === 'approved' && request.scheduled_date && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-green-600 font-medium flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(request.scheduled_date).toLocaleDateString()} at {request.scheduled_time}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {mockRequests.length > 3 && (
                    <button className="w-full text-center text-sm text-brand-electric font-medium hover:underline py-1">
                      View All →
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">HR Tips</h2>
                <Lightbulb className="w-5 h-5 text-yellow-500" />
              </div>

              <div className="space-y-3">
                {!tips && (
                  <div className="mb-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    General tips - Complete an interview for personalized recommendations
                  </div>
                )}
                {(tips?.identified_weaknesses || DEFAULT_TIPS.identified_weaknesses).length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 mb-1.5">Focus Areas</h3>
                    <ul className="space-y-1.5">
                      {(tips?.identified_weaknesses || DEFAULT_TIPS.identified_weaknesses).slice(0, 3).map((weakness, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start">
                          <span className="w-1 h-1 bg-brand-electric rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(tips?.suggested_topics || DEFAULT_TIPS.suggested_topics).length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 mb-1.5">Preparation Topics</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(tips?.suggested_topics || DEFAULT_TIPS.suggested_topics).slice(0, 4).map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-brand-electric/10 text-brand-electric text-xs font-medium rounded-full"
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
      </div>
    </div>
  );
}
