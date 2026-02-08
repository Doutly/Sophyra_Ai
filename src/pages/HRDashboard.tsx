import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { LogOut, Ticket, Clock, Calendar, CheckCircle, XCircle, ExternalLink, User, Briefcase } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

interface MockInterviewRequest {
  id: string;
  ticket_number: string;
  user_id: string;
  job_role: string;
  company_name: string | null;
  experience_level: string;
  job_description: string;
  status: string;
  booking_status: string;
  preferred_date: string;
  preferred_time: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  meeting_room_link: string | null;
  created_at: string;
  users: {
    name: string;
    email: string;
  };
}

export default function HRDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [unclaimedTickets, setUnclaimedTickets] = useState<MockInterviewRequest[]>([]);
  const [myClaimedTickets, setMyClaimedTickets] = useState<MockInterviewRequest[]>([]);
  const [bookedInterviews, setBookedInterviews] = useState<MockInterviewRequest[]>([]);
  const [completedInterviews, setCompletedInterviews] = useState<MockInterviewRequest[]>([]);
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
      setUnclaimedTickets([]);
      setMyClaimedTickets([]);
      setBookedInterviews([]);
      setCompletedInterviews([]);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTicket = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      const { error } = await supabase
        .from('mock_interview_requests')
        .update({
          claimed_by: user!.id,
          claimed_at: new Date().toISOString(),
          booking_status: 'claimed',
        })
        .eq('id', ticketId)
        .eq('booking_status', 'unclaimed')
        .is('claimed_by', null);

      if (!error) {
        await loadTickets();
      }
    } catch (error) {
      console.error('Error claiming ticket:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReleaseTicket = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      const { error } = await supabase
        .from('mock_interview_requests')
        .update({
          claimed_by: null,
          claimed_at: null,
          booking_status: 'unclaimed',
        })
        .eq('id', ticketId)
        .eq('claimed_by', user!.id);

      if (!error) {
        await loadTickets();
      }
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
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedTicket || !bookingDate || !bookingTime) return;

    setActionLoading(selectedTicket.id);
    try {
      const meetingLink = `https://meet.sophyra.ai/${selectedTicket.ticket_number}`;

      const { error } = await supabase
        .from('mock_interview_requests')
        .update({
          scheduled_date: bookingDate,
          scheduled_time: bookingTime,
          meeting_room_link: meetingLink,
          booking_status: 'booked',
        })
        .eq('id', selectedTicket.id);

      if (!error) {
        setShowBookingModal(false);
        setSelectedTicket(null);
        await loadTickets();
      }
    } catch (error) {
      console.error('Error booking interview:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkCompleted = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      const { error } = await supabase
        .from('mock_interview_requests')
        .update({
          booking_status: 'completed',
          status: 'completed',
        })
        .eq('id', ticketId);

      if (!error) {
        await loadTickets();
      }
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

  const stats = {
    total: myClaimedTickets.length + bookedInterviews.length + completedInterviews.length,
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

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Ticket className="w-8 h-8 text-brand-electric" />
              <span className="text-sm text-gray-500">Available</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{unclaimedTickets.length}</div>
            <div className="text-sm text-gray-600 mt-1">Unclaimed</div>
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
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">All Time</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-brand-electric" />
                <span>Unclaimed Tickets</span>
                <span className="ml-auto px-2 py-1 bg-brand-electric/10 text-brand-electric text-xs font-bold rounded-full">
                  {unclaimedTickets.length}
                </span>
              </h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {unclaimedTickets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">No unclaimed tickets available</p>
                  </div>
                ) : (
                  unclaimedTickets.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:border-brand-electric transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">{ticket.users.name}</span>
                          </div>
                          <p className="text-xs text-gray-500 font-mono">{ticket.ticket_number}</p>
                        </div>
                        <button
                          onClick={() => handleClaimTicket(ticket.id)}
                          disabled={actionLoading === ticket.id}
                          className="px-3 py-1 bg-brand-electric text-white text-sm font-medium rounded-lg hover:bg-brand-electric-dark transition-colors disabled:opacity-50"
                        >
                          Claim
                        </button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Role:</span> {ticket.job_role}
                          {ticket.company_name && ` at ${ticket.company_name}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Exp:</span> {ticket.experience_level}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Preferred:</span> {new Date(ticket.preferred_date).toLocaleDateString()} at {ticket.preferred_time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <span>Completed</span>
              </h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {completedInterviews.length === 0 ? (
                  <p className="text-center py-4 text-gray-500 text-sm">No completed interviews yet</p>
                ) : (
                  completedInterviews.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{ticket.users.name}</p>
                          <p className="text-xs text-gray-600">{ticket.job_role}</p>
                        </div>
                        <span className="text-xs text-gray-500">{new Date(ticket.scheduled_date!).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span>My Claimed Tickets</span>
              </h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {myClaimedTickets.length === 0 ? (
                  <p className="text-center py-4 text-gray-500 text-sm">No claimed tickets</p>
                ) : (
                  myClaimedTickets.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{ticket.users.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{ticket.ticket_number}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          Claimed {new Date(ticket.claimed_at!).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{ticket.job_role}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBookInterview(ticket)}
                          className="flex-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Book Interview
                        </button>
                        <button
                          onClick={() => handleReleaseTicket(ticket.id)}
                          disabled={actionLoading === ticket.id}
                          className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          Release
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <span>Booked Interviews</span>
              </h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {bookedInterviews.length === 0 ? (
                  <p className="text-center py-4 text-gray-500 text-sm">No upcoming interviews</p>
                ) : (
                  bookedInterviews.map((ticket) => (
                    <div key={ticket.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{ticket.users.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{ticket.ticket_number}</p>
                        </div>
                        <StatusBadge status="booked" size="sm" />
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{ticket.job_role}</p>
                      <div className="bg-white rounded p-3 mb-3">
                        <div className="flex items-center space-x-2 text-sm mb-2">
                          <Calendar className="w-4 h-4 text-brand-electric" />
                          <span className="font-medium">{new Date(ticket.scheduled_date!).toLocaleDateString()}</span>
                          <span className="text-gray-500">at</span>
                          <span className="font-medium">{ticket.scheduled_time}</span>
                        </div>
                        <a
                          href={ticket.meeting_room_link!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-brand-electric hover:text-brand-electric-dark"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="font-medium">Join Meeting</span>
                        </a>
                      </div>
                      <button
                        onClick={() => handleMarkCompleted(ticket.id)}
                        disabled={actionLoading === ticket.id}
                        className="w-full px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
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
