import { useEffect, useState } from 'react';
import { db, functions } from '../../lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { CheckCircle, XCircle, X, Linkedin, ExternalLink } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface HRUser {
  id: string;
  name: string;
  email: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  approvedAt: string | null;
  bio?: string;
  linkedinUrl?: string;
  yearsOfExperience?: number;
  expertiseAreas?: string[];
  photoUrl?: string;
}

function SkeletonCard() {
  return <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />;
}

export default function HRSection() {
  const [hrUsers, setHrUsers] = useState<HRUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HRUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [slideOver, setSlideOver] = useState<HRUser | null>(null);
  const [tab, setTab] = useState<'pending' | 'active' | 'all'>('pending');

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'hr'));
    const unsub = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(d => {
        const ud = d.data();
        const hrProfile = ud.hrProfile || {};
        return {
          id: d.id,
          name: ud.name || '',
          email: ud.email || '',
          isApproved: ud.isApproved === true,
          isActive: ud.isActive !== false,
          createdAt: ud.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          approvedAt: ud.approvedAt?.toDate?.()?.toISOString() || null,
          bio: hrProfile.bio || ud.bio || '',
          linkedinUrl: hrProfile.linkedinUrl || '',
          yearsOfExperience: hrProfile.yearsOfExperience || 0,
          expertiseAreas: hrProfile.expertiseAreas || [],
          photoUrl: hrProfile.photoUrl || ud.avatarUrl || '',
        };
      });
      setHrUsers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApproval = async (id: string, approve: boolean) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, 'users', id), {
        isApproved: approve,
        approvedAt: approve ? Timestamp.now() : null,
        updatedAt: Timestamp.now(),
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (hr: HRUser) => {
    setActionLoading(hr.id);
    try {
      await updateDoc(doc(db, 'users', hr.id), { isActive: !hr.isActive, updatedAt: Timestamp.now() });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const deleteUser = httpsCallable(functions, 'deleteUser');
      await deleteUser({ uid: deleteTarget.id });
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const pending = hrUsers.filter(h => !h.isApproved && h.isActive);
  const active = hrUsers.filter(h => h.isApproved && h.isActive);
  const visibleList = tab === 'pending' ? pending : tab === 'active' ? active : hrUsers;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">HR Professionals</h1>
        <p className="text-sm text-slate-500 mt-0.5">{hrUsers.length} total · {pending.length} pending approval · {active.length} active</p>
      </div>

      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-amber-800 mb-3">{pending.length} Pending Approval{pending.length > 1 ? 's' : ''}</h2>
          <div className="space-y-3">
            {pending.map(hr => (
              <div key={hr.id} className="bg-white border border-amber-100 rounded-xl p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{hr.name}</p>
                  <p className="text-xs text-slate-500">{hr.email}</p>
                  {hr.expertiseAreas && hr.expertiseAreas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {hr.expertiseAreas.slice(0, 3).map(a => (
                        <span key={a} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{a}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">Applied {new Date(hr.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setSlideOver(hr)} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all">View</button>
                  <button onClick={() => handleApproval(hr.id, true)} disabled={actionLoading === hr.id} className="px-3 py-1.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all disabled:opacity-50 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />Approve
                  </button>
                  <button onClick={() => handleApproval(hr.id, false)} disabled={actionLoading === hr.id} className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex gap-1">
          {([['pending', `Pending (${pending.length})`], ['active', `Active (${active.length})`], ['all', `All (${hrUsers.length})`]] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Name</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Email</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Experience</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Joined</th>
                <th className="text-center py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(j => <td key={j} className="py-3 px-4"><div className="h-3 bg-slate-100 rounded" /></td>)}
                  </tr>
                ))
              ) : visibleList.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">No HR professionals in this view</td></tr>
              ) : (
                visibleList.map(hr => (
                  <tr key={hr.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-slate-800">{hr.name}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{hr.email}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{hr.yearsOfExperience ? `${hr.yearsOfExperience} yrs` : '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{new Date(hr.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        hr.isApproved && hr.isActive ? 'bg-emerald-50 text-emerald-700' :
                        !hr.isApproved && hr.isActive ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {hr.isApproved && hr.isActive ? 'Active' : !hr.isApproved && hr.isActive ? 'Pending' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setSlideOver(hr)} className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all">View</button>
                        {hr.isApproved ? (
                          <button onClick={() => handleApproval(hr.id, false)} disabled={actionLoading === hr.id} className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-all disabled:opacity-50">Revoke</button>
                        ) : (
                          <button onClick={() => handleApproval(hr.id, true)} disabled={actionLoading === hr.id} className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all disabled:opacity-50">Approve</button>
                        )}
                        <button onClick={() => handleToggleActive(hr)} disabled={actionLoading === hr.id} className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 ${hr.isActive ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                          {hr.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => setDeleteTarget(hr)} className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {slideOver && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setSlideOver(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-slate-900">HR Profile</h2>
              <button onClick={() => setSlideOver(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-xl font-bold text-slate-400 overflow-hidden">
                  {slideOver.photoUrl ? <img src={slideOver.photoUrl} alt="" className="w-full h-full object-cover" /> : slideOver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">{slideOver.name}</p>
                  <p className="text-sm text-slate-500">{slideOver.email}</p>
                  {slideOver.linkedinUrl && (
                    <a href={slideOver.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-1 text-xs text-blue-600 hover:underline">
                      <Linkedin className="w-3 h-3" />LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 mb-0.5">Experience</p>
                  <p className="text-sm font-bold text-slate-800">{slideOver.yearsOfExperience ? `${slideOver.yearsOfExperience} years` : '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 mb-0.5">Status</p>
                  <p className={`text-sm font-bold ${slideOver.isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>{slideOver.isApproved ? 'Approved' : 'Pending'}</p>
                </div>
              </div>

              {slideOver.bio && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Bio</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{slideOver.bio}</p>
                </div>
              )}

              {slideOver.expertiseAreas && slideOver.expertiseAreas.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Expertise Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {slideOver.expertiseAreas.map(a => (
                      <span key={a} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {!slideOver.isApproved ? (
                  <button onClick={() => { handleApproval(slideOver.id, true); setSlideOver(null); }} className="flex-1 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all">
                    Approve
                  </button>
                ) : (
                  <button onClick={() => { handleApproval(slideOver.id, false); setSlideOver(null); }} className="flex-1 py-2.5 text-sm font-semibold bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-all">
                    Revoke Approval
                  </button>
                )}
                <button onClick={() => { setDeleteTarget(slideOver); setSlideOver(null); }} className="flex-1 py-2.5 text-sm font-semibold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete HR Account"
        message={`Permanently delete ${deleteTarget?.name}'s account? This will remove their Firestore document and Firebase Auth user. This cannot be undone.`}
        confirmLabel="Delete Permanently"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
