import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Linkedin, Camera, CheckCircle, Loader2, Star, Briefcase, Clock } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { cn } from '../../lib/utils';

interface HRProfile {
  displayName: string;
  bio: string;
  hrExperience: string;
  expertise: string;
  linkedinUrl: string;
  avatarUrl: string;
}

interface HRProfileModalProps {
  userId: string;
  userEmail: string;
  onClose: () => void;
  onSaved: (profile: HRProfile) => void;
}

interface FormErrors {
  displayName?: string;
  bio?: string;
  hrExperience?: string;
  expertise?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
}

const cardVariants = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.25 } },
};

const contentVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const StatItem = ({
  icon: Icon,
  value,
  label,
}: {
  icon?: React.ElementType;
  value: string | number;
  label: string;
}) => (
  <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
    <div className="flex items-center gap-1">
      {Icon && <Icon className="h-4 w-4 text-slate-400" />}
      <span className="text-base font-semibold text-slate-800">{value}</span>
    </div>
    <span className="text-xs capitalize text-slate-400">{label}</span>
  </div>
);

const Divider = () => <div className="h-10 w-px bg-slate-200" />;

const BANNER_SRC = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=200&fit=crop&q=80';

export default function HRProfileModal({ userId, userEmail, onClose, onSaved }: HRProfileModalProps) {
  const [profile, setProfile] = useState<HRProfile>({
    displayName: '',
    bio: '',
    hrExperience: '',
    expertise: '',
    linkedinUrl: '',
    avatarUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (snap.exists()) {
          const data = snap.data();
          const p: HRProfile = {
            displayName: data.displayName || data.name || '',
            bio: data.bio || '',
            hrExperience: data.hrExperience || '',
            expertise: data.expertise || '',
            linkedinUrl: data.linkedinUrl || '',
            avatarUrl: data.avatarUrl || '',
          };
          setProfile(p);
          if (data.avatarUrl) setPreviewUrl(data.avatarUrl);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);
    setUploadProgress(0);

    try {
      const path = `hr-avatars/${userId}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          },
          (err) => reject(err),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setProfile(p => ({ ...p, avatarUrl: url }));
            setPreviewUrl(url);
            setErrors(prev => ({ ...prev, avatarUrl: undefined }));
            resolve();
          }
        );
      });
    } catch {
      setPreviewUrl(profile.avatarUrl);
    } finally {
      setUploading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!profile.displayName.trim()) newErrors.displayName = 'Display name is required';
    if (!profile.bio.trim()) newErrors.bio = 'Bio is required';
    if (!profile.hrExperience.trim()) newErrors.hrExperience = 'Years of experience is required';
    if (!profile.expertise.trim()) newErrors.expertise = 'Areas of expertise is required';
    if (!profile.linkedinUrl.trim()) newErrors.linkedinUrl = 'LinkedIn URL is required';
    if (!profile.avatarUrl && !previewUrl) newErrors.avatarUrl = 'Profile photo is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        displayName: profile.displayName,
        bio: profile.bio,
        hrExperience: profile.hrExperience,
        expertise: profile.expertise,
        linkedinUrl: profile.linkedinUrl,
        avatarUrl: profile.avatarUrl,
      });
      setSaved(true);
      onSaved(profile);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const updateField = <K extends keyof HRProfile>(field: K, value: HRProfile[K]) => {
    setProfile(p => ({ ...p, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const expertiseTags = profile.expertise
    ? profile.expertise.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const avatarName = profile.displayName
    ? profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (userEmail?.charAt(0) || 'HR').toUpperCase();

  const experienceYears = profile.hrExperience
    ? profile.hrExperience.replace(/[^0-9]/g, '') || '—'
    : '—';

  const expertiseCount = expertiseTags.length || 0;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <AnimatePresence>
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100"
          onClick={e => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white rounded-t-2xl">
            <div>
              <h3 className="text-base font-bold text-slate-900">HR Profile</h3>
              <p className="text-xs mt-0.5 text-slate-400">{userEmail}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : (
            <motion.div variants={contentVariants} initial="initial" animate="animate">
              <motion.div variants={itemVariants} className="relative">
                <div className="h-32 w-full overflow-hidden">
                  <img
                    src={BANNER_SRC}
                    alt="Profile banner"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 h-32 bg-gradient-to-b from-transparent to-black/20" />
                </div>

                <div className="absolute left-1/2 top-32 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                      <AvatarImage src={previewUrl} alt={profile.displayName || 'HR'} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-bold text-xl">
                        {avatarName}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-50 shadow-md border-2 border-white"
                    >
                      {uploading ? (
                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                      ) : (
                        <Camera className="w-3 h-3 text-white" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="px-6 pb-2 pt-14 text-center">
                {errors.avatarUrl && (
                  <p className="text-[11px] text-red-500 font-medium mb-2">{errors.avatarUrl}</p>
                )}
                {uploading && (
                  <p className="text-[11px] text-blue-500 font-medium mb-1">Uploading {uploadProgress}%...</p>
                )}
                <h2 className="text-xl font-bold text-slate-900">
                  {profile.displayName || 'Your Name'}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">HR Professional</p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="mx-6 my-4 flex items-center justify-around rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <StatItem icon={Clock} value={`${experienceYears}yr`} label="experience" />
                <Divider />
                <StatItem icon={Star} value={expertiseCount} label="expertise areas" />
                <Divider />
                <StatItem icon={Briefcase} value="HR" label="role" />
              </motion.div>

              <div className="px-6 pb-6 space-y-4">
                <motion.div variants={itemVariants}>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-500 uppercase tracking-wider">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.displayName}
                    onChange={e => updateField('displayName', e.target.value)}
                    placeholder="Your full name"
                    className={cn(
                      'w-full px-3.5 py-2.5 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all bg-slate-50',
                      errors.displayName ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-400'
                    )}
                  />
                  {errors.displayName && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.displayName}</p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-500 uppercase tracking-wider">
                    Bio <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={e => updateField('bio', e.target.value)}
                    rows={3}
                    placeholder="A short description about yourself and your HR approach..."
                    className={cn(
                      'w-full px-3.5 py-2.5 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all resize-none bg-slate-50',
                      errors.bio ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-400'
                    )}
                  />
                  {errors.bio && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.bio}</p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-500 uppercase tracking-wider">
                    Years of HR Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.hrExperience}
                    onChange={e => updateField('hrExperience', e.target.value)}
                    placeholder="e.g. 5 years"
                    className={cn(
                      'w-full px-3.5 py-2.5 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all bg-slate-50',
                      errors.hrExperience ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-400'
                    )}
                  />
                  {errors.hrExperience && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.hrExperience}</p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-500 uppercase tracking-wider">
                    Areas of Expertise <span className="text-red-500">*</span>
                    <span className="text-[10px] text-slate-400 normal-case ml-1 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={profile.expertise}
                    onChange={e => updateField('expertise', e.target.value)}
                    placeholder="e.g. Technical Interviews, Leadership Hiring, Campus Recruitment"
                    className={cn(
                      'w-full px-3.5 py-2.5 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all bg-slate-50',
                      errors.expertise ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-400'
                    )}
                  />
                  {errors.expertise && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.expertise}</p>
                  )}
                  {expertiseTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {expertiseTags.map((tag, i) => (
                        <span key={i} className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-500 uppercase tracking-wider">
                    <Linkedin className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                    LinkedIn URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={profile.linkedinUrl}
                    onChange={e => updateField('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className={cn(
                      'w-full px-3.5 py-2.5 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all bg-slate-50',
                      errors.linkedinUrl ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-blue-400'
                    )}
                  />
                  {errors.linkedinUrl && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.linkedinUrl}</p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all disabled:opacity-40',
                      saved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-500/20'
                    )}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : null}
                    {saved ? 'Profile Saved!' : saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
