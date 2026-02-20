import { useState, useEffect, useRef } from 'react';
import { X, User, Linkedin, Briefcase, Camera, CheckCircle, Loader2 } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            displayName: data.displayName || data.name || '',
            bio: data.bio || '',
            hrExperience: data.hrExperience || '',
            expertise: data.expertise || '',
            linkedinUrl: data.linkedinUrl || '',
            avatarUrl: data.avatarUrl || '',
          });
          if (data.avatarUrl) setPreviewUrl(data.avatarUrl);
        }
      } catch {
        // ignore
      } finally {
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

  const handleSave = async () => {
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
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const expertiseTags = profile.expertise
    ? profile.expertise.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 pb-4 border-b border-gray-200 bg-white rounded-t-2xl">
          <div>
            <h3 className="text-base font-bold text-gray-900">HR Profile</h3>
            <p className="text-xs mt-0.5 text-gray-400">{userEmail}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {(profile.displayName || userEmail).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-3 h-3 text-white" />
                </button>
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{uploadProgress}%</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">Profile photo (max 5MB)</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors disabled:opacity-50"
                >
                  {uploading ? `Uploading ${uploadProgress}%...` : 'Change photo'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-500">
                <User className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                Display Name
              </label>
              <input
                type="text"
                value={profile.displayName}
                onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-500">
                <Briefcase className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                Bio
              </label>
              <textarea
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                rows={3}
                placeholder="A short description about yourself and your HR approach..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all resize-none bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-500">
                Years of HR Experience
              </label>
              <input
                type="text"
                value={profile.hrExperience}
                onChange={e => setProfile(p => ({ ...p, hrExperience: e.target.value }))}
                placeholder="e.g. 5 years"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-500">
                Areas of Expertise
                <span className="text-[10px] text-gray-400 ml-1">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={profile.expertise}
                onChange={e => setProfile(p => ({ ...p, expertise: e.target.value }))}
                placeholder="e.g. Technical Interviews, Leadership Hiring, Campus Recruitment"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all bg-gray-50"
              />
              {expertiseTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {expertiseTags.map((tag, i) => (
                    <span key={i} className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-500">
                <Linkedin className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                LinkedIn URL
              </label>
              <input
                type="url"
                value={profile.linkedinUrl}
                onChange={e => setProfile(p => ({ ...p, linkedinUrl: e.target.value }))}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all bg-gray-50"
              />
            </div>
          </div>
        )}

        {!loading && (
          <div className="sticky bottom-0 p-5 pt-4 border-t border-gray-200 flex gap-3 bg-white rounded-b-2xl">
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
