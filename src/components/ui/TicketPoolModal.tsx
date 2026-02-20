import { useState, useRef } from 'react';
import { X, Search, Calendar, Briefcase, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

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
  preferred_date: string;
  preferred_time: string;
  claimed_by: string | null;
}

interface TicketPoolModalProps {
  tickets: MockInterviewRequest[];
  actionLoading: string | null;
  onClaim: (id: string) => void;
  onViewDetail: (ticket: MockInterviewRequest) => void;
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

function PoolTicketCard({
  ticket,
  actionLoading,
  onClaim,
  onViewDetail,
}: {
  ticket: MockInterviewRequest;
  actionLoading: string | null;
  onClaim: (id: string) => void;
  onViewDetail: (ticket: MockInterviewRequest) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const expColor = EXP_COLORS[ticket.experience_level] || 'text-gray-500 bg-gray-50 border-gray-200';
  const isLoading = actionLoading === ticket.id;

  const preferredDate = ticket.preferred_date
    ? new Date(ticket.preferred_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-150 flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{ticket.job_role}</p>
            {ticket.company_name && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{ticket.company_name}</p>
            )}
          </div>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${expColor}`}>
            {ticket.experience_level}
          </span>
        </div>

        <p className="text-[10px] font-mono text-gray-400 mb-3">{ticket.ticket_number}</p>

        <div className="space-y-1.5 mb-3">
          {preferredDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500">{preferredDate}</span>
            </div>
          )}
          {ticket.preferred_time && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500">{ticket.preferred_time}</span>
            </div>
          )}
          {ticket.job_role && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 truncate">{ticket.job_role}</span>
            </div>
          )}
        </div>

        {ticket.job_description && (
          <div>
            <p className={`text-xs text-gray-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {ticket.job_description}
            </p>
            {ticket.job_description.length > 120 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 flex items-center gap-0.5 text-[11px] text-blue-500 hover:text-blue-400 transition-colors font-medium"
              >
                {expanded ? <><ChevronUp className="w-3 h-3" />Less</> : <><ChevronDown className="w-3 h-3" />More</>}
              </button>
            )}
          </div>
        )}

        {expanded && ticket.additional_notes && (
          <div className="mt-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Additional Notes</p>
            <p className="text-xs text-gray-600 leading-relaxed">{ticket.additional_notes}</p>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onClaim(ticket.id)}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {isLoading ? 'Claiming...' : 'Claim'}
        </button>
        <button
          onClick={() => onViewDetail(ticket)}
          className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

export default function TicketPoolModal({
  tickets,
  actionLoading,
  onClaim,
  onViewDetail,
  onClose,
}: TicketPoolModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const filtered = tickets.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (t.job_role || '').toLowerCase().includes(q) ||
      (t.company_name || '').toLowerCase().includes(q) ||
      (t.ticket_number || '').toLowerCase().includes(q);

    const matchesDate = !dateFilter || (t.preferred_date && t.preferred_date.startsWith(dateFilter));

    return matchesSearch && matchesDate;
  });

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-gray-900">Ticket Pool</h3>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700">
              {tickets.length} available
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by role, company, or ticket ID..."
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all bg-gray-50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-blue-400 transition-all bg-gray-50"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                All Dates
              </button>
            )}
          </div>

          {(searchQuery || dateFilter) && (
            <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500">No tickets found</p>
              <p className="text-xs text-gray-400 mt-1">
                {searchQuery || dateFilter ? 'Try adjusting your filters' : 'No unclaimed tickets available right now'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(ticket => (
                <PoolTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  actionLoading={actionLoading}
                  onClaim={onClaim}
                  onViewDetail={onViewDetail}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
