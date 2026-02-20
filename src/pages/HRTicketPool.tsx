import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  LogOut, Inbox, Search, Calendar, Clock, Briefcase, Building2,
  QrCode, ClipboardCopy, CheckCircle, Loader2, X, UserCircle,
  ArrowLeft, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import TicketDetailModal from '../components/ui/TicketDetailModal';

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

interface HRProfile {
  displayName: string;
  bio: string;
  hrExperience: string;
  expertise: string;
  linkedinUrl: string;
  avatarUrl: string;
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

const InfoItem = ({
  label,
  value,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
  children?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />}
      <span className="font-semibold text-sm text-slate-800 truncate">{value || '—'}</span>
      {children}
    </div>
  </div>
);

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
  const [copied, setCopied] = useState(false);
  const isLoading = actionLoading === ticket.id;
  const expColor = EXP_COLORS[ticket.experience_level] || 'text-gray-500 bg-gray-50 border-gray-200';

  const initials = (ticket.job_role || 'JR')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(ticket.ticket_number)}&size=120x120&margin=4&color=1e293b&bgcolor=f8fafc`;

  const handleCopy = () => {
    navigator.clipboard.writeText(ticket.ticket_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
    >
      <div className="w-full rounded-2xl shadow-md border border-slate-100 overflow-hidden bg-white">
        <div className="p-5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm flex-shrink-0">
                <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{ticket.job_role}</p>
                {ticket.company_name && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{ticket.company_name}</p>
                )}
                <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold mt-1.5', expColor)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {ticket.experience_level}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <img
                src={qrUrl}
                alt="Ticket QR"
                className="h-16 w-16 rounded-lg border border-slate-200 shadow-sm"
              />
              <p className="text-[9px] text-slate-400 text-center mt-1 font-medium">Ticket ID</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <InfoItem label="Job Role" value={ticket.job_role} icon={Briefcase} />
            <InfoItem label="Company" value={ticket.company_name || 'Not specified'} icon={Building2} />
            <InfoItem label="Preferred Date" value={formatDate(ticket.preferred_date)} icon={Calendar} />
            <InfoItem label="Preferred Time" value={ticket.preferred_time || 'Flexible'} icon={Clock} />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <InfoItem label="Ticket Number" value={ticket.ticket_number} icon={QrCode}>
              <button
                onClick={handleCopy}
                className="ml-auto p-1 rounded-md hover:bg-slate-100 transition-colors flex-shrink-0"
                aria-label="Copy ticket number"
              >
                {copied ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <ClipboardCopy className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>
            </InfoItem>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={() => onClaim(ticket.id)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all shadow-sm shadow-blue-500/20 disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isLoading ? 'Claiming...' : 'Claim Ticket'}
          </button>
          <button
            onClick={() => onViewDetail(ticket)}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function HRTicketPool() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [tickets, setTickets] = useState<MockInterviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [hrProfile, setHrProfile] = useState<HRProfile | null>(null);
  const [profileComplete, setProfileComplete] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [detailTicket, setDetailTicket] = useState<MockInterviewRequest | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth?mode=signin'); return; }

    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          const p: HRProfile = {
            displayName: d.displayName || d.name || '',
            bio: d.bio || '',
            hrExperience: d.hrExperience || '',
            expertise: d.expertise || '',
            linkedinUrl: d.linkedinUrl || '',
            avatarUrl: d.avatarUrl || '',
          };
          setHrProfile(p);
          const complete = !!(p.displayName && p.bio && p.hrExperience && p.expertise && p.linkedinUrl);
          setProfileComplete(complete);
          if (!complete) {
            navigate('/hr-dashboard');
          }
        }
      } catch { /* ignore */ }
    };
    fetchProfile();

    const requestsRef = collection(db, 'mockInterviewRequests');
    const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ticket_number: data.ticket_number || '',
            user_id: data.user_id || '',
            job_role: data.job_role || '',
            company_name: data.company_name || null,
            experience_level: data.experience_level || '',
            job_description: data.job_description || '',
            additional_notes: data.additional_notes || '',
            status: data.status || 'pending',
            booking_status: data.booking_status || 'unclaimed',
            preferred_date: data.preferred_date || '',
            preferred_time: data.preferred_time || '',
            claimed_by: data.claimed_by || null,
          } as MockInterviewRequest;
        })
        .filter(t => !t.claimed_by && t.booking_status === 'unclaimed' && t.status === 'approved');
      setTickets(items);
      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
  }, [user, navigate]);

  const handleClaim = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      await updateDoc(doc(db, 'mockInterviewRequests', ticketId), {
        claimed_by: user!.uid,
        claimed_at: new Date().toISOString(),
        booking_status: 'claimed',
      });
      setDetailTicket(null);
    } finally { setActionLoading(null); }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading ticket pool...</p>
        </div>
      </div>
    );
  }

  if (!profileComplete) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-40 border-b bg-white border-slate-200 shadow-sm">
        <div className="px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-white">
                <img
                  src="/Adobe_Express_-_file.png"
                  alt="Sophyra AI"
                  className="w-8 h-8 rounded-lg"
                  style={{ mixBlendMode: 'darken' }}
                />
              </div>
              <span className="text-sm font-bold text-slate-900">Sophyra AI</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full tracking-widest uppercase">
                HR Portal
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/hr-dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all text-xs font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              <button
                className="flex items-center gap-1.5 px-3 py-1.5 border border-cyan-200 rounded-lg bg-cyan-50 text-cyan-700 text-xs font-medium"
              >
                {hrProfile?.avatarUrl ? (
                  <img src={hrProfile.avatarUrl} alt="Profile" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <UserCircle className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{hrProfile?.displayName || 'Profile'}</span>
              </button>

              <span className="text-xs hidden md:block text-slate-400">{user?.email}</span>
              <button
                onClick={async () => { await signOut(); navigate('/'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all text-xs font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Inbox className="w-5 h-5 text-cyan-600" />
              <h1 className="text-xl font-bold text-slate-900">Ticket Pool</h1>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700">
                {tickets.length} available
              </span>
            </div>
            <p className="text-xs text-slate-400 ml-8">Browse and claim open interview requests from candidates</p>
          </div>
        </div>

        <div className="mb-5 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by role, company, or ticket ID..."
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all bg-slate-50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-400 transition-all bg-slate-50"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  All Dates
                </button>
              )}
            </div>

            {(searchQuery || dateFilter) && (
              <span className="text-xs text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-500">No tickets available</p>
              <p className="text-sm text-slate-400 mt-1 max-w-xs">
                {searchQuery || dateFilter
                  ? 'Try adjusting your filters to find more tickets'
                  : 'Check back soon — new interview requests will appear here once approved'}
              </p>
              {(searchQuery || dateFilter) && (
                <button
                  onClick={() => { setSearchQuery(''); setDateFilter(''); }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-500 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filtered.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <PoolTicketCard
                    ticket={ticket}
                    actionLoading={actionLoading}
                    onClaim={handleClaim}
                    onViewDetail={setDetailTicket}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {detailTicket && (
        <TicketDetailModal
          ticket={detailTicket}
          actionLoading={actionLoading}
          onClaim={handleClaim}
          onClose={() => setDetailTicket(null)}
        />
      )}
    </div>
  );
}
