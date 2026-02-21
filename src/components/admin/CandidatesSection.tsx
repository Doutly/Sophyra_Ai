import { useEffect, useState } from 'react';
import { db, functions } from '../../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Search, Download, X, FileText, ExternalLink, User, Ticket } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface Candidate {
  id: string;
  name: string;
  email: string;
  bio?: string;
  careerGoals?: string;
  industry?: string;
  experienceLevel?: string;
  resumeUrl?: string;
  avatarUrl?: string;
  createdAt: string;
  totalInterviews: number;
  avgScore: number;
  isActive: boolean;
}

interface HRRequest {
  id: string;
  ticketNumber: string;
  jobRole: string;
  companyName: string;
  status: string;
  createdAt: string;
}

interface SlideoverCandidate extends Candidate {
  reports: { id: string; overallScore: number; createdAt: string; role?: string; company?: string }[];
  hrRequests: HRRequest[];
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <td key={i} className="py-3 px-4"><div className="h-3 bg-slate-100 rounded" /></td>
      ))}
    </tr>
  );
}

export default function CandidatesSection() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [slideOver, setSlideOver] = useState<SlideoverCandidate | null>(null);
  const [slideLoading, setSlideLoading] = useState(false);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'candidate'));

    const unsub = onSnapshot(q, async (snapshot) => {
      const data = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const d = docSnap.data();
          const reportsSnap = await getDocs(
            query(collection(db, 'reports'), where('userId', '==', docSnap.id), orderBy('createdAt', 'desc'))
          );
          const reports = reportsSnap.docs.map(r => r.data());
          const total = reports.length;
          const avg = total > 0 ? Math.round(reports.reduce((s, r) => s + (r.overallScore || 0), 0) / total) : 0;

          return {
            id: docSnap.id,
            name: d.name || 'Unknown',
            email: d.email || '',
            bio: d.bio,
            careerGoals: d.careerGoals,
            industry: d.industry,
            experienceLevel: d.experienceLevel,
            resumeUrl: d.resumeUrl,
            avatarUrl: d.avatarUrl,
            createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            totalInterviews: total,
            avgScore: avg,
            isActive: d.isActive !== false,
          };
        })
      );
      setCandidates(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleToggleActive = async (c: Candidate) => {
    setActionLoading(c.id);
    try {
      await updateDoc(doc(db, 'users', c.id), { isActive: !c.isActive });
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

  const openSlideOver = async (c: Candidate) => {
    setSlideLoading(true);
    setSlideOver({ ...c, reports: [], hrRequests: [] });
    try {
      const [reportsSnap, hrReqSnap] = await Promise.all([
        getDocs(query(collection(db, 'reports'), where('userId', '==', c.id), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'mockInterviewRequests'), where('user_id', '==', c.id), orderBy('created_at', 'desc'))),
      ]);

      const reports = await Promise.all(reportsSnap.docs.map(async d => {
        const data = d.data();
        let role = '';
        let company = '';
        if (data.sessionId) {
          try {
            const sessSnap = await getDocs(query(collection(db, 'sessions'), where('__name__', '==', data.sessionId)));
            if (!sessSnap.empty) {
              role = sessSnap.docs[0].data().role || '';
              company = sessSnap.docs[0].data().company || '';
            }
          } catch {}
        }
        return {
          id: d.id,
          overallScore: data.overallScore || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || '',
          role,
          company,
        };
      }));

      const hrRequests: HRRequest[] = hrReqSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ticketNumber: data.ticket_number || '',
          jobRole: data.job_role || '',
          companyName: data.company_name || '',
          status: data.status || 'pending',
          createdAt: data.created_at || '',
        };
      });

      setSlideOver({ ...c, reports, hrRequests });
    } finally {
      setSlideLoading(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Interviews', 'Avg Score', 'Joined', 'Status'],
      ...candidates.map(c => [c.name, c.email, c.totalInterviews, c.avgScore, new Date(c.createdAt).toLocaleDateString(), c.isActive ? 'Active' : 'Inactive']),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `candidates-${Date.now()}.csv`;
    a.click();
  };

  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Candidates</h1>
          <p className="text-sm text-slate-500 mt-0.5">{candidates.length} registered candidates</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all">
          <Download className="w-4 h-4" />Export CSV
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Candidate</th>
                <th className="text-center py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Interviews</th>
                <th className="text-center py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Avg Score</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Joined</th>
                <th className="text-center py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">No candidates found</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-600">{c.totalInterviews}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                        c.avgScore >= 75 ? 'bg-emerald-50 text-emerald-700' :
                        c.avgScore >= 50 ? 'bg-blue-50 text-blue-700' :
                        c.avgScore > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>{c.avgScore > 0 ? c.avgScore : '—'}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openSlideOver(c)} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="View profile">
                          <User className="w-3 h-3" />Profile
                        </button>
                        <button onClick={() => handleToggleActive(c)} disabled={actionLoading === c.id} className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 ${c.isActive ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => setDeleteTarget(c)} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                          Delete
                        </button>
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
              <h2 className="text-base font-bold text-slate-900">Candidate Profile</h2>
              <button onClick={() => setSlideOver(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-xl font-bold text-slate-400 overflow-hidden">
                  {slideOver.avatarUrl ? <img src={slideOver.avatarUrl} alt="" className="w-full h-full object-cover" /> : slideOver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">{slideOver.name}</p>
                  <p className="text-sm text-slate-500">{slideOver.email}</p>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${slideOver.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {slideOver.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Interviews', value: slideOver.totalInterviews },
                  { label: 'Avg Score', value: slideOver.avgScore || '—' },
                  { label: 'Joined', value: new Date(slideOver.createdAt).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-slate-50 rounded-xl text-center">
                    <p className="text-base font-bold text-slate-800">{value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {(slideOver.bio || slideOver.industry || slideOver.careerGoals) && (
                <div className="space-y-3">
                  {slideOver.bio && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Bio</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{slideOver.bio}</p>
                    </div>
                  )}
                  {slideOver.industry && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Industry</p>
                      <p className="text-sm text-slate-600">{slideOver.industry}</p>
                    </div>
                  )}
                  {slideOver.careerGoals && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Career Goals</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{slideOver.careerGoals}</p>
                    </div>
                  )}
                </div>
              )}

              {slideOver.resumeUrl && (
                <a href={slideOver.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-100 transition-all w-full justify-center">
                  <FileText className="w-4 h-4" />
                  Download Resume
                </a>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">AI Session Reports</p>
                  <span className="text-[10px] text-slate-400">{slideOver.reports.length} total</span>
                </div>
                {slideLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : slideOver.reports.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <FileText className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-sm text-slate-400">No AI interview sessions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slideOver.reports.map((r, i) => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group hover:bg-slate-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700">{r.role || `Session #${slideOver.reports.length - i}`}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {r.company && <p className="text-[10px] text-slate-400 truncate">{r.company}</p>}
                            <p className="text-[10px] text-slate-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${r.overallScore >= 75 ? 'bg-emerald-50 text-emerald-700' : r.overallScore >= 50 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                            {r.overallScore}
                          </span>
                          <a href={`/report/${r.id}`} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-300 hover:text-blue-500 transition-colors" title="View report">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">HR Interview Requests</p>
                  <span className="text-[10px] text-slate-400">{slideOver.hrRequests.length} total</span>
                </div>
                {slideLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : slideOver.hrRequests.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <Ticket className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-sm text-slate-400">No HR interview requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slideOver.hrRequests.map(r => {
                      const statusColors: Record<string, string> = {
                        pending: 'bg-amber-50 text-amber-700',
                        approved: 'bg-blue-50 text-blue-700',
                        rejected: 'bg-red-50 text-red-600',
                        completed: 'bg-emerald-50 text-emerald-700',
                      };
                      return (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-slate-700 truncate">{r.jobRole}{r.companyName && ` · ${r.companyName}`}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {r.ticketNumber && <code className="text-[9px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">{r.ticketNumber}</code>}
                              <p className="text-[10px] text-slate-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ml-2 ${statusColors[r.status] || 'bg-slate-100 text-slate-500'}`}>
                            {r.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Candidate Account"
        message={`Permanently delete ${deleteTarget?.name}'s account? This will remove their Firestore document and Firebase Auth user. This cannot be undone.`}
        confirmLabel="Delete Permanently"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
