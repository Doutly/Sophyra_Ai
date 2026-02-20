import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Brain, CheckCircle2, AlertTriangle, BookOpen,
  User, Briefcase, Calendar, Copy, Printer, TrendingUp,
} from 'lucide-react';
import type { HRFeedback, AIReport } from './HRDashboard';

interface TicketData {
  ticket_number: string;
  user_id: string;
  job_role: string;
  company_name: string | null;
  experience_level: string;
  job_description: string;
  preferred_date: string;
  candidate_info: { name: string; email: string } | null;
  users: { name: string; email: string };
  hr_feedback?: HRFeedback;
  ai_report?: AIReport;
  booking_status: string;
}

const HIRE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  'Strong Hire': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  'Hire': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
  'Maybe': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
  'No Hire': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', dot: 'bg-red-500' },
};

const RATING_SCORE: Record<string, number> = {
  'Excellent': 9,
  'Good': 7,
  'Average': 5,
  'Needs Improvement': 3,
};

function RatingBar({ label, rating, index }: { label: string; rating: string; index: number }) {
  const score = RATING_SCORE[rating] ?? 5;
  const pct = (score / 10) * 100;
  const color = score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-blue-500' : score >= 4 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = score >= 8 ? 'text-emerald-700' : score >= 6 ? 'text-blue-700' : score >= 4 ? 'text-amber-700' : 'text-red-700';
  const bgLight = score >= 8 ? 'bg-emerald-50' : score >= 6 ? 'bg-blue-50' : score >= 4 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-200 transition-all"
    >
      <div className={`w-10 h-10 rounded-lg ${bgLight} flex items-center justify-center flex-shrink-0`}>
        <span className={`text-sm font-bold ${textColor}`}>{score}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bgLight} ${textColor}`}>{rating}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, delay: index * 0.08, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function HRReport() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth?mode=signin'); return; }
    if (!ticketId) return;
    loadTicket();
  }, [user, ticketId, navigate]);

  const loadTicket = async () => {
    if (!ticketId) return;
    try {
      const docSnap = await getDoc(doc(db, 'mockInterviewRequests', ticketId));
      if (!docSnap.exists()) { navigate('/hr-dashboard'); return; }
      const data = docSnap.data();
      let userData = { name: 'Unknown', email: 'unknown@example.com' };
      if (data.user_id) {
        try {
          const uSnap = await getDoc(doc(db, 'users', data.user_id));
          if (uSnap.exists()) userData = uSnap.data() as { name: string; email: string };
        } catch { /* ignore */ }
      }
      setTicket({
        ticket_number: data.ticket_number || '',
        user_id: data.user_id || '',
        job_role: data.job_role || '',
        company_name: data.company_name || null,
        experience_level: data.experience_level || '',
        job_description: data.job_description || '',
        preferred_date: data.preferred_date || '',
        candidate_info: data.candidate_info || null,
        users: userData,
        hr_feedback: data.hr_feedback,
        ai_report: data.ai_report,
        booking_status: data.booking_status || '',
      });
    } catch {
      navigate('/hr-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket || !ticket.hr_feedback || !ticket.ai_report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Report Not Available</h2>
          <p className="text-slate-500 text-sm mb-4">This interview does not have an AI report yet.</p>
          <button onClick={() => navigate('/hr-dashboard')} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { hr_feedback: fb, ai_report: report } = ticket;
  const candidateName = ticket.candidate_info?.name || ticket.users.name;
  const candidateEmail = ticket.candidate_info?.email || ticket.users.email;
  const hireStyle = HIRE_COLORS[fb.hire_recommendation] || HIRE_COLORS['Maybe'];
  const overallScore = fb.overall_rating * 20;
  const reportDate = new Date(report.report_generated_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const scoreColor = overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#3b82f6' : overallScore >= 40 ? '#f59e0b' : '#ef4444';
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/hr-dashboard')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 text-white bg-slate-800 hover:bg-slate-900 rounded-lg text-sm font-medium transition-colors">
                <Printer className="w-3.5 h-3.5" />
                Print / PDF
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 print:py-4 print:space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
        >
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400" />
          <div className="p-7 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sophyra AI</p>
                  <p className="text-sm font-semibold text-slate-700">Manual Interview Report</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 font-medium">{reportDate}</p>
                <p className="text-[10px] text-slate-300 font-mono mt-0.5">{ticket.ticket_number}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  {candidateName}
                </h1>
                <p className="text-slate-500 text-sm mb-1">{candidateEmail}</p>
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                    <Briefcase className="w-3.5 h-3.5" />
                    {ticket.job_role}{ticket.company_name ? ` · ${ticket.company_name}` : ''}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                    <User className="w-3.5 h-3.5" />
                    {ticket.experience_level}
                  </div>
                  {ticket.preferred_date && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ticket.preferred_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="relative inline-flex items-center justify-center">
                  <svg width="100" height="100" className="-rotate-90">
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
                    <motion.circle cx="50" cy="50" r={radius} fill="none" stroke={scoreColor} strokeWidth="6"
                      strokeLinecap="round" strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: offset }}
                      transition={{ duration: 1.1, ease: 'easeOut' }} />
                  </svg>
                  <div className="absolute text-center">
                    <motion.div className="text-2xl font-bold text-slate-900 leading-none"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                      {overallScore}
                    </motion.div>
                    <div className="text-[10px] text-slate-400 mt-0.5">/ 100</div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} className={`w-4 h-4 ${n <= fb.overall_rating ? 'text-amber-400' : 'text-slate-200'}`}>
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 font-medium">Overall Score</p>
              </div>
            </div>
          </div>

          <div className={`mx-7 mb-7 p-4 rounded-xl border flex items-center gap-3 ${hireStyle.bg} ${hireStyle.border}`}>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${hireStyle.dot}`} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Hire Recommendation</p>
              <p className={`text-base font-bold ${hireStyle.text}`}>{fb.hire_recommendation}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Executive Summary</h2>
              <p className="text-xs text-slate-400">AI-generated overview of candidate performance</p>
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">{report.executive_summary}</p>
          {report.performance_analysis && (
            <p className="text-slate-600 text-sm leading-relaxed mt-3">{report.performance_analysis}</p>
          )}
        </motion.div>

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
              <h2 className="text-base font-bold text-slate-900">Competency Assessment</h2>
              <p className="text-xs text-slate-400">HR evaluations across key dimensions</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Communication', val: fb.communication },
              { label: 'Technical Knowledge', val: fb.technical_knowledge },
              { label: 'Problem Solving', val: fb.problem_solving },
              { label: 'Cultural Fit', val: fb.cultural_fit },
            ].map(({ label, val }, i) => (
              <RatingBar key={label} label={label} rating={val} index={i} />
            ))}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Key Strengths</h2>
                <p className="text-xs text-slate-400">Identified areas of excellence</p>
              </div>
            </div>
            <ul className="space-y-2.5">
              {report.key_strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{s}</p>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Development Areas</h2>
                <p className="text-xs text-slate-400">Opportunities for improvement</p>
              </div>
            </div>
            <ul className="space-y-2.5">
              {report.development_areas.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{a}</p>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Coaching Suggestions</h2>
              <p className="text-xs text-slate-400">Recommended focus areas for candidate development</p>
            </div>
          </div>
          <div className="space-y-2">
            {report.coaching_suggestions.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
                <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-500 flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-slate-700">{s}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {fb.key_strengths && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm"
          >
            <h2 className="text-base font-bold text-slate-900 mb-3">HR Notes</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Strengths (HR)</p>
                <p className="text-sm text-slate-700 leading-relaxed">{fb.key_strengths}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Improvement Areas (HR)</p>
                <p className="text-sm text-slate-700 leading-relaxed">{fb.areas_for_improvement}</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="h-8 print:hidden" />
      </div>

      <style>{`
        @media print {
          nav, .print\\:hidden { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
