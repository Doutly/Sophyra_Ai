import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  LogOut, ExternalLink, Download,
  ChevronRight, X, Star, FileText, Loader2, CheckCircle,
  User, Briefcase, Calendar, Clock, Ticket, Search,
  Mail, Building2, Target, BookOpen, Brain, Inbox, UserCircle
} from 'lucide-react';
import HRProfileModal from '../components/ui/HRProfileModal';
import TicketPoolModal from '../components/ui/TicketPoolModal';
import TicketDetailModal from '../components/ui/TicketDetailModal';
import ColumnAllTicketsModal from '../components/ui/ColumnAllTicketsModal';

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

type KanbanColumn = 'claimed' | 'scheduled' | 'completed' | 'assigned';

const COLUMN_CONFIG: {
  key: KanbanColumn;
  label: string;
  color: string;
  headerBg: string;
  border: string;
  colBg: string;
  dotColor: string;
  headerText: string;
}[] = [
  {
    key: 'assigned',
    label: 'Assigned to Me',
    color: 'text-blue-600',
    headerBg: 'bg-blue-50',
    border: 'border-blue-200',
    colBg: 'bg-blue-50/40',
    dotColor: 'bg-blue-500',
    headerText: 'text-blue-700',
  },
  {
    key: 'claimed',
    label: 'Claimed',
    color: 'text-amber-600',
    headerBg: 'bg-amber-50',
    border: 'border-amber-200',
    colBg: 'bg-amber-50/40',
    dotColor: 'bg-amber-500',
    headerText: 'text-amber-700',
  },
  {
    key: 'scheduled',
    label: 'Scheduled',
    color: 'text-emerald-600',
    headerBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    colBg: 'bg-emerald-50/40',
    dotColor: 'bg-emerald-500',
    headerText: 'text-emerald-700',
  },
  {
    key: 'completed',
    label: 'Completed',
    color: 'text-slate-500',
    headerBg: 'bg-slate-50',
    border: 'border-slate-200',
    colBg: 'bg-slate-50/40',
    dotColor: 'bg-slate-400',
    headerText: 'text-slate-600',
  },
];

const RATING_OPTIONS = ['Excellent', 'Good', 'Average', 'Needs Improvement'];
const HIRE_OPTIONS = ['Strong Hire', 'Hire', 'Maybe', 'No Hire'];

interface HRProfile {
  displayName: string;
  bio: string;
  hrExperience: string;
  expertise: string;
  linkedinUrl: string;
  avatarUrl: string;
}

export default function HRDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [allTickets, setAllTickets] = useState<MockInterviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [hrProfile, setHrProfile] = useState<HRProfile | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTicketPoolModal, setShowTicketPoolModal] = useState(false);
  const [detailTicket, setDetailTicket] = useState<MockInterviewRequest | null>(null);

  const [columnAllModal, setColumnAllModal] = useState<KanbanColumn | null>(null);

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
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setHrProfile({
            displayName: d.displayName || d.name || '',
            bio: d.bio || '',
            hrExperience: d.hrExperience || '',
            expertise: d.expertise || '',
            linkedinUrl: d.linkedinUrl || '',
            avatarUrl: d.avatarUrl || '',
          });
        }
      } catch { /* ignore */ }
    };
    fetchProfile();

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
    return name.includes(q) || email.includes(q) || ticketNum.includes(q) || role.includes(q) || company.includes(q);
  };

  const getPoolTickets = (): MockInterviewRequest[] =>
    allTickets.filter(r => !r.assigned_hr_id && r.booking_status === 'unclaimed' && r.status === 'approved');

  const getColumnTickets = (col: KanbanColumn): MockInterviewRequest[] => {
    let tickets: MockInterviewRequest[] = [];
    switch (col) {
      case 'claimed': tickets = allTickets.filter(r => r.booking_status === 'claimed' && r.claimed_by === user?.uid); break;
      case 'assigned': tickets = allTickets.filter(r => r.assigned_hr_id === user?.uid && r.status === 'approved' && (r.booking_status === 'unclaimed' || r.claimed_by === user?.uid)); break;
      case 'scheduled': tickets = allTickets.filter(r => r.booking_status === 'booked' && r.claimed_by === user?.uid); break;
      case 'completed': tickets = allTickets.filter(r => r.booking_status === 'completed' && r.claimed_by === user?.uid); break;
    }
    return tickets.filter(t => matchesSearch(t));
  };

  const handleClaim = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      await updateDoc(doc(db, 'mockInterviewRequests', ticketId), {
        claimed_by: user!.uid,
        claimed_at: new Date().toISOString(),
        booking_status: 'claimed',
      });
      setShowTicketPoolModal(false);
      setDetailTicket(null);
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

  const isFeedbackComplete = (f: HRFeedback) => (
    f.overall_rating > 0 &&
    f.communication !== '' &&
    f.technical_knowledge !== '' &&
    f.problem_solving !== '' &&
    f.cultural_fit !== '' &&
    f.key_strengths.trim() !== '' &&
    f.areas_for_improvement.trim() !== '' &&
    f.hire_recommendation !== ''
  );

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
    else if (col === 'scheduled' && ticket.booking_status === 'claimed') openBooking(ticket);
    else if (col === 'completed' && ticket.booking_status === 'booked') openFeedback(ticket);
  };

  const poolTickets = getPoolTickets();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const columnAllConfig = columnAllModal ? COLUMN_CONFIG.find(c => c.key === columnAllModal) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-40 border-b bg-white border-gray-200 shadow-sm">
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
              <span className="text-sm font-bold text-gray-900">Sophyra AI</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full tracking-widest uppercase">
                HR Portal
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTicketPoolModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 hover:bg-cyan-50 hover:border-cyan-200 hover:text-cyan-700 transition-all text-xs font-medium relative"
              >
                <Inbox className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ticket Pool</span>
                {poolTickets.length > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-cyan-500 text-white text-[10px] font-bold">
                    {poolTickets.length > 9 ? '9+' : poolTickets.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-xs font-medium"
              >
                {hrProfile?.avatarUrl ? (
                  <img
                    src={hrProfile.avatarUrl}
                    alt="Profile"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Profile</span>
              </button>

              <span className="text-xs hidden md:block text-gray-400">{user?.email}</span>
              <button
                onClick={async () => { await signOut(); navigate('/'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all text-xs font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="px-4 py-5">
        <div className="mb-4 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Interview Board</h1>
            <p className="text-xs mt-0.5 text-gray-400">Drag tickets between columns to update status</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {COLUMN_CONFIG.map(col => {
              const count = getColumnTickets(col.key).length;
              return (
                <div key={col.key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${col.headerBg} ${col.border}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${col.dotColor}`} />
                  <span className={`text-[11px] font-semibold ${col.headerText}`}>{col.label}</span>
                  <span className={`text-[11px] font-bold ${col.headerText} opacity-70`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, ticket ID, role, company..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all bg-gray-50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {searchQuery.trim() && (
              <span className="text-xs text-gray-400">
                {COLUMN_CONFIG.reduce((sum, col) => sum + getColumnTickets(col.key).length, 0)} result{COLUMN_CONFIG.reduce((sum, col) => sum + getColumnTickets(col.key).length, 0) !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-4 gap-3 items-start min-w-[800px]">
            {COLUMN_CONFIG.map(col => (
              <KanbanColumnComponent
                key={col.key}
                config={col}
                tickets={getColumnTickets(col.key)}
                isDragOver={dragOver === col.key}
                actionLoading={actionLoading}
                userId={user?.uid}
                onDragStart={handleDragStart}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(col.key)}
                onRelease={handleRelease}
                onSchedule={openBooking}
                onMarkDone={openFeedback}
                onViewReport={(ticket) => navigate(`/hr-report/${ticket.id}`)}
                onViewProfile={(ticket) => setProfileTicket(ticket)}
                onSeeMore={() => setColumnAllModal(col.key)}
              />
            ))}
          </div>
        </div>
      </div>

      {profileTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div ref={profileRef} className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Candidate Profile</h3>
              <button onClick={() => setProfileTicket(null)} className="p-1.5 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200">
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
                <p className="text-sm font-bold text-gray-900">{profileTicket.candidate_info?.name || profileTicket.users.name}</p>
                <p className="text-xs mt-0.5 text-gray-400">{profileTicket.users.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              {profileTicket.candidate_info?.industry && (
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 text-gray-400">Industry</p>
                    <p className="text-xs text-gray-600">{profileTicket.candidate_info.industry}</p>
                  </div>
                </div>
              )}
              {(profileTicket.candidate_info?.experience_level || profileTicket.experience_level) && (
                <div className="flex items-start gap-2.5">
                  <Target className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 text-gray-400">Experience Level</p>
                    <p className="text-xs text-gray-600">{profileTicket.candidate_info?.experience_level || profileTicket.experience_level}</p>
                  </div>
                </div>
              )}
              {profileTicket.candidate_info?.bio && (
                <div className="flex items-start gap-2.5">
                  <User className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 text-gray-400">Bio</p>
                    <p className="text-xs leading-relaxed text-gray-600">{profileTicket.candidate_info.bio}</p>
                  </div>
                </div>
              )}
              {profileTicket.candidate_info?.career_goals && (
                <div className="flex items-start gap-2.5">
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 text-gray-400">Career Goals</p>
                    <p className="text-xs leading-relaxed text-gray-600">{profileTicket.candidate_info.career_goals}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <Mail className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 text-gray-400">Email</p>
                  <p className="text-xs text-gray-600">{profileTicket.candidate_info?.email || profileTicket.users.email}</p>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Schedule Interview</h3>
              <button onClick={() => setShowBookingModal(false)} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 space-y-1.5">
              <RowItem label="Candidate" value={selectedTicket.candidate_info?.name || selectedTicket.users.name} />
              <RowItem label="Role" value={selectedTicket.job_role} />
              <RowItem label="Ticket" value={selectedTicket.ticket_number} mono />
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-500">Interview Date</label>
                <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-all bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-500">Interview Time</label>
                <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-all bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-500">Meeting Link <span className="text-red-500">*</span></label>
                <input type="url" value={meetingLink} onChange={e => { setMeetingLink(e.target.value); if (e.target.value.trim()) setMeetingLinkError(false); }}
                  placeholder="https://meet.google.com/..."
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 focus:outline-none transition-all bg-gray-50 ${meetingLinkError ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-blue-400'}`} />
                {meetingLinkError && <p className="mt-1 text-[11px] text-red-500 font-medium">Meeting link is required</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={confirmBooking} disabled={!bookingDate || !bookingTime || actionLoading === selectedTicket.id}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-40">
                {actionLoading === selectedTicket.id ? 'Booking...' : 'Confirm Booking'}
              </button>
              <button onClick={() => setShowBookingModal(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
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

      {showProfileModal && user && (
        <HRProfileModal
          userId={user.uid}
          userEmail={user.email || ''}
          onClose={() => setShowProfileModal(false)}
          onSaved={(p) => setHrProfile(p)}
        />
      )}

      {showTicketPoolModal && (
        <>
          <TicketPoolModal
            tickets={poolTickets}
            actionLoading={actionLoading}
            onClaim={handleClaim}
            onViewDetail={(ticket) => setDetailTicket(ticket)}
            onClose={() => setShowTicketPoolModal(false)}
          />
          {detailTicket && (
            <TicketDetailModal
              ticket={detailTicket}
              actionLoading={actionLoading}
              onClaim={handleClaim}
              onClose={() => setDetailTicket(null)}
            />
          )}
        </>
      )}

      {columnAllModal && columnAllConfig && (
        <ColumnAllTicketsModal
          config={columnAllConfig}
          tickets={getColumnTickets(columnAllModal)}
          onClose={() => setColumnAllModal(null)}
          onSchedule={columnAllModal === 'claimed' ? openBooking : undefined}
          onMarkDone={columnAllModal === 'scheduled' || columnAllModal === 'completed' ? openFeedback : undefined}
          onViewReport={columnAllModal === 'completed' ? (ticket) => { setColumnAllModal(null); navigate(`/hr-report/${ticket.id}`); } : undefined}
          onViewProfile={(ticket) => { setColumnAllModal(null); setProfileTicket(ticket); }}
        />
      )}
    </div>
  );
}

function RowItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xs font-medium text-gray-700 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

const TICKETS_PER_COLUMN = 3;

function KanbanColumnComponent({
  config, tickets, isDragOver, actionLoading, userId,
  onDragStart, onDragOver, onDragLeave, onDrop,
  onRelease, onSchedule, onMarkDone, onViewReport, onViewProfile, onSeeMore,
}: {
  config: typeof COLUMN_CONFIG[0];
  tickets: MockInterviewRequest[];
  isDragOver: boolean;
  actionLoading: string | null;
  userId?: string;
  onDragStart: (t: MockInterviewRequest) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onRelease: (id: string) => void;
  onSchedule: (t: MockInterviewRequest) => void;
  onMarkDone: (t: MockInterviewRequest) => void;
  onViewReport: (t: MockInterviewRequest) => void;
  onViewProfile: (t: MockInterviewRequest) => void;
  onSeeMore: () => void;
}) {
  const visible = tickets.slice(0, TICKETS_PER_COLUMN);
  const remaining = tickets.length - TICKETS_PER_COLUMN;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 flex flex-col bg-white ${config.border} ${isDragOver ? 'ring-2 ring-blue-400/40 scale-[1.005] shadow-lg' : 'shadow-sm'}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={`flex items-center justify-between px-3 py-2.5 border-b rounded-t-2xl ${config.border} ${config.headerBg}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
          <span className={`text-xs font-bold ${config.headerText}`}>{config.label}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white border ${config.border} ${config.color}`}>{tickets.length}</span>
      </div>

      <div className="p-2 space-y-2">
        {tickets.length === 0 && (
          <div className={`flex flex-col items-center justify-center py-10 text-center transition-opacity ${isDragOver ? 'opacity-100' : 'opacity-40'}`}>
            <Ticket className={`w-6 h-6 mb-2 ${config.color}`} />
            <p className={`text-xs ${config.color}`}>Drop here</p>
          </div>
        )}
        {visible.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            columnKey={config.key}
            actionLoading={actionLoading}
            userId={userId}
            onDragStart={onDragStart}
            onRelease={onRelease}
            onSchedule={onSchedule}
            onMarkDone={onMarkDone}
            onViewReport={onViewReport}
            onViewProfile={onViewProfile}
          />
        ))}
        {remaining > 0 && (
          <button
            onClick={onSeeMore}
            className={`w-full py-2 text-xs font-semibold rounded-xl border transition-colors ${config.headerBg} ${config.border} ${config.headerText} hover:opacity-80`}
          >
            See More ({remaining})
          </button>
        )}
      </div>
    </div>
  );
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

function TicketCard({
  ticket, columnKey, actionLoading, userId,
  onDragStart, onRelease, onSchedule, onMarkDone, onViewReport, onViewProfile,
}: {
  ticket: MockInterviewRequest;
  columnKey: KanbanColumn;
  actionLoading: string | null;
  userId?: string;
  onDragStart: (t: MockInterviewRequest) => void;
  onRelease: (id: string) => void;
  onSchedule: (t: MockInterviewRequest) => void;
  onMarkDone: (t: MockInterviewRequest) => void;
  onViewReport: (t: MockInterviewRequest) => void;
  onViewProfile: (t: MockInterviewRequest) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const candidateName = ticket.candidate_info?.name || ticket.users.name;
  const expColor = EXP_COLORS[ticket.experience_level] || 'text-gray-500 bg-gray-50 border-gray-200';
  const isLoading = actionLoading === ticket.id;

  void userId;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(ticket)}
      className="border border-gray-200 rounded-xl bg-white cursor-grab active:cursor-grabbing transition-all duration-150 hover:border-gray-300 hover:shadow-md"
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-gray-900">{candidateName}</p>
            <p className="text-[10px] mt-0.5 truncate text-gray-400">{ticket.users.email}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onViewProfile(ticket); }}
              title="View candidate profile"
              className="p-1 rounded-lg transition-colors hover:bg-blue-50 text-gray-400 hover:text-blue-500"
            >
              <User className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        <p className="text-[10px] font-mono mb-2 text-gray-400">{ticket.ticket_number}</p>

        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${expColor}`}>
            {ticket.experience_level}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3 h-3 flex-shrink-0 text-gray-400" />
            <span className="text-[11px] truncate text-gray-600">{ticket.job_role}{ticket.company_name ? ` · ${ticket.company_name}` : ''}</span>
          </div>
          {(columnKey === 'scheduled' && ticket.scheduled_date) ? (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 flex-shrink-0 text-gray-400" />
              <span className="text-[11px] text-gray-600">{new Date(ticket.scheduled_date).toLocaleDateString()} · {ticket.scheduled_time}</span>
            </div>
          ) : ticket.preferred_date ? (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 flex-shrink-0 text-gray-400" />
              <span className="text-[11px] text-gray-400">Pref: {new Date(ticket.preferred_date).toLocaleDateString()}</span>
            </div>
          ) : null}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            {ticket.candidate_info?.bio && (
              <p className="text-[11px] leading-relaxed line-clamp-3 text-gray-600">{ticket.candidate_info.bio}</p>
            )}
            {ticket.job_description && (
              <p className="text-[11px] leading-relaxed line-clamp-3 text-gray-400">{ticket.job_description}</p>
            )}
            {ticket.interview_description && (
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 text-gray-400">Interview Notes</p>
                <p className="text-[11px] leading-relaxed line-clamp-3 text-gray-600">{ticket.interview_description}</p>
              </div>
            )}
            {ticket.candidate_info?.resume_url && (
              <a href={ticket.candidate_info.resume_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-400 transition-colors font-medium">
                <Download className="w-3 h-3" /> Resume
              </a>
            )}
            {columnKey === 'scheduled' && ticket.meeting_room_link && (
              <a href={ticket.meeting_room_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-500 transition-colors font-medium">
                <ExternalLink className="w-3 h-3" /> Join Room
              </a>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {columnKey === 'assigned' && ticket.booking_status === 'unclaimed' && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-500 border border-blue-100">
              Assigned
            </span>
          )}
          {columnKey === 'claimed' && (
            <>
              <button onClick={() => onSchedule(ticket)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                Schedule
              </button>
              <button onClick={() => onRelease(ticket.id)} disabled={isLoading}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 transition-colors disabled:opacity-40">
                {isLoading ? '...' : 'Release'}
              </button>
            </>
          )}
          {columnKey === 'scheduled' && (
            <button onClick={() => onMarkDone(ticket)} disabled={isLoading}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-40">
              {isLoading ? '...' : 'Mark Done'}
            </button>
          )}
          {columnKey === 'completed' && (
            <>
              <button onClick={() => onMarkDone(ticket)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-colors">
                {ticket.hr_feedback ? 'Edit Feedback' : 'Add Feedback'}
              </button>
              {ticket.ai_report && (
                <button onClick={() => onViewReport(ticket)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                  View Report
                </button>
              )}
            </>
          )}
          {ticket.hr_feedback && columnKey !== 'completed' && ticket.ai_report && (
            <button onClick={() => onViewReport(ticket)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors">
              <FileText className="w-3 h-3 inline mr-0.5" /> Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FeedbackModal({
  ticket, feedback, aiReport, generatingAI, savingFeedback, feedbackSaved, isFeedbackComplete,
  onFeedbackChange, onGenerateAI, onSave, onClose,
}: {
  ticket: MockInterviewRequest;
  feedback: HRFeedback;
  aiReport: AIReport | null;
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 pb-4 border-b border-gray-200 bg-white rounded-t-2xl">
          <div>
            <h3 className="text-base font-bold text-gray-900">Interview Feedback</h3>
            <p className="text-xs mt-0.5 text-gray-400">{candidateName} · {ticket.job_role}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-500">Interview Description <span className="text-[10px] text-gray-400">(What happened during the interview)</span></label>
            <textarea value={feedback.interview_description || ''} onChange={e => update('interview_description', e.target.value)}
              rows={4} placeholder="Describe the interview session — topics discussed, candidate's demeanor, key moments, overall impression..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all resize-none bg-gray-50" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-gray-400">Overall Rating</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => update('overall_rating', n)}
                  className={`transition-all ${n <= feedback.overall_rating ? 'text-amber-400' : 'text-gray-200 hover:text-amber-300'}`}>
                  <Star className="w-7 h-7 fill-current" />
                </button>
              ))}
              {feedback.overall_rating > 0 && (
                <span className="ml-2 text-sm font-semibold self-center text-gray-600">{feedback.overall_rating}/5</span>
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
                <label className="block text-xs font-medium mb-1.5 text-gray-500">{label}</label>
                <select value={(feedback[field] as string) || ''} onChange={e => update(field, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-all bg-gray-50">
                  <option value="">Select...</option>
                  {RATING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-500">Key Strengths</label>
            <textarea value={feedback.key_strengths} onChange={e => update('key_strengths', e.target.value)}
              rows={3} placeholder="Notable strengths observed during the interview..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all resize-none bg-gray-50" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-500">Areas for Improvement</label>
            <textarea value={feedback.areas_for_improvement} onChange={e => update('areas_for_improvement', e.target.value)}
              rows={3} placeholder="Key development areas observed..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all resize-none bg-gray-50" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-500">Hire Recommendation</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {HIRE_OPTIONS.map(o => {
                const colors: Record<string, string> = {
                  'Strong Hire': 'border-emerald-300 text-emerald-700 bg-emerald-50',
                  'Hire': 'border-blue-300 text-blue-700 bg-blue-50',
                  'Maybe': 'border-amber-300 text-amber-700 bg-amber-50',
                  'No Hire': 'border-red-300 text-red-700 bg-red-50',
                };
                const isSelected = feedback.hire_recommendation === o;
                return (
                  <button key={o} onClick={() => update('hire_recommendation', o)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${isSelected ? colors[o] : 'border-gray-200 text-gray-400 bg-gray-50 hover:border-gray-300 hover:text-gray-600'}`}>
                    {o}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-500">Private Notes (not shared with candidate)</label>
            <textarea value={feedback.private_notes} onChange={e => update('private_notes', e.target.value)}
              rows={2} placeholder="Internal notes for HR team only..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all resize-none bg-gray-50" />
          </div>

          {aiReport && (
            <div className="rounded-xl border border-emerald-200 p-4 space-y-3 bg-emerald-50">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-xs font-semibold text-emerald-700">AI Report Generated</p>
              </div>
              <p className="text-xs leading-relaxed text-emerald-800">{aiReport.executive_summary}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 text-emerald-700 bg-white">
                  {aiReport.hire_recommendation}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 p-5 pt-4 border-t border-gray-200 flex gap-3 flex-wrap bg-white rounded-b-2xl">
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
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${feedbackSaved ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
            {savingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : feedbackSaved ? <CheckCircle className="w-4 h-4" /> : null}
            {feedbackSaved ? 'Saved!' : savingFeedback ? 'Saving...' : isCompleted ? 'Update Feedback' : 'Save & Complete'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
