import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { fileUploader } from '../lib/fileUpload';
import { Mail, Briefcase, Target, Upload, Save, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { ProfileCard } from '../components/ui/profile-card';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    experienceLevel: '',
    industry: '',
    careerGoals: '',
  });

  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [interviewCount, setInterviewCount] = useState(0);
  const [avgScore, setAvgScore] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
      return;
    }
    loadProfile();
    loadStats();
  }, [user, navigate]);

  const loadProfile = async (retryCount = 0) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFormData({
          name: data.name || '',
          email: data.email || user.email || '',
          bio: data.bio || '',
          experienceLevel: data.experienceLevel || '',
          industry: data.industry || '',
          careerGoals: data.careerGoals || '',
        });
        setResumeUrl(data.resumeUrl || null);
      } else {
        setFormData({
          name: user.displayName || '',
          email: user.email || '',
          bio: '',
          experienceLevel: '',
          industry: '',
          careerGoals: '',
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      if (retryCount < 3) {
        setTimeout(() => loadProfile(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        setFormData({
          name: user.displayName || '',
          email: user.email || '',
          bio: '',
          experienceLevel: '',
          industry: '',
          careerGoals: '',
        });
        setLoading(false);
      }
    }
  };

  const loadStats = async () => {
    if (!user) return;
    try {
      const sessionsQuery = query(collection(db, 'sessions'), where('userId', '==', user.uid));
      const sessionsSnap = await getDocs(sessionsQuery);
      const sessionIds = sessionsSnap.docs.map((d) => d.id);
      if (sessionIds.length > 0) {
        const reportsQuery = query(
          collection(db, 'reports'),
          where('sessionId', 'in', sessionIds.slice(0, 10))
        );
        const reportsSnap = await getDocs(reportsQuery);
        setInterviewCount(reportsSnap.docs.length);
        if (reportsSnap.docs.length > 0) {
          const total = reportsSnap.docs.reduce((sum, d) => sum + (d.data().overallScore || 0), 0);
          setAvgScore(Math.round(total / reportsSnap.docs.length));
        }
      }
    } catch (e) {
      console.error('Error loading stats:', e);
    }
  };

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

    setError('');
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.uid}-resume.${fileExt}`;
      const filePath = `resumes/${user?.uid}/${fileName}`;
      const downloadURL = await fileUploader.uploadWithProgress(file, filePath);
      setResumeUrl(downloadURL);
      setSuccess('Resume uploaded successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', user!.uid);
      await updateDoc(userDocRef, {
        name: formData.name,
        bio: formData.bio,
        experienceLevel: formData.experienceLevel,
        industry: formData.industry,
        careerGoals: formData.careerGoals,
        resumeUrl: resumeUrl,
        updatedAt: Timestamp.now(),
      });
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-electric border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  const displayName = formData.name || user?.displayName || user?.email?.split('@')[0] || '';
  const jobTitle = formData.industry
    ? `${formData.experienceLevel ? formData.experienceLevel + ' · ' : ''}${formData.industry}`
    : formData.experienceLevel || 'Interview Candidate';

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/Adobe_Express_-_file.png" alt="Sophyra AI" className="w-8 h-8 rounded-lg" style={{mixBlendMode: 'darken'}} />
              <span className="text-[15px] font-bold text-slate-900 tracking-tight">Sophyra AI</span>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Profile Settings</h1>
          <p className="text-slate-500 text-sm">Manage your account information and preferences</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-5">
            <ProfileCard
              name={displayName}
              title={jobTitle}
              interviewCount={interviewCount}
              avgScore={avgScore}
              experienceLevel={formData.experienceLevel}
              onEditProfile={() => {
                document.getElementById('profile-form-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              bannerSrc="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&q=80&fit=crop"
            />

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Account Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                  <span className="text-xs text-slate-500">Member Since</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {new Date(user?.metadata.creationTime || '').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                  <span className="text-xs text-slate-500">Email</span>
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-slate-500">Account Status</span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold rounded-full">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div id="profile-form-section" className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100">
              <h2 className="text-base font-bold text-slate-900 mb-6">Personal Information</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-electric focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Experience Level
                    </label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-electric focus:border-transparent bg-white text-slate-900"
                    >
                      <option value="">Select level</option>
                      <option value="Entry">Entry Level</option>
                      <option value="Junior">Junior</option>
                      <option value="Mid">Mid Level</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead">Lead / Manager</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Industry / Role
                    </label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-electric focus:border-transparent bg-white text-slate-900 placeholder-slate-400"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-electric focus:border-transparent bg-white text-slate-900 placeholder-slate-400 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    Career Goals
                  </label>
                  <textarea
                    value={formData.careerGoals}
                    onChange={(e) => setFormData(prev => ({ ...prev, careerGoals: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-electric focus:border-transparent bg-white text-slate-900 placeholder-slate-400 resize-none"
                    placeholder="What are your career aspirations?"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100">
              <h2 className="text-base font-bold text-slate-900 mb-5">Resume</h2>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-brand-electric transition-colors bg-slate-50/50">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  id="resume-upload-profile"
                  disabled={uploading}
                />
                <label htmlFor="resume-upload-profile" className="cursor-pointer">
                  {uploading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-brand-electric border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-slate-600 font-medium">Uploading...</span>
                    </div>
                  ) : resumeUrl ? (
                    <div>
                      <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-7 h-7 text-brand-electric" />
                      </div>
                      <p className="font-semibold text-slate-800 text-sm mb-1">Resume uploaded</p>
                      <p className="text-xs text-slate-500 mb-3">Click to replace</p>
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-electric hover:underline font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View current resume
                      </a>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-700 font-semibold text-sm mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-400">PDF or DOC/DOCX (max 15MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-brand-electric-dark rounded-2xl p-6 text-white shadow-lg shadow-blue-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base mb-1">Save Changes</h3>
                  <p className="text-sm text-white/60">Update your profile information</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-white text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-100 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
