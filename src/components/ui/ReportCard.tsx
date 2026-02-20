import { motion } from 'framer-motion';
import { Star, ChevronRight, Calendar, Building2, TrendingUp } from 'lucide-react';

interface ReportCardProps {
  id: string;
  overallScore: number;
  role: string;
  company: string | null;
  createdAt: string;
  experienceLevel?: string;
  onClick: () => void;
  index?: number;
}

function ScoreRingSmall({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="68" height="68" className="-rotate-90">
        <circle cx="34" cy="34" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <motion.circle
          cx="34"
          cy="34"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.0, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-base font-bold text-slate-900 leading-none">{score}</div>
        <div className="text-[9px] text-slate-400 font-medium">/100</div>
      </div>
    </div>
  );
}

function StarRating({ score }: { score: number }) {
  const stars = Math.round((score / 100) * 5);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3 h-3 ${s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
        />
      ))}
    </div>
  );
}

export function getScoreLabel(score: number) {
  if (score >= 85) return { label: 'Excellent', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' };
  if (score >= 70) return { label: 'Strong', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' };
  if (score >= 50) return { label: 'Good', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' };
  return { label: 'Needs Work', color: 'text-red-700', bg: 'bg-red-50 border-red-100' };
}

export default function ReportCard({ overallScore, role, company, createdAt, experienceLevel, onClick, index = 0 }: ReportCardProps) {
  const scoreInfo = getScoreLabel(overallScore);
  const date = new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 cursor-pointer transition-all duration-200 overflow-hidden"
    >
      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400" />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate leading-tight">{role}</p>
            {company && (
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <p className="text-xs text-slate-500 truncate">{company}</p>
              </div>
            )}
          </div>
          <ScoreRingSmall score={overallScore} />
        </div>

        <div className="flex items-center justify-between mb-3">
          <StarRating score={overallScore} />
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${scoreInfo.bg} ${scoreInfo.color}`}>
            {scoreInfo.label}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] text-slate-400">{date}</span>
            </div>
            {experienceLevel && (
              <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100 font-medium">
                {experienceLevel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 text-slate-300 group-hover:text-slate-500 transition-colors">
            <span className="text-[11px] font-medium">View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 opacity-5 pointer-events-none select-none">
        <div className="flex items-center gap-1">
          <img src="/Adobe_Express_-_file.png" alt="" className="w-6 h-6" />
        </div>
      </div>

      <div className="absolute inset-0 rounded-2xl ring-2 ring-blue-500/0 group-hover:ring-blue-500/10 transition-all duration-200 pointer-events-none" />
    </motion.div>
  );
}

export function ReportCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-1 bg-slate-100" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
          <div className="w-[68px] h-[68px] rounded-full bg-slate-100" />
        </div>
        <div className="flex gap-1 mb-3">
          {[1,2,3,4,5].map(i => <div key={i} className="w-3 h-3 rounded bg-slate-100" />)}
        </div>
        <div className="h-px bg-slate-50 mb-2.5" />
        <div className="flex justify-between">
          <div className="h-3 bg-slate-100 rounded w-24" />
          <div className="h-3 bg-slate-100 rounded w-10" />
        </div>
      </div>
    </div>
  );
}

interface AllReportsModalProps {
  reports: Array<{
    id: string;
    overall_score: number;
    created_at: string;
    session: { role: string; company: string | null };
  }>;
  onClose: () => void;
  onSelectReport: (id: string) => void;
}

export function AllReportsModal({ reports, onClose, onSelectReport }: AllReportsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <img src="/Adobe_Express_-_file.png" alt="Sophyra" className="w-6 h-6 rounded-md" style={{ mixBlendMode: 'darken' }} />
              <h2 className="text-base font-bold text-slate-900">All Interview Reports</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{reports.length} total sessions</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <span className="text-slate-500 text-lg leading-none">&times;</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {reports.length === 0 ? (
            <div className="text-center py-16">
              <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold text-sm">No reports yet</p>
              <p className="text-slate-400 text-xs mt-1">Complete your first interview to see reports here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report, i) => (
                <ReportCard
                  key={report.id}
                  id={report.id}
                  overallScore={report.overall_score}
                  role={report.session.role}
                  company={report.session.company}
                  createdAt={report.created_at}
                  onClick={() => onSelectReport(report.id)}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
