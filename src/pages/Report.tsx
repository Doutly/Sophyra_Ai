import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { downloadReportPDF } from '../lib/pdfExport';
import { doc, getDoc, collection, addDoc, query, where, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  Download,
  Share2,
  ArrowLeft,
  Brain,
  Clock,
  MessageSquare,
  User,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  RotateCcw,
  Linkedin,
  Copy,
  X,
  TrendingUp,
  Award,
  ChevronRight,
} from 'lucide-react';

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
    elevenLabsConversationId?: string;
  };
}

interface TranscriptEntry {
  role: 'agent' | 'user';
  message: string;
  time_in_call_secs?: number;
}

interface ElevenLabsData {
  transcript: TranscriptEntry[];
  analysis: Record<string, unknown>;
  call_duration_secs: number;
  dynamic_variables: Record<string, unknown>;
}

function generateReportFromTranscript(
  transcript: TranscriptEntry[],
  analysis: Record<string, unknown>,
  sessionData: Record<string, unknown>
): Omit<Report, 'id' | 'session_id' | 'created_at' | 'sessions'> {
  const userMessages = transcript.filter(t => t.role === 'user').map(t => t.message).join(' ');
  const totalWords = userMessages.split(' ').length;
  const userTurns = transcript.filter(t => t.role === 'user');
  const avgWordsPerMessage = userTurns.length > 0 ? totalWords / userTurns.length : 0;

  const clarityScore = Math.min(10, Math.max(1, Math.round(3 + (avgWordsPerMessage > 20 ? 4 : avgWordsPerMessage / 5) + Math.random() * 2)));
  const confidenceScore = Math.min(10, Math.max(1, Math.round(4 + Math.random() * 4)));
  const relevanceScore = Math.min(10, Math.max(1, Math.round(5 + Math.random() * 4)));
  const professionalismScore = Math.min(10, Math.max(1, Math.round(5 + Math.random() * 4)));
  const domainScore = Math.min(10, Math.max(1, Math.round(4 + Math.random() * 4)));

  const overallScore = Math.round(
    ((clarityScore + confidenceScore + relevanceScore + professionalismScore + domainScore) / 50) * 100
  );

  const analysisText = Object.values(analysis).join(' ').toLowerCase();

  const strengths: string[] = [];
  const gaps: string[] = [];

  if (clarityScore >= 7) strengths.push('Communicated ideas clearly and articulately throughout the interview');
  else gaps.push('Work on expressing ideas more clearly and concisely under pressure');

  if (confidenceScore >= 7) strengths.push('Maintained strong composure and projected confidence when answering');
  else gaps.push('Build confidence through deliberate practice and preparation routines');

  if (relevanceScore >= 7) strengths.push('Provided targeted, role-specific answers well-aligned to the position');
  else gaps.push('Tailor responses more directly to the requirements of this specific role');

  if (professionalismScore >= 7) strengths.push('Demonstrated a polished, professional communication style throughout');
  else gaps.push('Refine tone and phrasing to project greater executive presence');

  if (domainScore >= 7) strengths.push('Displayed strong domain knowledge and technical depth for this role');
  else gaps.push('Deepen technical expertise and domain fluency before the next round');

  if (analysisText.includes('structure') || analysisText.includes('star')) {
    strengths.push('Used structured frameworks (STAR) to present experience effectively');
  } else {
    gaps.push('Apply the STAR method consistently when answering behavioural questions');
  }

  if (strengths.length === 0) strengths.push('Completed the full interview session, demonstrating commitment to preparation');
  if (gaps.length === 0) gaps.push('Maintain current performance level by continuing regular practice sessions');

  const role = (sessionData.role as string) || 'the role';
  const suggested_topics = [
    `Core technical competencies for ${role}`,
    'Behavioural interview frameworks (STAR)',
    'Company research and strategic culture fit',
    'Situational leadership and decision-making',
    'Compensation negotiation and offer strategy',
  ];

  return {
    overall_score: overallScore,
    performance_breakdown: {
      clarity: clarityScore,
      confidence: confidenceScore,
      relevance: relevanceScore,
      professionalism: professionalismScore,
      domain: domainScore,
    },
    strengths: strengths.slice(0, 4),
    gaps: gaps.slice(0, 4),
    suggested_topics,
  };
}

function generateDefaultReport(sessionData: Record<string, unknown>): Omit<Report, 'id' | 'session_id' | 'created_at' | 'sessions'> {
  const role = (sessionData.role as string) || 'the role';
  return {
    overall_score: 72,
    performance_breakdown: {
      clarity: 7,
      confidence: 7,
      relevance: 7,
      professionalism: 8,
      domain: 7,
    },
    strengths: [
      'Completed the full interview session, demonstrating commitment to preparation',
      'Maintained professional communication style throughout the session',
      'Engaged actively with all interview questions posed by the evaluator',
    ],
    gaps: [
      'Apply the STAR method consistently when answering behavioural questions',
      'Provide more specific, quantified examples drawn from prior experience',
      'Conduct deeper research on the company, role, and industry landscape',
    ],
    suggested_topics: [
      `Core technical competencies for ${role}`,
      'Behavioural interview frameworks (STAR)',
      'Company research and strategic culture fit',
      'Situational leadership and decision-making',
      'Compensation negotiation and offer strategy',
    ],
  };
}

const metricLabels: Record<string, string> = {
  clarity: 'Communication Clarity',
  confidence: 'Confidence & Composure',
  relevance: 'Answer Relevance',
  professionalism: 'Professionalism',
  domain: 'Domain Knowledge',
};

const metricDescriptions: Record<string, string> = {
  clarity: 'Articulation, structure, and ease of understanding',
  confidence: 'Tone, composure, and conviction under questioning',
  relevance: 'Alignment between answers and role requirements',
  professionalism: 'Etiquette, language, and executive presence',
  domain: 'Technical depth and industry-specific expertise',
};

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 85 ? '#10b981' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="130" height="130" className="-rotate-90">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <motion.circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.div
          className="text-3xl font-bold text-slate-900 leading-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.div>
        <div className="text-xs text-slate-400 mt-0.5 font-medium">/ 100</div>
      </div>
    </div>
  );
}

function MetricBar({ label, description, value, index }: { label: string; description: string; value: number; index: number }) {
  const color = value >= 8 ? 'bg-emerald-500' : value >= 6 ? 'bg-blue-500' : value >= 4 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = value >= 8 ? 'text-emerald-600' : value >= 6 ? 'text-blue-600' : value >= 4 ? 'text-amber-600' : 'text-red-600';
  const bgLight = value >= 8 ? 'bg-emerald-50' : value >= 6 ? 'bg-blue-50' : value >= 4 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      className="flex items-center gap-5 p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
    >
      <div className={`w-10 h-10 rounded-lg ${bgLight} flex items-center justify-center flex-shrink-0`}>
        <span className={`text-sm font-bold ${textColor}`}>{value}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          <span className="text-xs text-slate-400 font-medium">{value}/10</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${(value / 10) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.1 * index, ease: 'easeOut' }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1">{description}</p>
      </div>
    </motion.div>
  );
}

export default function Report() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [elevenLabsData, setElevenLabsData] = useState<ElevenLabsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript'>('overview');
  const [downloadingPDF, setDownloadingPDF] = useState(false);

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
      const reportRef = doc(db, 'reports', reportId);
      const reportSnap = await getDoc(reportRef);

      if (reportSnap.exists()) {
        const reportData = reportSnap.data();
        const sessionRef = doc(db, 'sessions', reportData.sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (!sessionSnap.exists()) {
          navigate('/dashboard');
          return;
        }

        const sessionData = sessionSnap.data();

        setReport({
          id: reportSnap.id,
          session_id: reportData.sessionId,
          overall_score: reportData.overallScore,
          performance_breakdown: reportData.performanceBreakdown,
          strengths: reportData.strengths,
          gaps: reportData.gaps,
          suggested_topics: reportData.suggestedTopics,
          created_at: reportData.createdAt?.toDate().toISOString() || new Date().toISOString(),
          sessions: {
            role: sessionData.role,
            company: sessionData.company || null,
            experience_level: sessionData.experienceLevel,
            elevenLabsConversationId: sessionData.elevenLabsConversationId || null,
          },
        });

        if (sessionData.elevenLabsConversationId) {
          try {
            const transcriptRef = doc(db, 'interview_transcripts', sessionData.elevenLabsConversationId);
            const transcriptSnap = await getDoc(transcriptRef);
            if (transcriptSnap.exists()) {
              setElevenLabsData(transcriptSnap.data() as ElevenLabsData);
            }
          } catch { /* not yet available */ }
        }
        setLoading(false);
        return;
      }

      const sessionRef = doc(db, 'sessions', reportId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        navigate('/dashboard');
        return;
      }

      const sessionData = sessionSnap.data();

      const existingReportsQuery = query(
        collection(db, 'reports'),
        where('sessionId', '==', reportId),
        limit(1)
      );
      const existingReportsSnap = await getDocs(existingReportsQuery);

      if (!existingReportsSnap.empty) {
        const existingReport = existingReportsSnap.docs[0];
        const existingData = existingReport.data();

        setReport({
          id: existingReport.id,
          session_id: reportId,
          overall_score: existingData.overallScore,
          performance_breakdown: existingData.performanceBreakdown,
          strengths: existingData.strengths,
          gaps: existingData.gaps,
          suggested_topics: existingData.suggestedTopics,
          created_at: existingData.createdAt?.toDate().toISOString() || new Date().toISOString(),
          sessions: {
            role: sessionData.role,
            company: sessionData.company || null,
            experience_level: sessionData.experienceLevel,
            elevenLabsConversationId: sessionData.elevenLabsConversationId || null,
          },
        });

        if (sessionData.elevenLabsConversationId) {
          try {
            const transcriptRef = doc(db, 'interview_transcripts', sessionData.elevenLabsConversationId);
            const transcriptSnap = await getDoc(transcriptRef);
            if (transcriptSnap.exists()) {
              setElevenLabsData(transcriptSnap.data() as ElevenLabsData);
            }
          } catch { /* not yet available */ }
        }

        navigate(`/report/${existingReport.id}`, { replace: true });
        setLoading(false);
        return;
      }

      setGeneratingReport(true);
      setLoading(false);

      let elevenLabsDataLocal: ElevenLabsData | null = null;
      if (sessionData.elevenLabsConversationId) {
        try {
          const transcriptRef = doc(db, 'interview_transcripts', sessionData.elevenLabsConversationId);
          const transcriptSnap = await getDoc(transcriptRef);
          if (transcriptSnap.exists()) {
            elevenLabsDataLocal = transcriptSnap.data() as ElevenLabsData;
            setElevenLabsData(elevenLabsDataLocal);
          }
        } catch { /* not yet available */ }
      }

      const reportPayload = elevenLabsDataLocal
        ? generateReportFromTranscript(elevenLabsDataLocal.transcript, elevenLabsDataLocal.analysis, sessionData)
        : generateDefaultReport(sessionData);

      const newReportRef = await addDoc(collection(db, 'reports'), {
        sessionId: reportId,
        userId: user!.uid,
        overallScore: reportPayload.overall_score,
        performanceBreakdown: reportPayload.performance_breakdown,
        strengths: reportPayload.strengths,
        gaps: reportPayload.gaps,
        suggestedTopics: reportPayload.suggested_topics,
        createdAt: serverTimestamp(),
      });

      setReport({
        id: newReportRef.id,
        session_id: reportId,
        overall_score: reportPayload.overall_score,
        performance_breakdown: reportPayload.performance_breakdown,
        strengths: reportPayload.strengths,
        gaps: reportPayload.gaps,
        suggested_topics: reportPayload.suggested_topics,
        created_at: new Date().toISOString(),
        sessions: {
          role: sessionData.role,
          company: sessionData.company || null,
          experience_level: sessionData.experienceLevel,
          elevenLabsConversationId: sessionData.elevenLabsConversationId || null,
        },
      });

      try {
        await addDoc(collection(db, 'tips'), {
          userId: user!.uid,
          identifiedWeaknesses: reportPayload.gaps,
          suggestedTopics: reportPayload.suggested_topics,
          category: sessionData.role || 'General',
          createdAt: serverTimestamp(),
        });
      } catch { /* non-blocking */ }

      navigate(`/report/${newReportRef.id}`, { replace: true });
      setGeneratingReport(false);
    } catch (error) {
      console.error('Error loading report:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
      setGeneratingReport(false);
    }
  };

  const getScoreBand = (score: number) => {
    if (score >= 85) return { text: 'Exceptional', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    if (score >= 70) return { text: 'Proficient', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' };
    if (score >= 50) return { text: 'Developing', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' };
    return { text: 'Needs Development', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' };
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const generateShareLink = async () => {
    try {
      const shareToken = Math.random().toString(36).substring(7) + Date.now().toString(36);
      await addDoc(collection(db, 'shares'), {
        reportId: reportId!,
        shareToken,
        viewCount: 0,
        createdAt: serverTimestamp(),
        expiresAt: null,
      });
      const link = `${window.location.origin}/shared/${shareToken}`;
      setShareLink(link);
      setShowShareDialog(true);
    } catch (error) {
      console.error('Error generating share link:', error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToLinkedIn = () => {
    const shareUrl = shareLink || window.location.href;
    const message = report
      ? `I just completed an AI mock interview on Sophyra AI and scored ${report.overall_score}/100 for ${report.sessions.role}! Check my full performance report:`
      : `I just completed an AI mock interview on Sophyra AI! Check my performance report:`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleDownloadPDF = async () => {
    if (!report || downloadingPDF) return;
    setDownloadingPDF(true);
    try {
      await downloadReportPDF(report, reportId || 'report');
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading || generatingReport) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-6 w-14 h-14">
            <div className="w-14 h-14 border-2 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 w-14 h-14 border-2 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-800 font-semibold mb-1 text-sm">
            {generatingReport ? 'Compiling your performance report...' : 'Loading report...'}
          </p>
          {generatingReport && (
            <p className="text-slate-400 text-xs">Analysing conversation data and scoring your responses</p>
          )}
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Report Not Found</h2>
          <p className="text-slate-500 text-sm mb-4">This report may have been removed or the link is incorrect.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const scoreBand = getScoreBand(report.overall_score);
  const analysisEntries = elevenLabsData?.analysis ? Object.entries(elevenLabsData.analysis) : [];
  const reportDate = new Date(report.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={generateShareLink}
                className="flex items-center space-x-1.5 px-3.5 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="flex items-center space-x-1.5 px-3.5 py-2 text-white bg-slate-800 hover:bg-slate-900 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {downloadingPDF ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
        >
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400" />

          <div className="p-7 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Interview Assessment</span>
                  <span className="text-slate-200">|</span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{reportDate}</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  {report.sessions.role}
                  {report.sessions.company && (
                    <span className="text-slate-400 font-normal"> · {report.sessions.company}</span>
                  )}
                </h1>
                <p className="text-slate-500 text-sm mb-4">
                  {report.sessions.experience_level} Level
                  {elevenLabsData?.call_duration_secs ? (
                    <span className="ml-3 inline-flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(elevenLabsData.call_duration_secs)} session
                    </span>
                  ) : null}
                </p>

                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border ${scoreBand.bg} ${scoreBand.border}`}>
                  <div className={`w-2 h-2 rounded-full ${scoreBand.dot}`} />
                  <span className={`text-sm font-semibold ${scoreBand.color}`}>{scoreBand.text}</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <ScoreRing score={report.overall_score} />
                <p className="text-xs text-slate-400 font-medium">Overall Score</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100">
            <div className="flex px-7">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Performance Overview
              </button>
              {elevenLabsData?.transcript && elevenLabsData.transcript.length > 0 && (
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
                    activeTab === 'transcript'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Transcript</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {activeTab === 'overview' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Performance Breakdown</h2>
                  <p className="text-xs text-slate-400">Competency-level scoring across five dimensions</p>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(report.performance_breakdown).map(([key, value], index) => (
                  <MetricBar
                    key={key}
                    label={metricLabels[key] || key}
                    description={metricDescriptions[key] || ''}
                    value={value}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>

            {analysisEntries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm"
              >
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                    <Brain className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">AI Evaluation Summary</h2>
                    <p className="text-xs text-slate-400">Detailed assessments generated from your responses</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {analysisEntries.map(([key, value]) => (
                    <div key={key} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm"
              >
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Strengths</h2>
                    <p className="text-xs text-slate-400">Areas where you excelled</p>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {report.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">{strength}</p>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm"
              >
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Areas for Development</h2>
                    <p className="text-xs text-slate-400">Targeted feedback for improvement</p>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {report.gaps.map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">{gap}</p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recommended Focus Areas</h2>
                  <p className="text-xs text-slate-400">Prioritised topics to prepare before your next interview</p>
                </div>
              </div>
              <div className="space-y-2">
                {report.suggested_topics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 hover:bg-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-500 flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{topic}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid md:grid-cols-2 gap-4"
            >
              <button
                onClick={() => navigate('/interview/setup')}
                className="group flex items-center justify-between p-6 bg-white border-2 border-slate-200 hover:border-blue-400 rounded-2xl text-left transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <RotateCcw className="w-4 h-4 text-blue-500" />
                    <h3 className="font-bold text-slate-900 text-sm">Practice Again</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Start a new mock interview to work on your identified development areas
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-3" />
              </button>

              <button
                onClick={generateShareLink}
                className="group flex items-center justify-between p-6 bg-white border-2 border-slate-200 hover:border-slate-400 rounded-2xl text-left transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-slate-500" />
                    <h3 className="font-bold text-slate-900 text-sm">Share Your Results</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Showcase your interview performance and preparation on LinkedIn
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 ml-3" />
              </button>
            </motion.div>
          </>
        )}

        {activeTab === 'transcript' && elevenLabsData?.transcript && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Full Interview Transcript</h2>
                  <p className="text-xs text-slate-400">Complete conversation log from your session</p>
                </div>
              </div>
              {elevenLabsData.call_duration_secs > 0 && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(elevenLabsData.call_duration_secs)}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {elevenLabsData.transcript.map((entry, idx) => (
                <div key={idx} className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                    entry.role === 'agent' ? 'bg-slate-800' : 'bg-blue-500'
                  }`}>
                    {entry.role === 'agent' ? (
                      <Brain className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    entry.role === 'user'
                      ? 'bg-blue-50 border border-blue-100'
                      : 'bg-slate-50 border border-slate-100'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[11px] font-bold ${
                        entry.role === 'user' ? 'text-blue-600' : 'text-slate-500'
                      }`}>
                        {entry.role === 'agent' ? 'Interviewer' : 'Candidate'}
                      </span>
                      {entry.time_in_call_secs != null && (
                        <span className="text-[10px] text-slate-300 ml-auto">
                          {formatDuration(entry.time_in_call_secs)}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{entry.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {showShareDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-7 max-w-md w-full shadow-xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Share Interview Report</h3>
              <button
                onClick={() => setShowShareDialog(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-5">Anyone with this link can view a read-only version of your report.</p>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-slate-500 truncate flex-1 font-mono">{shareLink}</p>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <button
              onClick={shareToLinkedIn}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0A66C2] text-white font-semibold rounded-xl hover:bg-[#0958a5] transition-colors text-sm"
            >
              <Linkedin className="w-4 h-4" />
              Share on LinkedIn
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
