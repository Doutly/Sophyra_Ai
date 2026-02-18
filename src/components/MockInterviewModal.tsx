import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { X, AlertCircle, CheckCircle, Play } from 'lucide-react';
import ResumeUploadParser from './ResumeUploadParser';
import { ParsedResume } from '../lib/resumeParser';

interface MockInterviewModalProps {
  onClose: () => void;
}

export default function MockInterviewModal({ onClose }: MockInterviewModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    jobRole: '',
    experienceLevel: 'fresher',
    industry: '',
    companyName: '',
    jobDescription: '',
  });

  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [consent, setConsent] = useState(true);

  const handleResumeParseComplete = async (parsed: ParsedResume, file: File) => {
    setParsedData(parsed);
    setParsing(false);
    setError('');

    try {
      await addDoc(collection(db, 'resumeData'), {
        userId: user!.uid,
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        skills: parsed.skills,
        experience: parsed.experience,
        education: parsed.education,
        summary: parsed.summary,
        linkedIn: parsed.linkedIn || '',
        github: parsed.github || '',
        website: parsed.website || '',
        fileName: file.name,
        fileSize: file.size,
        createdAt: serverTimestamp(),
      });
    } catch (saveErr) {
      console.error('Failed to save resume:', saveErr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.jobRole.trim()) {
      setError('Please enter a job role');
      return;
    }

    if (!formData.jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    if (!consent) {
      setError('Please accept data usage consent to continue');
      return;
    }

    setLoading(true);

    try {
      let resumeDataId = null;
      if (parsedData) {
        const q = query(
          collection(db, 'resumeData'),
          where('userId', '==', user!.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          resumeDataId = snap.docs[0].id;
        }
      }

      const candidateName =
        user?.displayName || user?.email?.split('@')[0] || 'Candidate';

      const sessionRef = await addDoc(collection(db, 'sessions'), {
        userId: user!.uid,
        candidateName,
        role: formData.jobRole,
        experienceLevel: formData.experienceLevel,
        industry: formData.industry || null,
        company: formData.companyName || null,
        jdText: formData.jobDescription,
        resumeSummary: parsedData?.summary || null,
        resumeDataId: resumeDataId,
        resumeSkills: parsedData?.skills || [],
        resumeExperience: parsedData?.experience || null,
        resumeEducation: parsedData?.education || null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      navigate(`/interview/${sessionRef.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create interview session');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-8 py-5 rounded-t-3xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Start Mock Interview</h2>
            <p className="text-sm text-gray-500 mt-0.5">Fill in the details to personalize your session</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-6">
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Job Role / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.jobRole}
                  onChange={(e) => setFormData((p) => ({ ...p, jobRole: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-electric focus:border-transparent text-sm transition-all outline-none"
                  placeholder="e.g., Product Manager"
                  required
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Experience Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData((p) => ({ ...p, experienceLevel: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-electric focus:border-transparent text-sm transition-all outline-none bg-white"
                  required
                >
                  <option value="fresher">Fresher</option>
                  <option value="1-3">1–3 years</option>
                  <option value="3-6">3–6 years</option>
                  <option value="6+">6+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Industry / Domain
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData((p) => ({ ...p, industry: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-electric focus:border-transparent text-sm transition-all outline-none"
                  placeholder="e.g., Technology"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData((p) => ({ ...p, companyName: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-electric focus:border-transparent text-sm transition-all outline-none"
                  placeholder="e.g., Google"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.jobDescription}
                onChange={(e) => setFormData((p) => ({ ...p, jobDescription: e.target.value }))}
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-electric focus:border-transparent text-sm transition-all outline-none resize-none"
                placeholder="Paste the job description here..."
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                The AI will tailor questions based on this description
              </p>
            </div>

            <div>
              <ResumeUploadParser
                onParseComplete={handleResumeParseComplete}
                onParseStart={() => setParsing(true)}
                onParseError={(err) => { setError(err.message); setParsing(false); }}
                label="Resume (Optional)"
                description="AI extracts your skills and experience automatically"
                maxSize={15 * 1024 * 1024}
                allowedTypes={['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']}
                accept=".pdf,.doc,.docx,.txt"
              />

              {parsedData && !parsing && (
                <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-800 mb-1">Resume parsed successfully</p>
                      {parsedData.skills && parsedData.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {parsedData.skills.slice(0, 8).map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-1">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-brand-electric rounded border-gray-300 focus:ring-brand-electric"
                />
                <span className="text-xs text-gray-500">
                  I agree to allow anonymized performance data to help improve the AI interviewer
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || parsing}
                className="px-7 py-2.5 bg-brand-electric text-white font-semibold rounded-xl hover:bg-brand-electric-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm shadow-md shadow-brand-electric/20"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Session...</span>
                  </>
                ) : parsing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Parsing Resume...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Begin Interview</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
