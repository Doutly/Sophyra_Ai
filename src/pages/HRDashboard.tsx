import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  LogOut, Brain, Sun, Moon, ExternalLink, Download,
  ChevronRight, X, Star, FileText, Loader2, CheckCircle,
  User, Briefcase, Calendar, Clock, Ticket, Search, Filter,
  Mail, Building2, Target, BookOpen, SlidersHorizontal
} from 'lucide-react';

interface MockInterviewRequest {
  id: string;
  ticket_number: string;
  user_id: string;
  job_role: string;
  company_name: string | null;
  experience_level: string;
  job_description: string;
  additional_notes: string;
  interview_description?: string;
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
  users: { name: string; email: string };
  hr_feedback?: HRFeedback;
  ai_report?: AIReport;
}

export interface HRFeedback {
  overall_rating: number;
  communication: string;
  technical_knowledge: string;
  problem_solving: string;
  cultural_fit: string;
  key_strengths: string;
  areas_for_improvement: string;
  hire_recommendation: string;
  private_notes: string;
  interview_description: string;
}

export interface AIReport {
  executive_summary: string;
  performance_analysis: string;
  key_strengths: string[];
  development_areas: string[];
  hire_recommendation: string;
  coaching_suggestions: string[];
  report_generated_at: string;
}

type KanbanColumn = 'pool' | 'claimed' | 'scheduled' | 'completed' | 'assigned';

const COLUMN_CONFIG: {
  key: KanbanColumn;
  label: string;
  color: string;
  headerBg: string;
  border: string;
  colBg: string;
  dotColor: string;
}[] = [
  {
    key: 'pool',
    label: 'Ticket Pool',
    color: 'text-cyan-400',
    headerBg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    colBg: 'bg-cyan-500/[0.03]',
    dotColor: 'bg-cyan-400',
  },
  {
    key: 'claimed',
    label: 'Claimed',
    color: 'text-amber-400',
    headerBg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    colBg: 'bg-amber-500/[0.03]',
    dotColor: 'bg-amber-400',
  },
  {
    key: 'assigned',
    label: 'Assigned to Me',
    color: 'text-blue-400',
    headerBg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    colBg: 'bg-blue-500/[0.03]',
    dotColor: 'bg-blue-400',
  },
  {
    key: 'scheduled',
    label: 'Scheduled',
    color: 'text-emerald-400',
    headerBg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    colBg: 'bg-emerald-500/[0.03]',
    dotColor: 'bg-emerald-400',
  },
  {
    key: 'completed',
    label: 'Completed',
    color: 'text-slate-400',
    headerBg: 'bg-white/5',
    border: 'border-white/10',
    colBg: 'bg-white/[0.015]',
    dotColor: 'bg-slate-500',
  },
];

const RATING_OPTIONS = ['Excellent', 'Good', 'Average', 'Needs Improvement'];
const HIRE_OPTIONS = ['Strong Hire', 'Hire', 'Maybe', 'No Hire'];
const EXP_LEVELS = ['fresher', 'mid', 'senior', 'Entry Level', 'Mid Level', 'Senior Level', 'Executive'];

export default function HRDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [allTickets, setAllTickets] = useState<MockInterviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterExp, setFilterExp] = useState('');
  const [filterHire, setFilterHire] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MockInterviewRequest | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingLinkError, setMeetingLinkError] = useState(false);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackTicket, setFeedbackTicket] = useState<MockInterviewRequest | null>(null);
  const [feedback, setFeedback] = useState<HRFeedback>({
    overall_rating: 0,
    communication: '',
    technical_knowledge: '',
    problem_solving: '',
    cultural_fit: '',
    key_strengths: '',
    areas_for_improvement: '',
    hire_recommendation: '',
    private_notes: '',
    interview_description: '',
  });
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const [profileTicket, setProfileTicket] = useState<MockInterviewRequest | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [dragOver, setDragOver] = useState<KanbanColumn | null>(null);
  const dragTicketRef = useRef<MockInterviewRequest | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth?mode=signin'); return; }
    const requestsRef = collection(db, 'mockInterviewRequests');
    const unsubscribe = onSnapshot(requestsRef, async (snapshot) => {
      const items = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let userData = { name: 'Unknown', email: 'unknown@example.com' };
        if (data.user_id) {
          try {
            const uSnap = await getDoc(doc(db, 'users', data.user_id));
            if (uSnap.exists()) userData = uSnap.data() as { name: string; email: string };
          } catch { }
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
          interview_description: data.interview_description || '',
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
          hr_feedback: data.hr_feedback || undefined,
          ai_report: data.ai_report || undefined,
        } as MockInterviewRequest;
      }));
      setAllTickets(items);
      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
  }, [user, navigate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileTicket(null);
      }
    };
    if (profileTicket) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileTicket]);

  const matchesSearch = (ticket: MockInterviewRequest) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (ticket.candidate_info?.name || ticket.users.name || '').toLowerCase();
    const email = (ticket.users.email || '').toLowerCase();
    const ticketNum = (ticket.ticket_number || '').toLowerCase();
    const role = (ticket.job_role || '').toLowerCase();
    const company = (ticket.company_name || '').toLowerCase();
    const exp = (ticket.experience_level || '').toLowerCase();
    return name.includes(q) || email.includes(q) || ticketNum.includes(q) || role.includes(q) || company.includes(q) || exp.includes(q);
  };

  const matchesFilters = (ticket: MockInterviewRequest) => {
    if (filterExp && ticket.experience_level !== filterExp) return false;
    if (filterHire && ticket.hr_feedback?.hire_recommendation !== filterHire) return false;
    return true;
  };

  const getColumnTickets = (col: KanbanColumn): MockInterviewRequest[] => {
    let tickets: MockInterviewRequest[] = [];
    switch (col) {
      case 'pool': tickets = allTickets.filter(r => !r.assigned_hr_id && r.booking_status === 'unclaimed' && r.status === 'approved'); break;
      case 'claimed': tickets = allTickets.filter(r => r.booking_status === 'claimed' && r.claimed_by === user?.uid); break;
      case 'assigned': tickets = allTickets.filter(r => r.assigned_hr_id === user?.uid && r.status === 'approved' && (r.booking_status === 'unclaimed' || r.claimed_by === user?.uid)); break;
      case 'scheduled': tickets = allTickets.filter(r => r.booking_status === 'booked' && r.claimed_by === user?.uid); break;
      case 'completed': tickets = allTickets.filter(r => r.booking_status === 'completed' && r.claimed_by === user?.uid); break;
    }
    return tickets.filter(t => matchesSearch(t) && matchesFilters(t));
  };

  const totalFiltered = COLUMN_CONFIG.reduce((sum, col) => sum + getColumnTickets(col.key).length, 0);
  const hasActiveFilters = searchQuery.trim() || filterExp || filterHire;

  const handleClaim = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      await updateDoc(doc(db, 'mockInterviewRequests', ticketId), {
        claimed_by: user!.uid,
        claimed_at: new Date().toISOString(),
        booking_status: 'claimed',
      });
    } finally { setActionLoading(null); }
  };

  const handleRelease = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      await updateDoc(doc(db, 'mockInterviewRequests', ticketId), {
        claimed_by: null, claimed_at: null, booking_status: 'unclaimed',
      });
    } finally { setActionLoading(null); }
  };

  const openBooking = (ticket: MockInterviewRequest) => {
    setSelectedTicket(ticket);
    setBookingDate(ticket.preferred_date?.split('T')[0] || '');
    setBookingTime(ticket.preferred_time || '');
    setMeetingLink('');
    setMeetingLinkError(false);
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedTicket || !bookingDate || !bookingTime) return;
    if (!meetingLink.trim()) { setMeetingLinkError(true); return; }
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
    } finally { setActionLoading(null); }
  };

  const openFeedback = (ticket: MockInterviewRequest) => {
    setFeedbackTicket(ticket);
    setAiReport(ticket.ai_report || null);
    setFeedbackSaved(false);
    setFeedback(ticket.hr_feedback || {
      overall_rating: 0,
      communication: '',
      technical_knowledge: '',
      problem_solving: '',
      cultural_fit: '',
      key_strengths: '',
      areas_for_improvement: '',
      hire_recommendation: '',
      private_notes: '',
      interview_description: '',
    });
    setShowFeedbackModal(true);
  };

  const isFeedbackComplete = (f: HRFeedback) => {
    return (
      f.overall_rating > 0 &&
      f.communication !== '' &&
      f.technical_knowledge !== '' &&
      f.problem_solving !== '' &&
      f.cultural_fit !== '' &&
      f.key_strengths.trim() !== '' &&
      f.areas_for_improvement.trim() !== '' &&
      f.hire_recommendation !== ''
    );
  };

  const generateAIReport = async () => {
    if (!feedbackTicket || !isFeedbackComplete(feedback)) return;
    setGeneratingAI(true);
    const candidateName = feedbackTicket.candidate_info?.name || feedbackTicket.users.name;
    const prompt = `You are an expert HR consultant. Generate a structured interview report based on the following data.

Candidate: ${candidateName}
Role: ${feedbackTicket.job_role}
Company: ${feedbackTicket.company_name || 'Not specified'}
Experience Level: ${feedbackTicket.experience_level}
Job Description: ${feedbackTicket.job_description || 'Not provided'}
${feedback.interview_description ? `Interview Notes: ${feedback.interview_description}` : ''}

HR Evaluation:
- Overall Rating: ${feedback.overall_rating}/5 stars
- Communication: ${feedback.communication}
- Technical Knowledge: ${feedback.technical_knowledge}
- Problem Solving: ${feedback.problem_solving}
- Cultural Fit: ${feedback.cultural_fit}
- Key Strengths (HR notes): ${feedback.key_strengths}
- Areas for Improvement (HR notes): ${feedback.areas_for_improvement}
- Hire Recommendation: ${feedback.hire_recommendation}

Return ONLY valid JSON with this exact structure:
{
  "executive_summary": "2-3 sentence summary of candidate performance",
  "performance_analysis": "1-2 paragraph detailed analysis",
  "key_strengths": ["strength 1", "strength 2", "strength 3"],
  "development_areas": ["area 1", "area 2", "area 3"],
  "hire_recommendation": "recommendation with brief reasoning",
  "coaching_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;

    try {
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
          }),
        }
      );
      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(clean);
      const report: AIReport = { ...parsed, report_generated_at: new Date().toISOString() };
      setAiReport(report);
    } catch (err) {
      console.error('AI report generation failed:', err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const saveFeedback = async (markComplete: boolean) => {
    if (!feedbackTicket) return;
    setSavingFeedback(true);
    try {
      const updates: Record<string, unknown> = { hr_feedback: feedback };
      if (markComplete) {
        updates.booking_status = 'completed';
        updates.status = 'completed';
      }
      if (aiReport) {
        updates.ai_report = aiReport;
        const overallScore = feedback.overall_rating * 20;
        const candidateName = feedbackTicket.candidate_info?.name || feedbackTicket.users.name;
        await addDoc(collection(db, 'reports'), {
          sessionId: feedbackTicket.id,
          ticketId: feedbackTicket.id,
          userId: feedbackTicket.user_id,
          reportType: 'manual_interview',
          overallScore,
          performanceBreakdown: {
            communication: mapRatingToScore(feedback.communication),
            technical: mapRatingToScore(feedback.technical_knowledge),
            problem_solving: mapRatingToScore(feedback.problem_solving),
            cultural_fit: mapRatingToScore(feedback.cultural_fit),
            overall: feedback.overall_rating * 2,
          },
          strengths: aiReport.key_strengths,
          gaps: aiReport.development_areas,
          suggestedTopics: aiReport.coaching_suggestions,
          executiveSummary: aiReport.executive_summary,
          performanceAnalysis: aiReport.performance_analysis,
          hireRecommendation: aiReport.hire_recommendation,
          candidateName,
          role: feedbackTicket.job_role,
          company: feedbackTicket.company_name,
          experienceLevel: feedbackTicket.experience_level,
          createdAt: serverTimestamp(),
        });
      }
      await updateDoc(doc(db, 'mockInterviewRequests', feedbackTicket.id), updates);
      setFeedbackSaved(true);
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackTicket(null);
        setFeedbackSaved(false);
      }, 1200);
    } finally {
      setSavingFeedback(false);
    }
  };

  const mapRatingToScore = (rating: string): number => {
    switch (rating) {
      case 'Excellent': return 9;
      case 'Good': return 7;
      case 'Average': return 5;
      case 'Needs Improvement': return 3;
      default: return 5;
    }
  };

  const handleDragStart = (ticket: MockInterviewRequest) => { dragTicketRef.current = ticket; };

  const handleDrop = async (col: KanbanColumn) => {
    const ticket = dragTicketRef.current;
    if (!ticket) return;
    setDragOver(null);
    dragTicketRef.current = null;
    if (col === 'claimed' && ticket.booking_status === 'unclaimed') await handleClaim(ticket.id);
    else if (col === 'pool' && ticket.claimed_by === user?.uid && ticket.booking_status === 'claimed') await handleRelease(ticket.id);
    else if (col === 'scheduled' && ticket.booking_status === 'claimed') openBooking(ticket);
    else if (col === 'completed' && ticket.booking_status === 'booked') openFeedback(ticket);
  };

  const th = {
    bg: darkMode ? 'bg-[#030712]' : 'bg-gray-50',
    nav: darkMode ? 'bg-[#030712]/90 border-white/5 backdrop-blur-xl' : 'bg-white border-gray-200',
    navText: darkMode ? 'text-white' : 'text-gray-900',
    card: darkMode ? 'bg-white/[0.025] border-white/[0.06]' : 'bg-white border-gray-200',
    cardText: darkMode ? 'text-white' : 'text-gray-900',
    cardSub: darkMode ? 'text-white/50' : 'text-gray-500',
    cardFaint: darkMode ? 'text-white/25' : 'text-gray-400',
    btn: darkMode ? 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white/90 hover:bg-white/[0.07]' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200',
    modalBg: darkMode ? 'bg-[#0d1117] border-white/10' : 'bg-white border-gray-200',
    modalInput: darkMode ? 'bg-white/[0.04] border-white/[0.08] text-white/80 placeholder-white/20 focus:border-blue-500/40' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500',
    searchBg: darkMode ? 'bg-white/[0.04] border-white/[0.08] text-white/80 placeholder-white/25 focus:border-blue-500/40' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500',
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${th.bg} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-xs ${th.cardSub}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${th.bg} transition-colors duration-300`}>
      <nav className={`sticky top-0 z-40 border-b ${th.nav}`}>
        <div className="px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className={`text-sm font-bold ${th.navText}`}>Sophyra AI</span>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full tracking-widest uppercase">
                HR Portal
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs hidden md:block ${th.cardFaint}`}>{user?.email}</span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg transition-all text-xs font-medium ${th.btn}`}
              >
                {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
              </button>
              <button
                onClick={async () => { await signOut(); navigate('/'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg transition-all text-xs font-medium ${th.btn}`}
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="px-4 py-5">
        <div className="mb-4 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className={`text-xl font-bold ${th.navText}`}>Interview Board</h1>
            <p className={`text-xs mt-0.5 ${th.cardFaint}`}>Drag tickets between columns to update status</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {COLUMN_CONFIG.map(col => {
              const count = getColumnTickets(col.key).length;
              return (
                <div key={col.key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${col.headerBg} ${col.border}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${col.dotColor}`} />
                  <span className={`text-[11px] font-semibold ${col.color}`}>{col.label}</span>
                  <span className={`text-[11px] font-bold ${col.color} opacity-70`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`mb-4 rounded-xl border p-3 ${darkMode ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${th.cardFaint}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, ticket ID, role, company..."
                className={`w-full pl-8 pr-3 py-2 border rounded-lg text-xs focus:outline-none transition-all ${th.searchBg}`}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${th.cardFaint} hover:text-white/60`}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-medium transition-all ${showFilters || filterExp || filterHire ? 'border-blue-500/40 text-blue-400 bg-blue-500/10' : th.btn}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(filterExp || filterHire) && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              )}
            </button>

            {hasActiveFilters && (
              <div className={`text-xs ${th.cardFaint}`}>
                {totalFiltered} result{totalFiltered !== 1 ? 's' : ''}
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={() => { setSearchQuery(''); setFilterExp(''); setFilterHire(''); }}
                className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {showFilters && (
            <div className={`mt-3 pt-3 border-t flex items-center gap-3 flex-wrap ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
              <div className="flex items-center gap-1.5">
                <Filter className={`w-3 h-3 ${th.cardFaint}`} />
                <span className={`text-xs font-semibold ${th.cardFaint}`}>Experience:</span>
              </div>
              <select
                value={filterExp}
                onChange={e => setFilterExp(e.target.value)}
                className={`px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none transition-all ${th.modalInput} ${darkMode ? '[color-scheme:dark]' : ''}`}
              >
                <option value="">All levels</option>
                {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>

              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${th.cardFaint}`}>Hire status:</span>
              </div>
              <select
                value={filterHire}
                onChange={e => setFilterHire(e.target.value)}
                className={`px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none transition-all ${th.modalInput} ${darkMode ? '[color-scheme:dark]' : ''}`}
              >
                <option value="">All recommendations</option>
                {HIRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 items-start">
          {COLUMN_CONFIG.map(col => (
            <KanbanColumnComponent
              key={col.key}
              config={col}
              tickets={getColumnTickets(col.key)}
              isDragOver={dragOver === col.key}
              darkMode={darkMode}
              th={th}
              actionLoading={actionLoading}
              userId={user?.uid}
              onDragStart={handleDragStart}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(col.key)}
              onClaim={handleClaim}
              onRelease={handleRelease}
              onSchedule={openBooking}
              onMarkDone={openFeedback}
              onViewReport={(ticket) => navigate(`/hr-report/${ticket.id}`)}
              onViewProfile={(ticket) => setProfileTicket(ticket)}
            />
          ))}
        </div>
      </div>

      {profileTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div ref={profileRef} className={`border rounded-2xl max-w-sm w-full p-6 shadow-2xl ${th.modalBg}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-base font-bold ${th.navText}`}>Candidate Profile</h3>
              <button onClick={() => setProfileTicket(null)} className={`p-1.5 rounded-lg transition-colors ${th.btn}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                <span className="text-base font-bold text-white">
                  {(profileTicket.candidate_info?.name || profileTicket.users.name || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className={`text-sm font-bold ${th.navText}`}>{profileTicket.candidate_info?.name || profileTicket.users.name}</p>
                <p className={`text-xs mt-0.5 ${th.cardFaint}`}>{profileTicket.users.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              {profileTicket.candidate_info?.industry && (
                <div className="flex items-start gap-2.5">
                  <Building2 className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${th.cardFaint}`} />
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${th.cardFaint}`}>Industry</p>
                    <p className={`text-xs ${th.cardSub}`}>{profileTicket.candidate_info.industry}</p>
                  </div>
                </div>
              )}
              {(profileTicket.candidate_info?.experience_level || profileTicket.experience_level) && (
                <div className="flex items-start gap-2.5">
                  <Target className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${th.cardFaint}`} />
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${th.cardFaint}`}>Experience Level</p>
                    <p className={`text-xs ${th.cardSub}`}>{profileTicket.candidate_info?.experience_level || profileTicket.experience_level}</p>
                  </div>
                </div>
              )}
              {profileTicket.candidate_info?.bio && (
                <div className="flex items-start gap-2.5">
                  <User className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${th.cardFaint}`} />
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${th.cardFaint}`}>Bio</p>
                    <p className={`text-xs leading-relaxed ${th.cardSub}`}>{profileTicket.candidate_info.bio}</p>
                  </div>
                </div>
              )}
              {profileTicket.candidate_info?.career_goals && (
                <div className="flex items-start gap-2.5">
                  <BookOpen className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${th.cardFaint}`} />
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${th.cardFaint}`}>Career Goals</p>
                    <p className={`text-xs leading-relaxed ${th.cardSub}`}>{profileTicket.candidate_info.career_goals}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <Mail className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${th.cardFaint}`} />
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${th.cardFaint}`}>Email</p>
                  <p className={`text-xs ${th.cardSub}`}>{profileTicket.candidate_info?.email || profileTicket.users.email}</p>
                </div>
              </div>
            </div>

            {profileTicket.candidate_info?.resume_url && (
              <a
                href={profileTicket.candidate_info.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-500 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Resume
              </a>
            )}
          </div>
        </div>
      )}

      {showBookingModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`border rounded-2xl max-w-md w-full p-6 shadow-2xl ${th.modalBg}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-base font-bold ${th.navText}`}>Schedule Interview</h3>
              <button onClick={() => setShowBookingModal(false)} className={`p-1.5 rounded-lg transition-colors ${th.btn}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={`border rounded-xl p-4 mb-5 space-y-1.5 ${darkMode ? 'bg-white/[0.03] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
              <Row label="Candidate" value={selectedTicket.candidate_info?.name || selectedTicket.users.name} th={th} />
              <Row label="Role" value={selectedTicket.job_role} th={th} />
              <Row label="Ticket" value={selectedTicket.ticket_number} th={th} mono />
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${th.cardFaint}`}>Interview Date</label>
                <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none transition-all ${th.modalInput} ${darkMode ? '[color-scheme:dark]' : ''}`} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${th.cardFaint}`}>Interview Time</label>
                <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none transition-all ${th.modalInput} ${darkMode ? '[color-scheme:dark]' : ''}`} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${th.cardFaint}`}>Meeting Link <span className="text-red-400">*</span></label>
                <input type="url" value={meetingLink} onChange={e => { setMeetingLink(e.target.value); if (e.target.value.trim()) setMeetingLinkError(false); }}
                  placeholder="https://meet.google.com/..."
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none transition-all ${meetingLinkError ? 'border-red-500/60' : ''} ${th.modalInput}`} />
                {meetingLinkError && <p className="mt-1 text-[11px] text-red-400 font-medium">Meeting link is required</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={confirmBooking} disabled={!bookingDate || !bookingTime || actionLoading === selectedTicket.id}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-40">
                {actionLoading === selectedTicket.id ? 'Booking...' : 'Confirm Booking'}
              </button>
              <button onClick={() => setShowBookingModal(false)}
                className={`px-4 py-2.5 border text-sm font-medium rounded-xl transition-colors ${th.btn}`}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showFeedbackModal && feedbackTicket && (
        <FeedbackModal
          ticket={feedbackTicket}
          feedback={feedback}
          aiReport={aiReport}
          darkMode={darkMode}
          th={th}
          generatingAI={generatingAI}
          savingFeedback={savingFeedback}
          feedbackSaved={feedbackSaved}
          isFeedbackComplete={isFeedbackComplete(feedback)}
          onFeedbackChange={setFeedback}
          onGenerateAI={generateAIReport}
          onSave={saveFeedback}
          onClose={() => { setShowFeedbackModal(false); setFeedbackTicket(null); setAiReport(null); }}
        />
      )}
    </div>
  );
}

function Row({ label, value, th, mono }: { label: string; value: string; th: Record<string, string>; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${th.cardFaint}`}>{label}</span>
      <span className={`text-xs font-medium ${mono ? 'font-mono' : ''} ${th.cardSub}`}>{value}</span>
    </div>
  );
}

function KanbanColumnComponent({
  config, tickets, isDragOver, darkMode, th, actionLoading, userId,
  onDragStart, onDragOver, onDragLeave, onDrop,
  onClaim, onRelease, onSchedule, onMarkDone, onViewReport, onViewProfile,
}: {
  config: typeof COLUMN_CONFIG[0];
  tickets: MockInterviewRequest[];
  isDragOver: boolean;
  darkMode: boolean;
  th: Record<string, string>;
  actionLoading: string | null;
  userId?: string;
  onDragStart: (t: MockInterviewRequest) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onClaim: (id: string) => void;
  onRelease: (id: string) => void;
  onSchedule: (t: MockInterviewRequest) => void;
  onMarkDone: (t: MockInterviewRequest) => void;
  onViewReport: (t: MockInterviewRequest) => void;
  onViewProfile: (t: MockInterviewRequest) => void;
}) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 flex flex-col ${config.colBg} ${config.border} ${isDragOver ? 'ring-2 ring-blue-500/30 scale-[1.005]' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={`flex items-center justify-between px-4 py-3 border-b ${config.border}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
          <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.headerBg} ${config.color}`}>{tickets.length}</span>
      </div>

      <div className="p-2 space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto">
        {tickets.length === 0 && (
          <div className={`flex flex-col items-center justify-center py-10 text-center ${isDragOver ? 'opacity-100' : 'opacity-40'}`}>
            <Ticket className={`w-6 h-6 mb-2 ${config.color}`} />
            <p className={`text-xs ${config.color}`}>Drop here</p>
          </div>
        )}
        {tickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            columnKey={config.key}
            darkMode={darkMode}
            th={th}
            actionLoading={actionLoading}
            userId={userId}
            onDragStart={onDragStart}
            onClaim={onClaim}
            onRelease={onRelease}
            onSchedule={onSchedule}
            onMarkDone={onMarkDone}
            onViewReport={onViewReport}
            onViewProfile={onViewProfile}
          />
        ))}
      </div>
    </div>
  );
}

const EXP_COLORS: Record<string, string> = {
  'Entry Level': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  'Mid Level': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Senior Level': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Executive': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  'fresher': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  'mid': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'senior': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

function TicketCard({
  ticket, columnKey, darkMode, th, actionLoading, userId,
  onDragStart, onClaim, onRelease, onSchedule, onMarkDone, onViewReport, onViewProfile,
}: {
  ticket: MockInterviewRequest;
  columnKey: KanbanColumn;
  darkMode: boolean;
  th: Record<string, string>;
  actionLoading: string | null;
  userId?: string;
  onDragStart: (t: MockInterviewRequest) => void;
  onClaim: (id: string) => void;
  onRelease: (id: string) => void;
  onSchedule: (t: MockInterviewRequest) => void;
  onMarkDone: (t: MockInterviewRequest) => void;
  onViewReport: (t: MockInterviewRequest) => void;
  onViewProfile: (t: MockInterviewRequest) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const candidateName = ticket.candidate_info?.name || ticket.users.name;
  const expColor = EXP_COLORS[ticket.experience_level] || 'text-slate-400 bg-white/5 border-white/10';
  const isLoading = actionLoading === ticket.id;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(ticket)}
      className={`border rounded-xl cursor-grab active:cursor-grabbing transition-all duration-150 hover:scale-[1.01] ${darkMode ? 'bg-white/[0.025] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${th.cardText}`}>{candidateName}</p>
            <p className={`text-[10px] mt-0.5 truncate ${th.cardFaint}`}>{ticket.users.email}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onViewProfile(ticket); }}
              title="View candidate profile"
              className={`p-1 rounded-lg transition-colors hover:bg-white/10 ${th.cardFaint} hover:text-blue-400`}
            >
              <User className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setExpanded(!expanded)} className={`p-0.5 transition-colors ${th.cardFaint} hover:text-white/60`}>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        <p className={`text-[10px] font-mono mb-2 ${th.cardFaint}`}>{ticket.ticket_number}</p>

        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${expColor}`}>
            {ticket.experience_level}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Briefcase className={`w-3 h-3 flex-shrink-0 ${th.cardFaint}`} />
            <span className={`text-[11px] truncate ${th.cardSub}`}>{ticket.job_role}{ticket.company_name ? ` · ${ticket.company_name}` : ''}</span>
          </div>
          {(columnKey === 'scheduled' && ticket.scheduled_date) ? (
            <div className="flex items-center gap-1.5">
              <Calendar className={`w-3 h-3 flex-shrink-0 ${th.cardFaint}`} />
              <span className={`text-[11px] ${th.cardSub}`}>{new Date(ticket.scheduled_date).toLocaleDateString()} · {ticket.scheduled_time}</span>
            </div>
          ) : ticket.preferred_date ? (
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3 h-3 flex-shrink-0 ${th.cardFaint}`} />
              <span className={`text-[11px] ${th.cardFaint}`}>Pref: {new Date(ticket.preferred_date).toLocaleDateString()}</span>
            </div>
          ) : null}
        </div>

        {expanded && (
          <div className={`mt-3 pt-3 border-t space-y-2 ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
            {ticket.candidate_info?.bio && (
              <p className={`text-[11px] leading-relaxed line-clamp-3 ${th.cardSub}`}>{ticket.candidate_info.bio}</p>
            )}
            {ticket.job_description && (
              <p className={`text-[11px] leading-relaxed line-clamp-3 ${th.cardFaint}`}>{ticket.job_description}</p>
            )}
            {ticket.interview_description && (
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${th.cardFaint}`}>Interview Notes</p>
                <p className={`text-[11px] leading-relaxed line-clamp-3 ${th.cardSub}`}>{ticket.interview_description}</p>
              </div>
            )}
            {ticket.candidate_info?.resume_url && (
              <a href={ticket.candidate_info.resume_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium">
                <Download className="w-3 h-3" /> Resume
              </a>
            )}
            {columnKey === 'scheduled' && ticket.meeting_room_link && (
              <a href={ticket.meeting_room_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                <ExternalLink className="w-3 h-3" /> Join Room
              </a>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(columnKey === 'pool' || (columnKey === 'assigned' && ticket.booking_status === 'unclaimed')) && (
            <button onClick={() => onClaim(ticket.id)} disabled={isLoading}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 transition-colors disabled:opacity-40">
              {isLoading ? '...' : 'Claim'}
            </button>
          )}
          {columnKey === 'claimed' && (
            <>
              <button onClick={() => onSchedule(ticket)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors">
                Schedule
              </button>
              <button onClick={() => onRelease(ticket.id)} disabled={isLoading}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 ${darkMode ? 'bg-white/[0.03] border-white/10 text-white/35 hover:bg-white/[0.06]' : 'bg-gray-100 border-gray-200 text-gray-400 hover:bg-gray-200'}`}>
                {isLoading ? '...' : 'Release'}
              </button>
            </>
          )}
          {columnKey === 'scheduled' && (
            <button onClick={() => onMarkDone(ticket)} disabled={isLoading}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 transition-colors disabled:opacity-40">
              {isLoading ? '...' : 'Mark Done'}
            </button>
          )}
          {columnKey === 'completed' && (
            <>
              <button onClick={() => onMarkDone(ticket)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/[0.04] text-white/50 border border-white/10 hover:bg-white/[0.07] transition-colors">
                {ticket.hr_feedback ? 'Edit Feedback' : 'Add Feedback'}
              </button>
              {ticket.ai_report && (
                <button onClick={() => onViewReport(ticket)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors">
                  View Report
                </button>
              )}
            </>
          )}
          {ticket.hr_feedback && columnKey !== 'completed' && ticket.ai_report && (
            <button onClick={() => onViewReport(ticket)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors">
              <FileText className="w-3 h-3 inline mr-0.5" /> Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FeedbackModal({
  ticket, feedback, aiReport, darkMode, th, generatingAI, savingFeedback, feedbackSaved, isFeedbackComplete,
  onFeedbackChange, onGenerateAI, onSave, onClose,
}: {
  ticket: MockInterviewRequest;
  feedback: HRFeedback;
  aiReport: AIReport | null;
  darkMode: boolean;
  th: Record<string, string>;
  generatingAI: boolean;
  savingFeedback: boolean;
  feedbackSaved: boolean;
  isFeedbackComplete: boolean;
  onFeedbackChange: (f: HRFeedback) => void;
  onGenerateAI: () => void;
  onSave: (markComplete: boolean) => void;
  onClose: () => void;
}) {
  const candidateName = ticket.candidate_info?.name || ticket.users.name;
  const update = (field: keyof HRFeedback, val: string | number) => onFeedbackChange({ ...feedback, [field]: val });
  const isCompleted = ticket.booking_status === 'completed';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl ${th.modalBg}`}>
        <div className={`sticky top-0 z-10 flex items-center justify-between p-5 pb-4 border-b ${darkMode ? 'bg-[#0d1117] border-white/10' : 'bg-white border-gray-200'}`}>
          <div>
            <h3 className={`text-base font-bold ${th.navText}`}>Interview Feedback</h3>
            <p className={`text-xs mt-0.5 ${th.cardFaint}`}>{candidateName} · {ticket.job_role}</p>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${th.btn}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${th.cardFaint}`}>Interview Description <span className={`text-[10px] ${th.cardFaint} opacity-60`}>(What happened during the interview)</span></label>
            <textarea value={feedback.interview_description || ''} onChange={e => update('interview_description', e.target.value)}
              rows={4} placeholder="Describe the interview session — topics discussed, candidate's demeanor, key moments, overall impression..."
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none transition-all resize-none ${th.modalInput}`} />
          </div>

          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${th.cardFaint}`}>Overall Rating</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => update('overall_rating', n)}
                  className={`transition-all ${n <= feedback.overall_rating ? 'text-amber-400' : darkMode ? 'text-white/15 hover:text-amber-400/50' : 'text-gray-200 hover:text-amber-300'}`}>
                  <Star className="w-7 h-7 fill-current" />
                </button>
              ))}
              {feedback.overall_rating > 0 && (
                <span className={`ml-2 text-sm font-semibold self-center ${th.cardSub}`}>{feedback.overall_rating}/5</span>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Communication', field: 'communication' as keyof HRFeedback },
              { label: 'Technical Knowledge', field: 'technical_knowledge' as keyof HRFeedback },
              { label: 'Problem Solving', field: 'problem_solving' as keyof HRFeedback },
              { label: 'Cultural Fit', field: 'cultural_fit' as keyof HRFeedback },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className={`block text-xs font-medium mb-1.5 ${th.cardFaint}`}>{label}</label>
                <select value={(feedback[field] as string) || ''} onChange={e => update(field, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none transition-all ${th.modalInput} ${darkMode ? '[color-scheme:dark]' : ''}`}>
                  <option value="">Select...</option>
                  {RATING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${th.cardFaint}`}>Key Strengths</label>
            <textarea value={feedback.key_strengths} onChange={e => update('key_strengths', e.target.value)}
              rows={3} placeholder="Notable strengths observed during the interview..."
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none transition-all resize-none ${th.modalInput}`} />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${th.cardFaint}`}>Areas for Improvement</label>
            <textarea value={feedback.areas_for_improvement} onChange={e => update('areas_for_improvement', e.target.value)}
              rows={3} placeholder="Key development areas observed..."
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none transition-all resize-none ${th.modalInput}`} />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${th.cardFaint}`}>Hire Recommendation</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {HIRE_OPTIONS.map(o => {
                const colors: Record<string, string> = {
                  'Strong Hire': 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
                  'Hire': 'border-blue-500/30 text-blue-400 bg-blue-500/10',
                  'Maybe': 'border-amber-500/30 text-amber-400 bg-amber-500/10',
                  'No Hire': 'border-red-500/30 text-red-400 bg-red-500/10',
                };
                const isSelected = feedback.hire_recommendation === o;
                return (
                  <button key={o} onClick={() => update('hire_recommendation', o)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${isSelected ? colors[o] : darkMode ? 'border-white/10 text-white/30 hover:border-white/20' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                    {o}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${th.cardFaint}`}>Private Notes (not shared with candidate)</label>
            <textarea value={feedback.private_notes} onChange={e => update('private_notes', e.target.value)}
              rows={2} placeholder="Internal notes for HR team only..."
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none transition-all resize-none ${th.modalInput}`} />
          </div>

          {aiReport && (
            <div className={`rounded-xl border p-4 space-y-3 ${darkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className={`text-xs font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>AI Report Generated</p>
              </div>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-emerald-300/80' : 'text-emerald-800'}`}>{aiReport.executive_summary}</p>
              <div className="flex gap-2 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${darkMode ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-emerald-700 border-emerald-200 bg-emerald-100'}`}>
                  {aiReport.hire_recommendation}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className={`sticky bottom-0 p-5 pt-4 border-t flex gap-3 flex-wrap ${darkMode ? 'bg-[#0d1117] border-white/10' : 'bg-white border-gray-200'}`}>
          {!aiReport && (
            <button onClick={onGenerateAI} disabled={!isFeedbackComplete || generatingAI}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {generatingAI ? 'Generating...' : 'Generate AI Report'}
            </button>
          )}
          <button
            onClick={() => onSave(!isCompleted)}
            disabled={savingFeedback || !isFeedbackComplete}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${feedbackSaved ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
          >
            {savingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : feedbackSaved ? <CheckCircle className="w-4 h-4" /> : null}
            {feedbackSaved ? 'Saved!' : savingFeedback ? 'Saving...' : isCompleted ? 'Update Feedback' : 'Save & Complete'}
          </button>
          <button onClick={onClose} className={`px-4 py-2.5 border text-sm font-medium rounded-xl transition-colors ${th.btn}`}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
