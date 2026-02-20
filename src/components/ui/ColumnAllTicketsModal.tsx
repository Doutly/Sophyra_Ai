import { useRef } from 'react';
import { X, Briefcase, Calendar, Clock, Download, ExternalLink, FileText } from 'lucide-react';

interface MockInterviewRequest {
  id: string;
  ticket_number: string;
  user_id: string;
  job_role: string;
  company_name: string | null;
  experience_level: string;
  job_description: string;
  additional_notes: string;
  status: string;
  booking_status: string;
  assigned_hr_id: string | null;
  preferred_date: string;
  preferred_time: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  claimed_by: string | null;
  meeting_room_link: string | null;
  candidate_info: {
    name: string;
    email: string;
    bio: string;
    experience_level: string;
    industry: string;
    career_goals: string;
    resume_url: string | null;
  } | null;
  users: { name: string; email: string };
  hr_feedback?: { hire_recommendation?: string };
  ai_report?: unknown;
}

interface ColumnConfig {
  key: string;
  label: string;
  color: string;
  headerBg: string;
  border: string;
  dotColor: string;
  headerText: string;
}

interface ColumnAllTicketsModalProps {
  config: ColumnConfig;
  tickets: MockInterviewRequest[];
  onClose: () => void;
  onSchedule?: (ticket: MockInterviewRequest) => void;
  onMarkDone?: (ticket: MockInterviewRequest) => void;
  onViewReport?: (ticket: MockInterviewRequest) => void;
  onViewProfile?: (ticket: MockInterviewRequest) => void;
}

const EXP_COLORS: Record<string, string> = {
  'Entry Level': 'text-sky-600 bg-sky-50 border-sky-200',
  'Mid Level': 'text-amber-600 bg-amber-50 border-amber-200',
  'Senior Level': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'Executive': 'text-rose-600 bg-rose-50 border-rose-200',
  'fresher': 'text-sky-600 bg-sky-50 border-sky-200',
  'mid': 'text-amber-600 bg-amber-50 border-amber-200',
  'senior': 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

function MiniTicketCard({
  ticket,
  columnKey,
  onSchedule,
  onMarkDone,
  onViewReport,
  onViewProfile,
}: {
  ticket: MockInterviewRequest;
  columnKey: string;
  onSchedule?: (t: MockInterviewRequest) => void;
  onMarkDone?: (t: MockInterviewRequest) => void;
  onViewReport?: (t: MockInterviewRequest) => void;
  onViewProfile?: (t: MockInterviewRequest) => void;
}) {
  const candidateName = ticket.candidate_info?.name || ticket.users.name;
  const expColor = EXP_COLORS[ticket.experience_level] || 'text-gray-500 bg-gray-50 border-gray-200';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-150">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate text-gray-900">{candidateName}</p>
          <p className="text-[10px] mt-0.5 truncate text-gray-400">{ticket.users.email}</p>
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${expColor}`}>
          {ticket.experience_level}
        </span>
      </div>

      <p className="text-[10px] font-mono mb-2 text-gray-400">{ticket.ticket_number}</p>

      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3 h-3 flex-shrink-0 text-gray-400" />
          <span className="text-[11px] truncate text-gray-600">
            {ticket.job_role}{ticket.company_name ? ` · ${ticket.company_name}` : ''}
          </span>
        </div>
        {columnKey === 'scheduled' && ticket.scheduled_date ? (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 flex-shrink-0 text-gray-400" />
            <span className="text-[11px] text-gray-600">
              {new Date(ticket.scheduled_date).toLocaleDateString()} · {ticket.scheduled_time}
            </span>
          </div>
        ) : ticket.preferred_date ? (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 flex-shrink-0 text-gray-400" />
            <span className="text-[11px] text-gray-400">
              Pref: {new Date(ticket.preferred_date).toLocaleDateString()}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {columnKey === 'scheduled' && ticket.meeting_room_link && (
          <a
            href={ticket.meeting_room_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Join Room
          </a>
        )}
        {columnKey === 'scheduled' && onMarkDone && (
          <button
            onClick={() => onMarkDone(ticket)}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            Mark Done
          </button>
        )}
        {columnKey === 'completed' && onMarkDone && (
          <button
            onClick={() => onMarkDone(ticket)}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-colors"
          >
            {ticket.hr_feedback ? 'Edit Feedback' : 'Add Feedback'}
          </button>
        )}
        {columnKey === 'completed' && ticket.ai_report && onViewReport && (
          <button
            onClick={() => onViewReport(ticket)}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            View Report
          </button>
        )}
        {columnKey === 'assigned' && onSchedule && (
          <button
            onClick={() => onSchedule(ticket)}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            Schedule
          </button>
        )}
        {ticket.candidate_info?.resume_url && (
          <a
            href={ticket.candidate_info.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-500 hover:text-blue-400 transition-colors"
          >
            <Download className="w-3 h-3" /> Resume
          </a>
        )}
        {onViewProfile && (
          <button
            onClick={() => onViewProfile(ticket)}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <FileText className="w-3 h-3 inline mr-0.5" />Profile
          </button>
        )}
      </div>
    </div>
  );
}

export default function ColumnAllTicketsModal({
  config,
  tickets,
  onClose,
  onSchedule,
  onMarkDone,
  onViewReport,
  onViewProfile,
}: ColumnAllTicketsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
            <h3 className="text-base font-bold text-gray-900">All {config.label} Tickets</h3>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${config.headerBg} ${config.border} ${config.headerText}`}>
              {tickets.length} total
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-semibold text-gray-500">No tickets in this column</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets.map(ticket => (
                <MiniTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  columnKey={config.key}
                  onSchedule={onSchedule}
                  onMarkDone={onMarkDone}
                  onViewReport={onViewReport}
                  onViewProfile={onViewProfile}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
