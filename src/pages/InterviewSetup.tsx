import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AlertCircle, FileText, CheckCircle } from 'lucide-react';
import ResumeUploadParser from '../components/ResumeUploadParser';
import { ParsedResume } from '../lib/resumeParser';

export default function InterviewSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    jobRole: '',
    experienceLevel: 'fresher',
    industry: '',
    companyName: '',
    jobDescription: '',
    resumeFile: null as File | null,
  });

  const [consent, setConsent] = useState({
    voiceAnalysis: true,
    bodyLanguage: true,
    dataUsage: true,
  });

  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
    }
  }, [user, navigate]);

  const handleResumeParseComplete = async (parsed: ParsedResume, file: File) => {
    setFormData(prev => ({ ...prev, resumeFile: file }));
    setParsedData(parsed);
    setError('');

    try {
      const { error: saveError } = await supabase
        .from('resume_data')
        .insert({
          user_id: user!.id,
          name: parsed.name,
          email: parsed.email,
          phone: parsed.phone,
          skills: parsed.skills,
          experience: parsed.experience,
          education: parsed.education,
          summary: parsed.summary,
          linked_in: parsed.linkedIn || '',
          github: parsed.github || '',
          website: parsed.website || '',
          file_name: file.name,
          file_size: file.size,
        });

      if (saveError) {
        console.error('Failed to save resume data:', saveError);
      }
    } catch (saveErr: any) {
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

    if (!consent.dataUsage) {
      setError('Please accept the data usage consent to continue');
      return;
    }

    setLoading(true);

    try {
      let resumeDataId = null;
      if (parsedData) {
        const { data: resumeRecord } = await supabase
          .from('resume_data')
          .select('id')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        resumeDataId = resumeRecord?.id || null;
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user!.id,
          role: formData.jobRole,
          experience_level: formData.experienceLevel,
          industry: formData.industry || null,
          company: formData.companyName || null,
          jd_text: formData.jobDescription,
          resume_summary: parsedData?.summary || null,
          resume_data_id: resumeDataId,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      navigate(`/interview/${sessionData.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create interview session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-electric rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Sophyra AI</span>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Start Mock Interview</h1>
          <p className="text-lg text-gray-600">
            Provide details about the role you're preparing for
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Role / Title *
                </label>
                <input
                  type="text"
                  value={formData.jobRole}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobRole: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent"
                  placeholder="e.g., Product Manager"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Experience Level *
                </label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent"
                  required
                >
                  <option value="fresher">Fresher</option>
                  <option value="1-3">1-3 years</option>
                  <option value="3-6">3-6 years</option>
                  <option value="6+">6+ years</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Industry / Domain
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent"
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent"
                  placeholder="e.g., Google, Microsoft"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                value={formData.jobDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-electric focus:border-transparent"
                placeholder="Paste the complete job description here..."
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                The AI will use this to generate relevant questions
              </p>
            </div>

            <div>
              <ResumeUploadParser
                onParseComplete={handleResumeParseComplete}
                onParseStart={() => setParsing(true)}
                onParseError={(err) => setError(err.message)}
                label="Resume Upload (Optional)"
                description="AI will extract your details instantly"
                maxSize={15 * 1024 * 1024}
                allowedTypes={['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']}
                accept=".pdf,.doc,.docx,.txt"
              />

              {parsedData && !parsing && (
                <div className="mt-4 p-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-2">Resume Parsed Successfully</h4>
                      <div className="space-y-2 text-sm">
                        {parsedData.name && (
                          <p><span className="font-medium text-green-800">Name:</span> <span className="text-green-700">{parsedData.name}</span></p>
                        )}
                        {parsedData.email && (
                          <p><span className="font-medium text-green-800">Email:</span> <span className="text-green-700">{parsedData.email}</span></p>
                        )}
                        {parsedData.phone && (
                          <p><span className="font-medium text-green-800">Phone:</span> <span className="text-green-700">{parsedData.phone}</span></p>
                        )}
                        {parsedData.skills && parsedData.skills.length > 0 && (
                          <div>
                            <span className="font-medium text-green-800">Skills:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {parsedData.skills.slice(0, 10).map((skill: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {parsedData.education && (
                          <p><span className="font-medium text-green-800">Education:</span> <span className="text-green-700">{parsedData.education}</span></p>
                        )}
                        {parsedData.experience && (
                          <p><span className="font-medium text-green-800">Experience:</span> <span className="text-green-700">{parsedData.experience}</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Consent & Preferences</h3>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.voiceAnalysis}
                    onChange={(e) => setConsent(prev => ({ ...prev, voiceAnalysis: e.target.checked }))}
                    className="mt-1 w-5 h-5 text-brand-electric rounded border-gray-300 focus:ring-brand-electric"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Allow AI voice analysis</p>
                    <p className="text-sm text-gray-600">
                      Analyze speaking pace, clarity, and filler words
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.bodyLanguage}
                    onChange={(e) => setConsent(prev => ({ ...prev, bodyLanguage: e.target.checked }))}
                    className="mt-1 w-5 h-5 text-brand-electric rounded border-gray-300 focus:ring-brand-electric"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Allow AI body language analysis</p>
                    <p className="text-sm text-gray-600">
                      Track eye contact, attention, and posture
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.dataUsage}
                    onChange={(e) => setConsent(prev => ({ ...prev, dataUsage: e.target.checked }))}
                    className="mt-1 w-5 h-5 text-brand-electric rounded border-gray-300 focus:ring-brand-electric"
                    required
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      Allow anonymized performance data for improvement *
                    </p>
                    <p className="text-sm text-gray-600">
                      Help us improve the AI by sharing anonymized session data
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 text-gray-700 font-medium hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || parsing}
                className="px-8 py-3 bg-brand-electric text-white font-semibold rounded-lg hover:bg-brand-electric-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Session...</span>
                  </>
                ) : parsing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Parsing Resume...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
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
