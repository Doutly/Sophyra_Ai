import { useRef } from 'react';
import { X, Calendar, Clock, Briefcase, FileText, MessageSquare, Loader2 } from 'lucide-react';

interface MockInterviewRequest {
  id: string;
  ticket_number: string;
  job_role: string;
  company_name: string | null;
  experience_level: string;
  job_description: string;
  additional_notes: string;
  preferred_date: string;
  preferred_time: string;
  claimed_by: string | null;
}

interface TicketDetailModalProps {
  ticket: MockInterviewRequest;
  actionLoading: string | null;
  onClaim: (id: string) => void;
  onClose: () => void;
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

export default function TicketDetailModal({ ticket, actionLoading, onClaim, onClose }: TicketDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const isLoading = actionLoading === ticket.id;
  const expColor = EXP_COLORS[ticket.experience_level] || 'text-gray-500 bg-gray-50 border-gray-200';

  const preferredDate = ticket.preferred_date
    ? new Date(ticket.preferred_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4"
    >
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 pb-4 border-b border-gray-200 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-gray-900">Ticket Details</h3>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${expColor}`}>
              {ticket.experience_level}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-[10px] font-mono text-gray-400 mb-1">{ticket.ticket_number}</p>
            <h4 className="text-lg font-bold text-gray-900">{ticket.job_role}</h4>
            {ticket.company_name && (
              <p className="text-sm text-gray-500 mt-0.5">{ticket.company_name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {preferredDate && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Preferred Date</p>
                </div>
                <p className="text-xs font-semibold text-gray-700">{preferredDate}</p>
              </div>
            )}
            {ticket.preferred_time && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Preferred Time</p>
                </div>
                <p className="text-xs font-semibold text-gray-700">{ticket.preferred_time}</p>
              </div>
            )}
          </div>

          {ticket.job_description && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Job Description</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100">
                {ticket.job_description}
              </p>
            </div>
          )}

          {ticket.additional_notes && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Additional Notes</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100">
                {ticket.additional_notes}
              </p>
            </div>
          )}

          {!ticket.job_description && !ticket.additional_notes && (
            <div className="flex items-center gap-2 py-4 text-gray-400">
              <FileText className="w-4 h-4" />
              <p className="text-sm">No additional details provided.</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 p-5 pt-4 border-t border-gray-200 flex gap-3 bg-white rounded-b-2xl">
          <button
            onClick={() => onClaim(ticket.id)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isLoading ? 'Claiming...' : 'Claim This Ticket'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
