import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import {
  collection, query, onSnapshot, orderBy, getDocs, where,
  updateDoc, doc, Timestamp, addDoc, deleteDoc
} from 'firebase/firestore';
import { CheckCircle, XCircle, X, Download, FileText, Plus, Pencil, Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface Request {
  id: string;
  ticketNumber: string;
  userId: string;
  jobRole: string;
  companyName: string;
  experienceLevel: string;
  jobDescription: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  bookingStatus: string;
  assignedHrId: string | null;
  preferredDate: string;
  preferredTime: string;
  createdAt: string;
  candidateInfo: { name: string; email: string; bio?: string; industry?: string; careerGoals?: string; resumeUrl?: string } | null;
  assignedHrName?: string;
  hrUsers: { id: string; name: string }[];
}

interface RequestFormData {
  jobRole: string;
  companyName: string;
  experienceLevel: string;
  jobDescription: string;
  preferredDate: string;
  preferredTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  candidateName: string;
  candidateEmail: string;
}

const EMPTY_FORM: RequestFormData = {
  jobRole: '',
  companyName: '',
  experienceLevel: '',
  jobDescription: '',
  preferredDate: '',
  preferredTime: '',
  status: 'pending',
  candidateName: '',
  candidateEmail: '',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-700',
  rejected: 'bg-red-50 text-red-600',
  completed: 'bg-emerald-50 text-emerald-700',
};

function RequestFormModal({
  title,
  initial,
  onSave,
  onClose,
  saving,
}: {
  title: string;
  initial: RequestFormData;
  onSave: (data: RequestFormData) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<RequestFormData>(initial);

  const set = (key: keyof RequestFormData, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Candidate Name</label>
              <input value={form.candidateName} onChange={e => set('candidateName', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" placeholder="Full name" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Email</label>
              <input value={form.candidateEmail} onChange={e => set('candidateEmail', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" placeholder="Email address" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Job Role</label>
              <input value={form.jobRole} onChange={e => set('jobRole', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" placeholder="e.g. Software Engineer" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Company</label>
              <input value={form.companyName} onChange={e => set('companyName', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" placeholder="Company name" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Experience Level</label>
              <select value={form.experienceLevel} onChange={e => set('experienceLevel', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all">
                <option value="">Select level</option>
                {['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager', 'Executive'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as RequestFormData['status'])} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all">
                {(['pending', 'approved', 'rejected', 'completed'] as const).map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Preferred Date</label>
              <input type="date" value={form.preferredDate} onChange={e => set('preferredDate', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Preferred Time</label>
              <input type="time" value={form.preferredTime} onChange={e => set('preferredTime', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Job Description</label>
            <textarea value={form.jobDescription} onChange={e => set('jobDescription', e.target.value)} rows={4} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all resize-none" placeholder="Optional job description..." />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving || !form.jobRole || !form.candidateName} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RequestsSection() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [hrUsers, setHrUsers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detail, setDetail] = useState<Request | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Request | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Request | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formSaving, setFormSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'mockInterviewRequests'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(q, async snapshot => {
      const data = await Promise.all(snapshot.docs.map(async d => {
        const rd = d.data();
        let candidateName = 'Unknown';
        let candidateEmail = '';
        if (rd.user_id) {
          try {
            const uSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', rd.user_id)));
            if (!uSnap.empty) {
              candidateName = uSnap.docs[0].data().name || 'Unknown';
              candidateEmail = uSnap.docs[0].data().email || '';
            }
          } catch {}
        }
        let assignedHrName: string | undefined;
        if (rd.assigned_hr_id) {
          try {
            const hSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', rd.assigned_hr_id)));
            if (!hSnap.empty) assignedHrName = hSnap.docs[0].data().name;
          } catch {}
        }
        return {
          id: d.id,
          ticketNumber: rd.ticket_number || '',
          userId: rd.user_id || '',
          jobRole: rd.job_role || '',
          companyName: rd.company_name || '',
          experienceLevel: rd.experience_level || '',
          jobDescription: rd.job_description || '',
          status: rd.status || 'pending',
          bookingStatus: rd.booking_status || 'open',
          assignedHrId: rd.assigned_hr_id || null,
          preferredDate: rd.preferred_date || '',
          preferredTime: rd.preferred_time || '',
          createdAt: rd.created_at || '',
          candidateInfo: rd.candidate_info ? {
            name: rd.candidate_info.name || candidateName,
            email: rd.candidate_info.email || candidateEmail,
            bio: rd.candidate_info.bio,
            industry: rd.candidate_info.industry,
            careerGoals: rd.candidate_info.career_goals,
            resumeUrl: rd.candidate_info.resume_url,
          } : { name: candidateName, email: candidateEmail },
          assignedHrName,
          hrUsers: [],
        };
      }));
      setRequests(data);
      setLoading(false);
    });

    const hrUnsub = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'hr'), where('isApproved', '==', true)),
      snap => setHrUsers(snap.docs.map(d => ({ id: d.id, name: d.data().name || '' })))
    );

    return () => { unsub(); hrUnsub(); };
  }, []);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, 'mockInterviewRequests', id), { status: action, updated_at: Timestamp.now() });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignHR = async (id: string, hrId: string) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, 'mockInterviewRequests', id), { assigned_hr_id: hrId || null, updated_at: Timestamp.now() });
    } finally {
      setActionLoading(null);
    }
  };

  const generateTicketNumber = () => `TKT-${Date.now().toString(36).toUpperCase()}`;

  const handleCreate = async (form: RequestFormData) => {
    setFormSaving(true);
    try {
      await addDoc(collection(db, 'mockInterviewRequests'), {
        ticket_number: generateTicketNumber(),
        job_role: form.jobRole,
        company_name: form.companyName,
        experience_level: form.experienceLevel,
        job_description: form.jobDescription,
        preferred_date: form.preferredDate,
        preferred_time: form.preferredTime,
        status: form.status,
        booking_status: 'open',
        assigned_hr_id: null,
        user_id: '',
        candidate_info: { name: form.candidateName, email: form.candidateEmail },
        created_at: new Date().toISOString(),
        updated_at: Timestamp.now(),
      });
      setShowCreate(false);
    } finally {
      setFormSaving(false);
    }
  };

  const handleEdit = async (form: RequestFormData) => {
    if (!editTarget) return;
    setFormSaving(true);
    try {
      await updateDoc(doc(db, 'mockInterviewRequests', editTarget.id), {
        job_role: form.jobRole,
        company_name: form.companyName,
        experience_level: form.experienceLevel,
        job_description: form.jobDescription,
        preferred_date: form.preferredDate,
        preferred_time: form.preferredTime,
        status: form.status,
        candidate_info: {
          ...(editTarget.candidateInfo || {}),
          name: form.candidateName,
          email: form.candidateEmail,
        },
        updated_at: Timestamp.now(),
      });
      setEditTarget(null);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'mockInterviewRequests', deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = requests.filter(r => {
    const matchSearch = r.jobRole.toLowerCase().includes(search.toLowerCase()) ||
      (r.candidateInfo?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      r.ticketNumber.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  const toFormData = (r: Request): RequestFormData => ({
    jobRole: r.jobRole,
    companyName: r.companyName,
    experienceLevel: r.experienceLevel,
    jobDescription: r.jobDescription,
    preferredDate: r.preferredDate,
    preferredTime: r.preferredTime,
    status: r.status,
    candidateName: r.candidateInfo?.name || '',
    candidateEmail: r.candidateInfo?.email || '',
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Interview Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">{counts.all} total · {counts.pending} pending action</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected', 'completed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                {f} {counts[f] > 0 && <span className="ml-1 opacity-70">({counts[f]})</span>}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, role, or ticket..."
            className="sm:ml-auto px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 transition-all min-w-48"
          />
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                  <div className="h-8 w-24 bg-slate-100 rounded-lg" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No requests found</div>
          ) : (
            filtered.map(r => (
              <div key={r.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-800">{r.candidateInfo?.name || 'Unknown'}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-500'}`}>{r.status}</span>
                      {r.ticketNumber && <code className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{r.ticketNumber}</code>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                      <span><span className="text-slate-400">Role:</span> {r.jobRole}{r.companyName && ` · ${r.companyName}`}</span>
                      <span><span className="text-slate-400">Level:</span> {r.experienceLevel}</span>
                      {r.preferredDate && <span><span className="text-slate-400">Preferred:</span> {r.preferredDate} {r.preferredTime}</span>}
                      {r.assignedHrName && <span><span className="text-slate-400">Assigned to:</span> {r.assignedHrName}</span>}
                    </div>

                    {r.status === 'approved' && (
                      <div className="flex items-center gap-2 mt-2">
                        <label className="text-[10px] text-slate-400">Assign HR:</label>
                        <select
                          value={r.assignedHrId || ''}
                          onChange={e => handleAssignHR(r.id, e.target.value)}
                          disabled={actionLoading === r.id}
                          className="text-xs px-2 py-1 border border-slate-200 rounded-lg focus:outline-none disabled:opacity-50"
                        >
                          <option value="">Unassigned (Pool)</option>
                          {hrUsers.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setDetail(r)} className="text-xs text-blue-600 hover:underline">Details</button>
                      <button onClick={() => setEditTarget(r)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {r.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleAction(r.id, 'approved')} disabled={actionLoading === r.id} className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all disabled:opacity-50 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />Approve
                        </button>
                        <button onClick={() => handleAction(r.id, 'rejected')} disabled={actionLoading === r.id} className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-base font-bold text-slate-900">Request Details</h2>
              <button onClick={() => setDetail(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <h3 className="text-sm font-bold text-slate-900">{detail.candidateInfo?.name}</h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[detail.status]}`}>{detail.status}</span>
                {detail.ticketNumber && <code className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{detail.ticketNumber}</code>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Email', value: detail.candidateInfo?.email },
                  { label: 'Role', value: detail.jobRole },
                  { label: 'Company', value: detail.companyName || '—' },
                  { label: 'Experience', value: detail.experienceLevel },
                  { label: 'Preferred Date', value: detail.preferredDate || '—' },
                  { label: 'Preferred Time', value: detail.preferredTime || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-slate-700">{value || '—'}</p>
                  </div>
                ))}
              </div>

              {detail.candidateInfo?.bio && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Candidate Bio</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{detail.candidateInfo.bio}</p>
                </div>
              )}

              {detail.jobDescription && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Job Description</p>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{detail.jobDescription}</p>
                </div>
              )}

              {detail.candidateInfo?.resumeUrl && (
                <a href={detail.candidateInfo.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <FileText className="w-4 h-4" /><Download className="w-3 h-3" />Download Resume
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <RequestFormModal
          title="New Interview Request"
          initial={EMPTY_FORM}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
          saving={formSaving}
        />
      )}

      {editTarget && (
        <RequestFormModal
          title="Edit Interview Request"
          initial={toFormData(editTarget)}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
          saving={formSaving}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Interview Request"
        message={`Permanently delete the request from ${deleteTarget?.candidateInfo?.name || 'this candidate'} for ${deleteTarget?.jobRole}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
