import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { TrendingUp, AlertCircle, CheckCircle2, Target, ExternalLink, Brain } from 'lucide-react';

interface SharedReportData {
  id: string;
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

export default function SharedReport() {
  const { shareToken } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSharedReport();
  }, [shareToken]);

  const loadSharedReport = async () => {
    if (!shareToken) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    try {
      const shareRef = doc(db, 'shares', shareToken);
      const shareSnap = await getDoc(shareRef);

      if (!shareSnap.exists()) {
        setError('Share link not found');
        setLoading(false);
        return;
      }

      const shareData = shareSnap.data();

      if (shareData.expiresAt && shareData.expiresAt.toDate() < new Date()) {
        setError('This share link has expired');
        setLoading(false);
        return;
      }

      await updateDoc(shareRef, {
        viewCount: increment(1)
      });

      const reportRef = doc(db, 'reports', shareData.reportId);
      const reportSnap = await getDoc(reportRef);

      if (!reportSnap.exists()) {
        setError('Report not found');
        setLoading(false);
        return;
      }

      const reportData = reportSnap.data();

      const sessionRef = doc(db, 'sessions', reportData.sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        setError('Session not found');
        setLoading(false);
        return;
      }

      const sessionData = sessionSnap.data();

      setReport({
        id: reportSnap.id,
        overall_score: reportData.overallScore,
        performance_breakdown: reportData.performanceBreakdown,
        strengths: reportData.strengths,
        gaps: reportData.gaps,
        suggested_topics: reportData.suggestedTopics,
        created_at: reportData.createdAt?.toDate().toISOString() || new Date().toISOString(),
        sessions: {
          role: sessionData.role,
          company: sessionData.company || null,
          experience_level: sessionData.experienceLevel
        }
      });
    } catch (err) {
      console.error('Error loading shared report:', err);
      setError('Failed to load report');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-electric border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Report Not Found'}</h2>
          <p className="text-gray-600 mb-6">
            This report may have been removed or the link is invalid.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-brand-electric text-white font-semibold rounded-lg hover:bg-brand-electric-dark transition-colors"
          >
            Go to Home
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
              <div className="w-10 h-10 bg-brand-electric rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Sophyra AI</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Try Sophyra AI</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-center">
          <p className="text-sm text-gray-800">
            <strong>Shared Report</strong> - This is a public view of an interview performance report
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-br from-brand-electric to-brand-electric-dark p-8 text-white">
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
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-brand-electric" />
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
                        className="h-full bg-brand-electric transition-all"
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
                <Target className="w-6 h-6 mr-2 text-brand-electric" />
                Suggested Topics for Practice
              </h2>
              <div className="flex flex-wrap gap-3">
                {report.suggested_topics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium shadow-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Want to improve your interview skills?
              </h3>
              <p className="text-gray-600 mb-6">
                Practice with Sophyra AI and get personalized feedback to ace your next interview
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-brand-electric text-white font-semibold rounded-lg hover:bg-brand-electric-dark transition-colors"
              >
                Start Your Mock Interview
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by Sophyra AI - AI-powered interview practice platform</p>
        </div>
      </div>
    </div>
  );
}
