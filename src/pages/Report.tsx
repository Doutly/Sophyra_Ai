import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Brain, Download, Share2, TrendingUp, AlertCircle, CheckCircle2, Target, ArrowLeft } from 'lucide-react';

interface Report {
  id: string;
  session_id: string;
  overall_score: number;
  performance_breakdown: {
    clarity: number;
    confidence: number;
    relevance: number;
    professionalism: number;
    domain: number;
  };
  strengths: string[];
  gaps: string[];
  suggested_topics: string[];
  created_at: string;
  sessions: {
    role: string;
    company: string | null;
    experience_level: string;
  };
}

export default function Report() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareLink, setShareLink] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
      return;
    }
    loadReport();
  }, [user, reportId, navigate]);

  const loadReport = async () => {
    if (!reportId) return;

    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          sessions:session_id (
            role,
            company,
            experience_level
          )
        `)
        .eq('id', reportId)
        .maybeSingle();

      if (error || !data) {
        navigate('/dashboard');
        return;
      }

      setReport({
        ...data,
        sessions: Array.isArray(data.sessions) ? data.sessions[0] : data.sessions
      } as any);
    } catch (error) {
      console.error('Error loading report:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getScoreBand = (score: number) => {
    if (score >= 85) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (score >= 70) return { text: 'Strong', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (score >= 50) return { text: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { text: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const generateShareLink = async () => {
    try {
      const shareToken = Math.random().toString(36).substring(7);

      await supabase.from('shares').insert({
        report_id: reportId!,
        share_token: shareToken,
      });

      const link = `${window.location.origin}/shared/${shareToken}`;
      setShareLink(link);
      setShowShareDialog(true);
    } catch (error) {
      console.error('Error generating share link:', error);
    }
  };

  const downloadPDF = () => {
    alert('PDF download will be implemented with a backend service');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink || window.location.href)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const scoreBand = getScoreBand(report.overall_score);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Sophyra AI</span>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-8 text-white">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Interview Performance Report</h1>
                <p className="text-teal-100">
                  {report.sessions.role}
                  {report.sessions.company && ` at ${report.sessions.company}`}
                </p>
                <p className="text-sm text-teal-100 mt-1">
                  {new Date(report.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-6xl font-bold mb-2">{report.overall_score}</div>
                <div className="text-teal-100 text-sm">out of 100</div>
              </div>
            </div>
            <div className={`inline-flex items-center px-4 py-2 ${scoreBand.bg} ${scoreBand.border} border rounded-full`}>
              <span className={`font-semibold ${scoreBand.color}`}>{scoreBand.text}</span>
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-end space-x-3 mb-8">
              <button
                onClick={generateShareLink}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Share</span>
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center space-x-2 px-4 py-2 text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Download PDF</span>
              </button>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-teal-500" />
                Performance Breakdown
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(report.performance_breakdown).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 capitalize">{key}</h3>
                      <span className="text-2xl font-bold text-gray-900">{value}/10</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 transition-all"
                        style={{ width: `${(value / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <CheckCircle2 className="w-6 h-6 mr-2 text-green-500" />
                  Strengths
                </h2>
                <ul className="space-y-3">
                  {report.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed">{strength}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <AlertCircle className="w-6 h-6 mr-2 text-yellow-500" />
                  Areas for Improvement
                </h2>
                <ul className="space-y-3">
                  {report.gaps.map((gap, idx) => (
                    <li key={idx} className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed">{gap}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Target className="w-6 h-6 mr-2 text-teal-500" />
                Suggested Topics for Practice
              </h2>
              <div className="flex flex-wrap gap-3">
                {report.suggested_topics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium shadow-sm hover:shadow-md transition-shadow"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Next Steps</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/interview/setup')}
                  className="p-6 bg-teal-50 border-2 border-teal-200 rounded-xl text-left hover:border-teal-300 hover:shadow-md transition-all group"
                >
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-teal-600">
                    Practice Again
                  </h3>
                  <p className="text-sm text-gray-600">
                    Start a new mock interview to improve your scores
                  </p>
                </button>
                <button
                  onClick={generateShareLink}
                  className="p-6 bg-gray-50 border-2 border-gray-200 rounded-xl text-left hover:border-gray-300 hover:shadow-md transition-all group"
                >
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-gray-700">
                    Share Your Progress
                  </h3>
                  <p className="text-sm text-gray-600">
                    Show your achievements on LinkedIn
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Share Your Report</h3>
            <p className="text-gray-600 mb-6">
              Anyone with this link can view your interview report
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 break-all text-sm text-gray-700">
              {shareLink}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareLink);
                  alert('Link copied to clipboard!');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={shareToLinkedIn}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Share on LinkedIn
              </button>
            </div>
            <button
              onClick={() => setShowShareDialog(false)}
              className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
