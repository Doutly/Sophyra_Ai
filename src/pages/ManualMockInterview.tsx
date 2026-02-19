import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Briefcase, Clock, FileText, Send, Loader, ArrowLeft, CheckCircle } from 'lucide-react';
import BentoCard from '../components/BentoCard';
import BentoGrid from '../components/BentoGrid';

import { InterviewRequestCard } from '../components/ui/interview-request-card';

export default function ManualMockInterview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    jobRole: '',
    companyName: '',
    experienceLevel: 'fresher' as 'fresher' | 'mid' | 'senior',
    jobDescription: '',
    preferredDate: '',
    preferredTime: '',
    additionalNotes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [candidateName, setCandidateName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Fetch user profile data
      const userDocRef = doc(db, 'users', user!.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};

      const generatedTicketNumber = `MIR-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Create ticket with snake_case fields and candidate info
      await addDoc(collection(db, 'mockInterviewRequests'), {
        user_id: user!.uid,
        job_role: formData.jobRole,
        company_name: formData.companyName,
        experience_level: formData.experienceLevel,
        job_description: formData.jobDescription,
        preferred_date: formData.preferredDate,
        preferred_time: formData.preferredTime,
        additional_notes: formData.additionalNotes,
        ticket_number: generatedTicketNumber,
        status: 'pending',
        booking_status: 'unclaimed',
        assigned_hr_id: null,
        claimed_by: null,
        claimed_at: null,
        scheduled_date: null,
        scheduled_time: null,
        meeting_room_link: null,
        created_at: serverTimestamp(),
        // Include candidate profile information
        candidate_info: {
          name: userData.name || user!.displayName || 'N/A',
          email: userData.email || user!.email || 'N/A',
          bio: userData.bio || '',
          experience_level: userData.experienceLevel || '',
          industry: userData.industry || '',
          career_goals: userData.careerGoals || '',
          resume_url: userData.resumeUrl || null,
        },
      });

      setTicketNumber(generatedTicketNumber);
      setCandidateName(userData.name || user!.displayName || user!.email || 'Candidate');
      setSuccess(true);
    } catch (err: any) {
      console.error('Error submitting request:', err);
      setError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const copyTicketNumber = () => {
    navigator.clipboard.writeText(ticketNumber);
  };

  if (success) {
    const interviewUrl = `${window.location.origin}/interview/${ticketNumber}`;
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-lg mx-auto px-6 py-12">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full mb-4">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Submitted Successfully</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 text-center">Your Request is Under Review</h1>
            <p className="text-sm text-slate-500 text-center mt-1">We'll get back to you within 24–48 hours</p>
          </div>

          <InterviewRequestCard
            candidateName={candidateName}
            jobRole={formData.jobRole}
            companyName={formData.companyName || null}
            ticketNumber={ticketNumber}
            status="pending"
            preferredDate={formData.preferredDate}
            preferredTime={formData.preferredTime}
            interviewUrl={interviewUrl}
          />

          <div className="mt-4 space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-brand-electric text-white text-sm font-semibold rounded-xl hover:bg-brand-electric-dark transition-all"
            >
              Return to Dashboard
            </button>

            <button
              onClick={() => {
                setSuccess(false);
                setFormData({
                  jobRole: '',
                  companyName: '',
                  experienceLevel: 'fresher',
                  jobDescription: '',
                  preferredDate: '',
                  preferredTime: '',
                  additionalNotes: '',
                });
              }}
              className="w-full py-3 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-swiss-base-near">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-600 hover:text-gray-900 mb-6 flex items-center space-x-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Request Mock Interview</h1>
          <p className="text-lg text-gray-600">
            Schedule a personalized mock interview session with our expert interviewers
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <BentoGrid columns={1} gap="md">
            <BentoCard>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Briefcase className="w-5 h-5 text-brand-electric mr-2" />
                Position Details
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Target Job Role *
                  </label>
                  <input
                    type="text"
                    name="jobRole"
                    value={formData.jobRole}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Software Engineer, Data Analyst"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent placeholder-gray-400 transition-all"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g., Google, Microsoft"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent placeholder-gray-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Experience Level *
                    </label>
                    <select
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent transition-all"
                    >
                      <option value="fresher">Fresher (0-2 years)</option>
                      <option value="mid">Mid-Level (2-5 years)</option>
                      <option value="senior">Senior (5+ years)</option>
                    </select>
                  </div>
                </div>
              </div>
            </BentoCard>

            <BentoCard>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="w-5 h-5 text-brand-electric mr-2" />
                Job Description
              </h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  required
                  rows={8}
                  placeholder="Paste the complete job description here..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent placeholder-gray-400 resize-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Include responsibilities, requirements, and qualifications for best results
                </p>
              </div>
            </BentoCard>

            <BentoCard>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Clock className="w-5 h-5 text-brand-electric mr-2" />
                Scheduling Preferences
              </h2>

              <div className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preferred Time *
                    </label>
                    <input
                      type="time"
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Any specific areas you'd like to focus on or additional information..."
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent placeholder-gray-400 resize-none transition-all"
                  />
                </div>
              </div>
            </BentoCard>

            {error && (
              <BentoCard className="border-red-300 bg-red-50">
                <p className="text-red-700 text-sm">{error}</p>
              </BentoCard>
            )}

            <BentoCard>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-brand-electric text-white font-semibold rounded-lg hover:bg-brand-electric-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-swiss-md"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Interview Request</span>
                  </>
                )}
              </button>

              <p className="text-sm text-gray-500 text-center mt-4">
                Our team will review your request and contact you within 24-48 hours
              </p>
            </BentoCard>
          </BentoGrid>
        </form>
      </div>
    </div>
  );
}
