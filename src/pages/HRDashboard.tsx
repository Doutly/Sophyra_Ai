import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { LogOut, Ticket, Clock, Calendar, CheckCircle, ExternalLink, User, Briefcase, Download, Brain, ChevronDown, ChevronUp, X, Sun, Moon } from 'lucide-react';

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
  claimed_at: string | null;
  meeting_room_link: string | null;
  created_at: string;
  candidate_info: {
    name: string;
    email: string;
    bio: string;
    experience_level: string;
    industry: string;
    career_goals: string;
    resume_url: string | null;
  } | null;
  users: {
    name: string;
    email: string;
  };
}

type TabKey = 'assigned' | 'pool' | 'claimed' | 'booked' | 'completed';

export default function HRDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [assignedToMe, setAssignedToMe] = useState<MockInterviewRequest[]>([]);
  const [unclaimedTickets, setUnclaimedTickets] = useState<MockInterviewRequest[]>([]);
  const [myClaimedTickets, setMyClaimedTickets] = useState<MockInterviewRequest[]>([]);
  const [bookedInterviews, setBookedInterviews] = useState<MockInterviewRequest[]>([]);
  const [completedInterviews, setCompletedInterviews] = useState<MockInterviewRequest[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('assigned');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MockInterviewRequest | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingLinkError, setMeetingLinkError] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
      return;
    }
    loadTickets();
  }, [user, navigate]);

  const loadTickets = async () => {
    try {
      const requestsRef = collection(db, 'mockInterviewRequests');
      const unsubscribe = onSnapshot(requestsRef, async (snapshot) => {
        const allRequests = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            let userData = { name: 'Unknown', email: 'unknown@example.com' };
            if (data.user_id && typeof data.user_id === 'string') {
              try {
                const userDocRef = doc(db, 'users', data.user_id);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                  userData = userDocSnap.data() as { name: string; email: string };
                }
              } catch (error) {
                console.error('Error fetching user data:', error);
              }
            }
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
              assigned_hr_id: data.assigned_hr_id || null,
              preferred_date: data.preferred_date || '',
              preferred_time: data.preferred_time || '',
              scheduled_date: data.scheduled_date || null,
              scheduled_time: data.scheduled_time || null,
              claimed_by: data.claimed_by || null,
              claimed_at: data.claimed_at || null,
              meeting_room_link: data.meeting_room_link || null,
              created_at: data.created_at || '',
              candidate_info: data.candidate_info || null,
              users: userData,
            };
          })
        );

        setAssignedToMe(allRequests.filter(r =>
          r.assigned_hr_id === user?.uid && r.status === 'approved' &&
          (r.booking_status === 'unclaimed' || r.claimed_by === user?.uid)
        ));
        setUnclaimedTickets(allRequests.filter(r =>
          !r.assigned_hr_id && r.booking_status === 'unclaimed' && r.status === 'approved'
        ));
        setMyClaimedTickets(allRequests.filter(r =>
          r.booking_status === 'claimed' && r.claimed_by === user?.uid
        ));
        setBookedInterviews(allRequests.filter(r =>
          r.booking_status === 'booked' && r.claimed_by === user?.uid
        ));
        setCompletedInterviews(allRequests.filter(r =>
          r.booking_status === 'completed' && r.claimed_by === user?.uid
        ));
        setLoading(false);
      }, (error) => {
        console.error('Error in tickets snapshot:', error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading tickets:', error);
      setLoading(false);
    }
  };

  const handleClaimTicket = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      await updateDoc(doc(db, 'mockInterviewRequests', ticketId), {
        claimed_by: user!.uid,
        claimed_at: new Date().toISOString(),
        booking_status: 'claimed',
      });
    } catch (error) {
      console.error('Error claiming ticket:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReleaseTicket = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      await updateDoc(doc(db, 'mockInterviewRequests', ticketId), {
        claimed_by: null,
        claimed_at: null,
        booking_status: 'unclaimed',
      });
    } catch (error) {
      console.error('Error releasing ticket:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBookInterview = (ticket: MockInterviewRequest) => {
    setSelectedTicket(ticket);
    setBookingDate(ticket.preferred_date.split('T')[0]);
    setBookingTime(ticket.preferred_time);
    setMeetingLink('');
    setMeetingLinkError(false);
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedTicket || !bookingDate || !bookingTime) return;
    if (!meetingLink.trim()) {
      setMeetingLinkError(true);
      return;
    }
    setMeetingLinkError(false);
    setActionLoading(selectedTicket.id);
    try {
      await updateDoc(doc(db, 'mockInterviewRequests', selectedTicket.id), {
        scheduled_date: bookingDate,
        scheduled_time: bookingTime,
        meeting_room_link: meetingLink.trim(),
        booking_status: 'booked',
      });
      setShowBookingModal(false);
      setSelectedTicket(null);
      setMeetingLink('');
    } catch (error) {
      console.error('Error booking interview:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkCompleted = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      await updateDoc(doc(db, 'mockInterviewRequests', ticketId), {
        booking_status: 'completed',
        status: 'completed',
      });
    } catch (error) {
      console.error('Error marking as completed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleExpand = (id: string) => {
    setExpandedTickets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const stats = {
    assigned: assignedToMe.length,
    available: unclaimedTickets.length,
    claimed: myClaimedTickets.length,
    booked: bookedInterviews.length,
    completed: completedInterviews.length,
  };

  const tabs: { key: TabKey; label: string; icon: typeof Ticket; count: number }[] = [
    { key: 'assigned', label: 'Assigned to Me', icon: User, count: stats.assigned },
    { key: 'pool', label: 'Available Pool', icon: Ticket, count: stats.available },
    { key: 'claimed', label: 'My Claimed', icon: Clock, count: stats.claimed },
    { key: 'booked', label: 'Scheduled', icon: Calendar, count: stats.booked },
    { key: 'completed', label: 'Completed', icon: CheckCircle, count: stats.completed },
  ];

  const statCards = [
    { label: 'Assigned', value: stats.assigned, icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Available', value: stats.available, icon: Ticket, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Claimed', value: stats.claimed, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Scheduled', value: stats.booked, icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-white/50', bg: 'bg-white/5' },
  ];

  const th = {
    bg: darkMode ? 'bg-[#030712]' : 'bg-gray-50',
    nav: darkMode ? 'bg-white/[0.02] border-white/5 backdrop-blur-xl' : 'bg-white border-gray-200',
    navText: darkMode ? 'text-white' : 'text-gray-900',
    card: darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200',
    cardText: darkMode ? 'text-white' : 'text-gray-900',
    cardSub: darkMode ? 'text-white/35' : 'text-gray-500',
    cardFaint: darkMode ? 'text-white/25' : 'text-gray-400',
    border: darkMode ? 'border-white/5' : 'border-gray-100',
    tab: (active: boolean) => active
      ? darkMode ? 'text-white border-blue-500' : 'text-blue-600 border-blue-600'
      : darkMode ? 'text-white/35 border-transparent hover:text-white/60' : 'text-gray-500 border-transparent hover:text-gray-700',
    tabBadge: (active: boolean) => active
      ? 'bg-blue-500/20 text-blue-400'
      : darkMode ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-400',
    toggleBg: darkMode ? 'bg-white/[0.04] border-white/8 text-white/50 hover:text-white/80' : 'bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-800',
    statCard: darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200',
    ticketCard: darkMode ? 'bg-white/[0.02] border-white/5 hover:border-white/10' : 'bg-white border-gray-200 hover:border-gray-300',
    badge: (type: string) => type === 'assigned' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      : type === 'booked' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : darkMode ? 'text-white/40 bg-white/5 border-white/10' : 'text-gray-500 bg-gray-100 border-gray-200',
    expandContent: darkMode ? 'bg-white/[0.03] border-white/5' : 'bg-gray-50 border-gray-200',
    modalBg: darkMode ? 'bg-[#0d1117] border-white/10' : 'bg-white border-gray-200',
    modalInput: darkMode ? 'bg-white/[0.04] border-white/8 text-white/80' : 'bg-gray-50 border-gray-200 text-gray-900',
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${th.bg} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${th.cardSub}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const currentTickets = {
    assigned: assignedToMe,
    pool: unclaimedTickets,
    claimed: myClaimedTickets,
    booked: bookedInterviews,
    completed: completedInterviews,
  }[activeTab];

  const renderTicketCard = (ticket: MockInterviewRequest) => {
    const isExpanded = expandedTickets.has(ticket.id);
    const candidateName = ticket.candidate_info?.name || ticket.users.name;
    const candidateEmail = ticket.candidate_info?.email || ticket.users.email;

    return (
      <div key={ticket.id} className={`border rounded-xl overflow-hidden transition-all duration-200 ${th.ticketCard}`}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {activeTab === 'assigned' && (
                  <span className="inline-flex items-center text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full tracking-wide uppercase">
                    Admin Assigned
                  </span>
                )}
                {activeTab === 'booked' && (
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full tracking-wide uppercase">
                    Scheduled
                  </span>
                )}
                {activeTab === 'completed' && (
                  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase border ${th.badge('completed')}`}>
                    Completed
                  </span>
                )}
                <span className={`text-[10px] font-mono ${th.cardFaint}`}>{ticket.ticket_number}</span>
              </div>
              <p className={`font-semibold text-sm leading-tight ${th.cardText}`}>{candidateName}</p>
              <p className={`text-xs mt-0.5 ${th.cardSub}`}>{candidateEmail}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {activeTab === 'assigned' && ticket.booking_status === 'unclaimed' && (
                <button
                  onClick={() => handleClaimTicket(ticket.id)}
                  disabled={actionLoading === ticket.id}
                  className="px-3 py-1.5 bg-blue-500/15 text-blue-400 border border-blue-500/25 text-xs font-semibold rounded-lg hover:bg-blue-500/25 transition-colors disabled:opacity-40"
                >
                  {actionLoading === ticket.id ? 'Claiming...' : 'Claim'}
                </button>
              )}
              {activeTab === 'pool' && (
                <button
                  onClick={() => handleClaimTicket(ticket.id)}
                  disabled={actionLoading === ticket.id}
                  className="px-3 py-1.5 bg-blue-500/15 text-blue-400 border border-blue-500/25 text-xs font-semibold rounded-lg hover:bg-blue-500/25 transition-colors disabled:opacity-40"
                >
                  {actionLoading === ticket.id ? 'Claiming...' : 'Claim Ticket'}
                </button>
              )}
              {activeTab === 'claimed' && (
                <>
                  <button
                    onClick={() => handleBookInterview(ticket)}
                    className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-semibold rounded-lg hover:bg-emerald-500/25 transition-colors"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => handleReleaseTicket(ticket.id)}
                    disabled={actionLoading === ticket.id}
                    className="px-3 py-1.5 bg-white/[0.03] text-white/40 border border-white/8 text-xs font-semibold rounded-lg hover:bg-white/[0.06] transition-colors disabled:opacity-40"
                  >
                    Release
                  </button>
                </>
              )}
              {activeTab === 'booked' && (
                <button
                  onClick={() => handleMarkCompleted(ticket.id)}
                  disabled={actionLoading === ticket.id}
                  className="px-3 py-1.5 bg-blue-500/15 text-blue-400 border border-blue-500/25 text-xs font-semibold rounded-lg hover:bg-blue-500/25 transition-colors disabled:opacity-40"
                >
                  {actionLoading === ticket.id ? 'Saving...' : 'Mark Done'}
                </button>
              )}
              <button
                onClick={() => toggleExpand(ticket.id)}
                className={`p-1.5 transition-colors ${darkMode ? 'text-white/25 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5">
              <Briefcase className={`w-3.5 h-3.5 flex-shrink-0 ${th.cardFaint}`} />
              <span className={`text-xs truncate ${th.cardSub}`}>
                {ticket.job_role}{ticket.company_name ? ` · ${ticket.company_name}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className={`w-3.5 h-3.5 flex-shrink-0 ${th.cardFaint}`} />
              <span className={`text-xs ${th.cardSub}`}>
                {activeTab === 'booked' && ticket.scheduled_date
                  ? `${new Date(ticket.scheduled_date).toLocaleDateString()} · ${ticket.scheduled_time}`
                  : ticket.preferred_date
                    ? `Pref: ${new Date(ticket.preferred_date).toLocaleDateString()} · ${ticket.preferred_time}`
                    : '—'}
              </span>
            </div>
          </div>

          {activeTab === 'booked' && (
            <div className={`mt-4 pt-4 border-t ${th.border}`}>
              {ticket.meeting_room_link ? (
                <a
                  href={ticket.meeting_room_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-semibold rounded-lg hover:bg-emerald-500/25 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Join Interview Room
                </a>
              ) : (
                <span className={`inline-flex items-center gap-2 text-xs font-medium ${th.cardFaint}`}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  No meeting link set
                </span>
              )}
            </div>
          )}

          {activeTab === 'claimed' && ticket.claimed_at && (
            <p className={`mt-2 text-[11px] ${th.cardFaint}`}>
              Claimed {new Date(ticket.claimed_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {isExpanded && ticket.candidate_info && (
          <div className={`px-5 pb-5 border-t pt-4 space-y-3 ${th.border}`}>
            {ticket.candidate_info.bio && (
              <p className={`text-xs leading-relaxed ${th.cardSub}`}>{ticket.candidate_info.bio}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {ticket.candidate_info.industry && (
                <div>
                  <p className={`text-[10px] uppercase tracking-wide mb-0.5 ${th.cardFaint}`}>Industry</p>
                  <p className={`text-xs ${th.cardSub}`}>{ticket.candidate_info.industry}</p>
                </div>
              )}
              <div>
                <p className={`text-[10px] uppercase tracking-wide mb-0.5 ${th.cardFaint}`}>Experience</p>
                <p className={`text-xs ${th.cardSub}`}>{ticket.experience_level}</p>
              </div>
            </div>
            {ticket.candidate_info.career_goals && (
              <div>
                <p className={`text-[10px] uppercase tracking-wide mb-0.5 ${th.cardFaint}`}>Career Goals</p>
                <p className={`text-xs leading-relaxed ${th.cardSub}`}>{ticket.candidate_info.career_goals}</p>
              </div>
            )}
            {ticket.job_description && (
              <div>
                <p className={`text-[10px] uppercase tracking-wide mb-0.5 ${th.cardFaint}`}>Job Description</p>
                <p className={`text-xs leading-relaxed line-clamp-4 ${th.cardSub}`}>{ticket.job_description}</p>
              </div>
            )}
            {ticket.candidate_info.resume_url && (
              <a
                href={ticket.candidate_info.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Download Resume
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${th.bg} transition-colors duration-300`}>
      <nav className={`sticky top-0 z-40 border-b ${th.nav}`}>
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
              </div>
              <span className={`text-sm font-bold tracking-tight ${th.navText}`}>Sophyra AI</span>
              <span className="inline-flex items-center text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full tracking-widest uppercase">
                HR Portal
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs hidden sm:block ${th.cardFaint}`}>
                {user?.email}
              </span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg transition-all text-xs font-medium ${th.toggleBg}`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
              </button>
              <button
                onClick={handleSignOut}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg transition-all text-xs font-medium ${th.toggleBg}`}
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className={`text-2xl font-bold mb-1 ${th.cardText}`}>Interview Ticket Board</h1>
          <p className={`text-sm ${th.cardSub}`}>Claim and manage mock interview sessions</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`border rounded-xl p-4 ${th.statCard}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${th.cardText}`}>{s.value}</p>
                <p className={`text-xs mt-0.5 ${th.cardFaint}`}>{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className={`flex gap-0 border-b mb-6 overflow-x-auto ${th.border}`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 -mb-px ${th.tab(isActive)}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${th.tabBadge(isActive)}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div>
          {currentTickets.length === 0 ? (
            <div className="text-center py-20">
              <div className={`w-12 h-12 border rounded-xl flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-white/[0.03] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                {(() => {
                  const tab = tabs.find(t => t.key === activeTab);
                  if (!tab) return null;
                  const Icon = tab.icon;
                  return <Icon className={`w-5 h-5 ${th.cardFaint}`} />;
                })()}
              </div>
              <p className={`text-sm font-medium ${th.cardFaint}`}>No {tabs.find(t => t.key === activeTab)?.label.toLowerCase()} tickets</p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-white/15' : 'text-gray-400'}`}>
                {activeTab === 'assigned' && 'Admin has not assigned any tickets to you yet'}
                {activeTab === 'pool' && 'No unassigned tickets available right now'}
                {activeTab === 'claimed' && 'Claim tickets from the pool or assigned tab'}
                {activeTab === 'booked' && 'Schedule interviews from your claimed tickets'}
                {activeTab === 'completed' && 'Completed interviews will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentTickets.map(renderTicketCard)}
            </div>
          )}
        </div>
      </div>

      {showBookingModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`border rounded-2xl max-w-md w-full p-6 shadow-2xl ${th.modalBg}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-base font-bold ${th.cardText}`}>Schedule Interview</h3>
              <button
                onClick={() => { setShowBookingModal(false); setSelectedTicket(null); setMeetingLink(''); setMeetingLinkError(false); }}
                className={`p-1.5 transition-colors rounded-lg ${darkMode ? 'text-white/25 hover:text-white/60 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`border rounded-xl p-4 mb-5 space-y-1.5 ${darkMode ? 'bg-white/[0.03] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${th.cardFaint}`}>Candidate</span>
                <span className={`text-xs font-medium ${th.cardSub}`}>{selectedTicket.users.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${th.cardFaint}`}>Role</span>
                <span className={`text-xs font-medium ${th.cardSub}`}>{selectedTicket.job_role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${th.cardFaint}`}>Ticket</span>
                <span className={`text-[10px] font-mono ${th.cardFaint}`}>{selectedTicket.ticket_number}</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-xs font-medium mb-2 ${th.cardFaint}`}>Interview Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-blue-500/40 transition-all ${th.modalInput} ${darkMode ? '[color-scheme:dark]' : ''}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-2 ${th.cardFaint}`}>Interview Time</label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-blue-500/40 transition-all ${th.modalInput} ${darkMode ? '[color-scheme:dark]' : ''}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-2 ${th.cardFaint}`}>
                  Meeting Link <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => { setMeetingLink(e.target.value); if (e.target.value.trim()) setMeetingLinkError(false); }}
                  placeholder="https://meet.google.com/..."
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none transition-all ${meetingLinkError ? 'border-red-500/60 focus:border-red-500/60' : 'focus:border-blue-500/40'} ${th.modalInput}`}
                />
                {meetingLinkError && (
                  <p className="mt-1.5 text-[11px] text-red-400 font-medium">Meeting link is required</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmBooking}
                disabled={!bookingDate || !bookingTime || actionLoading === selectedTicket.id}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-40"
              >
                {actionLoading === selectedTicket.id ? 'Booking...' : 'Confirm Booking'}
              </button>
              <button
                onClick={() => { setShowBookingModal(false); setSelectedTicket(null); setMeetingLink(''); setMeetingLinkError(false); }}
                className={`px-4 py-2.5 border text-sm font-medium rounded-xl transition-colors ${darkMode ? 'bg-white/[0.04] border-white/8 text-white/50 hover:bg-white/[0.07]' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
