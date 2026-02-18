import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { LogOut, Ticket, Clock, Calendar, CheckCircle, XCircle, ExternalLink, User, Briefcase, Brain, Download, FileText } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

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

export default function HRDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [assignedToMe, setAssignedToMe] = useState<MockInterviewRequest[]>([]);
  const [unclaimedTickets, setUnclaimedTickets] = useState<MockInterviewRequest[]>([]);
  const [myClaimedTickets, setMyClaimedTickets] = useState<MockInterviewRequest[]>([]);
  const [bookedInterviews, setBookedInterviews] = useState<MockInterviewRequest[]>([]);
  const [completedInterviews, setCompletedInterviews] = useState<MockInterviewRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'assigned' | 'pool' | 'claimed' | 'booked' | 'completed'>('assigned');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MockInterviewRequest | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');

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

      const unsubscribe = onSnapshot(
        requestsRef,
        async (snapshot) => {
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

        // Tickets assigned to me by admin (not claimed yet or already claimed by me)
        const assigned = allRequests.filter(r =>
          r.assigned_hr_id === user?.uid && r.status === 'approved' &&
          (r.booking_status === 'unclaimed' || r.claimed_by === user?.uid)
        );

        // Available pool (no assignment, unclaimed, approved)
        const unclaimed = allRequests.filter(r =>
          !r.assigned_hr_id &&
          r.booking_status === 'unclaimed' &&
          r.status === 'approved'
        );

        // My claimed tickets (claimed by me, not yet booked)
        const myClaimed = allRequests.filter(r =>
          r.booking_status === 'claimed' && r.claimed_by === user?.uid
        );

        // Booked interviews (scheduled by me)
        const booked = allRequests.filter(r =>
          r.booking_status === 'booked' && r.claimed_by === user?.uid
        );

        // Completed interviews (completed by me)
        const completed = allRequests.filter(r =>
          r.booking_status === 'completed' && r.claimed_by === user?.uid
        );

        setAssignedToMe(assigned);
        setUnclaimedTickets(unclaimed);
        setMyClaimedTickets(myClaimed);
        setBookedInterviews(booked);
        setCompletedInterviews(completed);
        setLoading(false);
      },
      (error) => {
        console.error('Error in tickets snapshot:', error);
        setLoading(false);
        alert('Failed to load tickets. Please refresh the page.');
      }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error loading tickets:', error);
      setLoading(false);
    }
  };

  const handleClaimTicket = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      const ticketRef = doc(db, 'mockInterviewRequests', ticketId);
      await updateDoc(ticketRef, {
        claimed_by: user!.uid,
        claimed_at: new Date().toISOString(),
        booking_status: 'claimed',
      });
    } catch (error) {
      console.error('Error claiming ticket:', error);
      alert('Failed to claim ticket. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReleaseTicket = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      const ticketRef = doc(db, 'mockInterviewRequests', ticketId);
      await updateDoc(ticketRef, {
        claimed_by: null,
        claimed_at: null,
        booking_status: 'unclaimed',
      });
    } catch (error) {
      console.error('Error releasing ticket:', error);
      alert('Failed to release ticket. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBookInterview = (ticket: MockInterviewRequest) => {
    setSelectedTicket(ticket);
    setBookingDate(ticket.preferred_date.split('T')[0]);
    setBookingTime(ticket.preferred_time);
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedTicket || !bookingDate || !bookingTime) return;

    setActionLoading(selectedTicket.id);
    try {
      const meetingLink = `https://meet.sophyra.ai/${selectedTicket.ticket_number}`;

      const ticketRef = doc(db, 'mockInterviewRequests', selectedTicket.id);
      await updateDoc(ticketRef, {
        scheduled_date: bookingDate,
        scheduled_time: bookingTime,
        meeting_room_link: meetingLink,
        booking_status: 'booked',
      });

      setShowBookingModal(false);
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error booking interview:', error);
      alert('Failed to book interview. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkCompleted = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      const ticketRef = doc(db, 'mockInterviewRequests', ticketId);
      await updateDoc(ticketRef, {
        booking_status: 'completed',
        status: 'completed',
      });
    } catch (error) {
      console.error('Error marking as completed:', error);
      alert('Failed to mark as completed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const stats = {
    assigned: assignedToMe.length,
    available: unclaimedTickets.length,
    claimed: myClaimedTickets.length,
    booked: bookedInterviews.length,
    completed: completedInterviews.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-electric border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-electric rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">Sophyra AI</span>
                <span className="ml-3 px-3 py-1 bg-brand-electric/10 text-brand-electric text-xs font-semibold rounded-full">
                  HR Dashboard
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Ticket Board</h1>
          <p className="text-gray-600">Claim and manage mock interview requests</p>
        </div>

        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <User className="w-8 h-8 text-purple-500" />
              <span className="text-sm text-gray-500">Assigned</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.assigned}</div>
            <div className="text-sm text-gray-600 mt-1">To Me</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Ticket className="w-8 h-8 text-brand-electric" />
              <span className="text-sm text-gray-500">Available</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.available}</div>
            <div className="text-sm text-gray-600 mt-1">Pool</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-orange-500" />
              <span className="text-sm text-gray-500">Claimed</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.claimed}</div>
            <div className="text-sm text-gray-600 mt-1">To Schedule</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-green-500" />
              <span className="text-sm text-gray-500">Scheduled</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.booked}</div>
            <div className="text-sm text-gray-600 mt-1">Upcoming</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-blue-500" />
              <span className="text-sm text-gray-500">Completed</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.completed}</div>
            <div className="text-sm text-gray-600 mt-1">Total Done</div>
          </div>
        </div>

        <div className="mb-6 flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'assigned'
                ? 'text-brand-electric border-b-2 border-brand-electric'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Assigned to Me</span>
              {stats.assigned > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                  {stats.assigned}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('pool')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'pool'
                ? 'text-brand-electric border-b-2 border-brand-electric'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Ticket className="w-4 h-4" />
              <span>Available Pool</span>
              {stats.available > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-brand-electric-light text-brand-electric text-xs font-bold rounded-full">
                  {stats.available}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('claimed')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'claimed'
                ? 'text-brand-electric border-b-2 border-brand-electric'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>My Claimed</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('booked')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'booked'
                ? 'text-brand-electric border-b-2 border-brand-electric'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Scheduled</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'completed'
                ? 'text-brand-electric border-b-2 border-brand-electric'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Completed</span>
            </div>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          {activeTab === 'assigned' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-purple-500" />
                <span>Tickets Assigned to Me</span>
              </h2>
              <div className="space-y-4">
                {assignedToMe.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No assigned tickets</h3>
                    <p className="text-gray-600">Admin hasn't assigned any tickets to you yet</p>
                  </div>
                ) : (
                  assignedToMe.map((ticket) => (
                    <div key={ticket.id} className="border-2 border-purple-200 rounded-xl p-5 bg-purple-50/30">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">ADMIN ASSIGNED</span>
                            <span className="text-xs text-gray-500 font-mono">{ticket.ticket_number}</span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg">{ticket.candidate_info?.name || ticket.users.name}</h3>
                          <p className="text-sm text-gray-600">{ticket.candidate_info?.email || ticket.users.email}</p>
                        </div>
                        {ticket.booking_status === 'unclaimed' && (
                          <button
                            onClick={() => handleClaimTicket(ticket.id)}
                            disabled={actionLoading === ticket.id}
                            className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                          >
                            Claim & Start
                          </button>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <Briefcase className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">
                            <span className="font-medium">{ticket.job_role}</span>
                            {ticket.company_name && ` at ${ticket.company_name}`}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Experience:</span> {ticket.experience_level}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Preferred: {new Date(ticket.preferred_date).toLocaleDateString()} at {ticket.preferred_time}</span>
                        </div>
                      </div>
                      {ticket.candidate_info && (
                        <details className="mt-3 pt-3 border-t border-gray-200">
                          <summary className="text-sm text-brand-electric font-medium cursor-pointer hover:underline">
                            View Candidate Profile
                          </summary>
                          <div className="mt-3 space-y-2">
                            {ticket.candidate_info.bio && (
                              <p className="text-sm text-gray-700">{ticket.candidate_info.bio}</p>
                            )}
                            {ticket.candidate_info.industry && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Industry:</span> {ticket.candidate_info.industry}
                              </p>
                            )}
                            {ticket.candidate_info.career_goals && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Career Goals:</span> {ticket.candidate_info.career_goals}
                              </p>
                            )}
                            {ticket.candidate_info.resume_url && (
                              <a
                                href={ticket.candidate_info.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-brand-electric hover:underline"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download Resume
                              </a>
                            )}
                            <details className="mt-2">
                              <summary className="text-sm text-gray-700 font-medium cursor-pointer">Job Description</summary>
                              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{ticket.job_description}</p>
                            </details>
                          </div>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'pool' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-brand-electric" />
                <span>Available Ticket Pool</span>
              </h2>
              <div className="space-y-4">
                {unclaimedTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets available</h3>
                    <p className="text-gray-600">Check back later for new interview requests</p>
                  </div>
                ) : (
                  unclaimedTickets.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-xl p-5 hover:border-brand-electric transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-bold text-gray-900">{ticket.candidate_info?.name || ticket.users.name}</h3>
                            <span className="text-xs text-gray-500 font-mono">{ticket.ticket_number}</span>
                          </div>
                          <p className="text-sm text-gray-600">{ticket.candidate_info?.email || ticket.users.email}</p>
                        </div>
                        <button
                          onClick={() => handleClaimTicket(ticket.id)}
                          disabled={actionLoading === ticket.id}
                          className="px-4 py-2 bg-brand-electric text-white text-sm font-medium rounded-lg hover:bg-brand-electric-dark transition-colors disabled:opacity-50"
                        >
                          Claim Ticket
                        </button>
                      </div>
                      <div className="space-y-2 mb-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Role:</span> {ticket.job_role}
                          {ticket.company_name && ` at ${ticket.company_name}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Experience:</span> {ticket.experience_level}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Preferred:</span> {new Date(ticket.preferred_date).toLocaleDateString()} at {ticket.preferred_time}
                        </p>
                      </div>
                      {ticket.candidate_info && (
                        <details className="mt-3 pt-3 border-t border-gray-200">
                          <summary className="text-sm text-brand-electric font-medium cursor-pointer hover:underline">
                            View Full Profile
                          </summary>
                          <div className="mt-3 space-y-2">
                            {ticket.candidate_info.bio && (
                              <p className="text-sm text-gray-700">{ticket.candidate_info.bio}</p>
                            )}
                            {ticket.candidate_info.industry && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Industry:</span> {ticket.candidate_info.industry}
                              </p>
                            )}
                            {ticket.candidate_info.career_goals && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Career Goals:</span> {ticket.candidate_info.career_goals}
                              </p>
                            )}
                            {ticket.candidate_info.resume_url && (
                              <a
                                href={ticket.candidate_info.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-brand-electric hover:underline"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download Resume
                              </a>
                            )}
                            <details className="mt-2">
                              <summary className="text-sm text-gray-700 font-medium cursor-pointer">Job Description</summary>
                              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{ticket.job_description}</p>
                            </details>
                          </div>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'claimed' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span>My Claimed Tickets</span>
              </h2>
              <div className="space-y-4">
                {myClaimedTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No claimed tickets</h3>
                    <p className="text-gray-600">Claim tickets from the pool or assigned section</p>
                  </div>
                ) : (
                  myClaimedTickets.map((ticket) => (
                    <div key={ticket.id} className="border border-orange-200 rounded-xl p-5 bg-orange-50/30">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <span className="text-xs text-gray-500 mb-1 block">Claimed on {new Date(ticket.claimed_at!).toLocaleDateString()}</span>
                          <h3 className="font-bold text-gray-900">{ticket.candidate_info?.name || ticket.users.name}</h3>
                          <p className="text-sm text-gray-600">{ticket.job_role}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 mb-3">
                        <button
                          onClick={() => handleBookInterview(ticket)}
                          className="flex-1 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Schedule Interview</span>
                        </button>
                        <button
                          onClick={() => handleReleaseTicket(ticket.id)}
                          disabled={actionLoading === ticket.id}
                          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                        >
                          Release
                        </button>
                      </div>
                      {ticket.candidate_info && (
                        <details className="mt-3 pt-3 border-t border-gray-200">
                          <summary className="text-sm text-brand-electric font-medium cursor-pointer hover:underline">
                            View Details
                          </summary>
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Email:</span> {ticket.candidate_info.email}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Preferred Time:</span> {new Date(ticket.preferred_date).toLocaleDateString()} at {ticket.preferred_time}
                            </p>
                            {ticket.candidate_info.resume_url && (
                              <a
                                href={ticket.candidate_info.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-brand-electric hover:underline"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download Resume
                              </a>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'booked' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <span>Scheduled Interviews</span>
              </h2>
              <div className="space-y-4">
                {bookedInterviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No scheduled interviews</h3>
                    <p className="text-gray-600">Schedule interviews from your claimed tickets</p>
                  </div>
                ) : (
                  bookedInterviews.map((ticket) => (
                    <div key={ticket.id} className="border-2 border-green-200 bg-green-50/50 rounded-xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{ticket.candidate_info?.name || ticket.users.name}</h3>
                          <p className="text-sm text-gray-600">{ticket.job_role}</p>
                          <span className="text-xs text-gray-500 font-mono">{ticket.ticket_number}</span>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">SCHEDULED</span>
                      </div>
                      <div className="bg-white rounded-lg p-4 mb-3">
                        <div className="flex items-center space-x-3 mb-3">
                          <Calendar className="w-5 h-5 text-brand-electric" />
                          <div>
                            <p className="font-semibold text-gray-900">{new Date(ticket.scheduled_date!).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="text-sm text-gray-600">at {ticket.scheduled_time}</p>
                          </div>
                        </div>
                        <a
                          href={ticket.meeting_room_link!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-brand-electric text-white font-medium rounded-lg hover:bg-brand-electric-dark transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Join Interview Room</span>
                        </a>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleMarkCompleted(ticket.id)}
                          disabled={actionLoading === ticket.id}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark Completed</span>
                        </button>
                      </div>
                      {ticket.candidate_info && (
                        <details className="mt-3 pt-3 border-t border-gray-200">
                          <summary className="text-sm text-brand-electric font-medium cursor-pointer hover:underline">
                            View Candidate Info
                          </summary>
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Email:</span> {ticket.candidate_info.email}
                            </p>
                            {ticket.candidate_info.resume_url && (
                              <a
                                href={ticket.candidate_info.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-brand-electric hover:underline"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download Resume
                              </a>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'completed' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <span>Completed Interviews</span>
              </h2>
              <div className="space-y-4">
                {completedInterviews.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed interviews yet</h3>
                    <p className="text-gray-600">Your completed interviews will appear here</p>
                  </div>
                ) : (
                  completedInterviews.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{ticket.candidate_info?.name || ticket.users.name}</h3>
                          <p className="text-sm text-gray-600">{ticket.job_role}</p>
                          <span className="text-xs text-gray-500 font-mono">{ticket.ticket_number}</span>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">COMPLETED</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Completed on:</span> {ticket.scheduled_date ? new Date(ticket.scheduled_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showBookingModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Book Interview</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Student: <span className="font-medium text-gray-900">{selectedTicket.users.name}</span></p>
              <p className="text-sm text-gray-600 mb-1">Role: <span className="font-medium text-gray-900">{selectedTicket.job_role}</span></p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interview Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interview Time</label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={confirmBooking}
                disabled={!bookingDate || !bookingTime || actionLoading === selectedTicket.id}
                className="flex-1 px-4 py-2 bg-brand-electric text-white font-medium rounded-lg hover:bg-brand-electric-dark transition-colors disabled:opacity-50"
              >
                Confirm Booking
              </button>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedTicket(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
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
