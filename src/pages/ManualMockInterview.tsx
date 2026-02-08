import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Briefcase, Clock, FileText, Send, Loader, ArrowLeft, CheckCircle, Copy, Calendar } from 'lucide-react';
import BentoCard from '../components/BentoCard';
import BentoGrid from '../components/BentoGrid';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const generatedTicketNumber = `MIR-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      await addDoc(collection(db, 'mockInterviewRequests'), {
        userId: user!.uid,
        jobRole: formData.jobRole,
        companyName: formData.companyName,
        experienceLevel: formData.experienceLevel,
        jobDescription: formData.jobDescription,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        additionalNotes: formData.additionalNotes,
        ticketNumber: generatedTicketNumber,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setTicketNumber(generatedTicketNumber);
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
    return (
      <div className="min-h-screen bg-swiss-base-near">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <BentoCard variant="featured" className="text-center animate-scale-in">
            <div className="py-8">
              <div className="w-20 h-20 bg-swiss-status-approved rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse-slow">
                <CheckCircle className="w-12 h-12 text-swiss-status-approved-text" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Request Submitted Successfully!
              </h1>

              <p className="text-gray-600 mb-8">
                Your mock interview request has been received and is now under review
              </p>

              <div className="bg-white border-2 border-brand-electric rounded-lg p-6 mb-8 inline-block">
                <p className="text-sm text-gray-500 mb-2">Your Ticket Number</p>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-brand-electric">{ticketNumber}</span>
                  <button
                    onClick={copyTicketNumber}
                    className="p-2 hover:bg-brand-electric-light rounded-lg transition-colors"
                  >
                    <Copy className="w-5 h-5 text-brand-electric" />
                  </button>
                </div>
              </div>

              <BentoGrid columns={3} gap="sm" className="mb-8">
                <BentoCard className="text-center">
                  <Calendar className="w-8 h-8 text-brand-electric mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Review Time</p>
                  <p className="text-xs text-gray-500">24-48 hours</p>
                </BentoCard>

                <BentoCard className="text-center">
                  <FileText className="w-8 h-8 text-brand-electric mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <p className="text-xs text-gray-500">Pending Review</p>
                </BentoCard>

                <BentoCard className="text-center">
                  <Briefcase className="w-8 h-8 text-brand-electric mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Role</p>
                  <p className="text-xs text-gray-500">{formData.jobRole}</p>
                </BentoCard>
              </BentoGrid>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full px-6 py-3 bg-brand-electric text-white font-semibold rounded-lg hover:bg-brand-electric-dark transition-all"
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
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          </BentoCard>
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
