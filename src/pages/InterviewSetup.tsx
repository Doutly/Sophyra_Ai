import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Brain, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

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

  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
    }
  }, [user, navigate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('File size must be less than 15MB');
      return;
    }

    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      setError('Only PDF and DOC/DOCX files are allowed');
      return;
    }

    setFormData(prev => ({ ...prev, resumeFile: file }));
    setError('');

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('interview-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('interview-assets')
        .getPublicUrl(filePath);

      setResumeUrl(publicUrl);

      setParsing(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();

        const parseFormData = new FormData();
        parseFormData.append('file', file);

        const parseResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-resume`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: parseFormData,
          }
        );

        if (parseResponse.ok) {
          const parseResult = await parseResponse.json();
          if (parseResult.success && parseResult.data) {
            setParsedData(parseResult.data);

            setFormData(prev => ({
              ...prev,
              jobRole: parseResult.data.name ? prev.jobRole || '' : prev.jobRole,
            }));
          }
        }
      } catch (parseErr) {
        console.error('Resume parsing failed:', parseErr);
      } finally {
        setParsing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
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
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user!.id,
          role: formData.jobRole,
          experience_level: formData.experienceLevel,
          industry: formData.industry || null,
          company: formData.companyName || null,
          jd_text: formData.jobDescription,
          resume_summary: resumeUrl || null,
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
              <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Paste the complete job description here..."
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                The AI will use this to generate relevant questions
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Resume Upload
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  {uploading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  ) : formData.resumeFile ? (
                    <div className="flex items-center justify-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">{formData.resumeFile.name}</p>
                        <p className="text-sm text-gray-600">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-700 font-medium mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF or DOC/DOCX (max 15MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {parsing && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-blue-700">Parsing resume with AI...</p>
                  </div>
                </div>
              )}

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
                    className="mt-1 w-5 h-5 text-teal-500 rounded border-gray-300 focus:ring-teal-500"
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
                    className="mt-1 w-5 h-5 text-teal-500 rounded border-gray-300 focus:ring-teal-500"
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
                    className="mt-1 w-5 h-5 text-teal-500 rounded border-gray-300 focus:ring-teal-500"
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
                disabled={loading || uploading}
                className="px-8 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Session...</span>
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
