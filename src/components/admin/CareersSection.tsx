import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Users, X, Mail, Phone, Download, ChevronDown, ChevronUp } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface CareerListing {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  is_active: boolean;
  created_at: string;
  applicationCount?: number;
}

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  resume_url: string;
  created_at: string;
}

const EMPTY_LISTING: Omit<CareerListing, 'id' | 'created_at' | 'applicationCount'> = {
  title: '',
  department: '',
  location: 'Remote',
  type: 'Full-time',
  description: '',
  requirements: '',
  is_active: true,
};

export default function CareersSection() {
  const [listings, setListings] = useState<CareerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<CareerListing> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CareerListing | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Record<string, Application[]>>({});
  const [appsLoading, setAppsLoading] = useState<string | null>(null);

  const load = async () => {
    const { data: listingsData } = await supabase.from('careers').select('*').order('created_at', { ascending: false });
    if (listingsData) {
      const withCounts = await Promise.all(
        listingsData.map(async l => {
          const { count } = await supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('career_id', l.id);
          return { ...l, applicationCount: count || 0 };
        })
      );
      setListings(withCounts);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      const payload = {
        title: modal.title || '',
        department: modal.department || '',
        location: modal.location || 'Remote',
        type: modal.type || 'Full-time',
        description: modal.description || '',
        requirements: modal.requirements || '',
        is_active: modal.is_active !== false,
      };
      if (modal.id) {
        await supabase.from('careers').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', modal.id);
      } else {
        await supabase.from('careers').insert(payload);
      }
      setModal(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (l: CareerListing) => {
    await supabase.from('careers').update({ is_active: !l.is_active, updated_at: new Date().toISOString() }).eq('id', l.id);
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await supabase.from('careers').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    setDeleteLoading(false);
    await load();
  };

  const toggleApplications = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!applications[id]) {
      setAppsLoading(id);
      const { data } = await supabase.from('job_applications').select('*').eq('career_id', id).order('created_at', { ascending: false });
      setApplications(prev => ({ ...prev, [id]: data || [] }));
      setAppsLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Careers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{listings.length} listings · {listings.filter(l => l.is_active).length} active</p>
        </div>
        <button onClick={() => setModal({ ...EMPTY_LISTING })} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all">
          <Plus className="w-4 h-4" />New Listing
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center">
          <p className="text-sm text-slate-400">No career listings yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(l => (
            <div key={l.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{l.title}</h3>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{l.type}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{l.location}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${l.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{l.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <p className="text-xs text-slate-500">{l.department}</p>
                    {l.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{l.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleApplications(l.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all">
                      <Users className="w-3.5 h-3.5" />
                      {l.applicationCount} {expandedId === l.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button onClick={() => handleToggleActive(l)} className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${l.is_active ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                      {l.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => setModal({ ...l })} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(l)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {expandedId === l.id && (
                <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Applications</p>
                  {appsLoading === l.id ? (
                    <div className="space-y-2">
                      {[1, 2].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}
                    </div>
                  ) : (applications[l.id] || []).length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No applications yet</p>
                  ) : (
                    <div className="space-y-2">
                      {(applications[l.id] || []).map(a => (
                        <div key={a.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="flex items-center gap-1 text-xs text-slate-500"><Mail className="w-3 h-3" />{a.email}</span>
                              {a.phone && <span className="flex items-center gap-1 text-xs text-slate-500"><Phone className="w-3 h-3" />{a.phone}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString()}</p>
                            {a.resume_url && (
                              <a href={a.resume_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Download resume">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-base font-bold text-slate-900">{modal.id ? 'Edit Listing' : 'New Career Listing'}</h2>
              <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Job Title</label>
                  <input value={modal.title || ''} onChange={e => setModal(m => ({ ...m!, title: e.target.value }))} placeholder="e.g. Frontend Engineer" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Department</label>
                  <input value={modal.department || ''} onChange={e => setModal(m => ({ ...m!, department: e.target.value }))} placeholder="Engineering" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Location</label>
                  <input value={modal.location || ''} onChange={e => setModal(m => ({ ...m!, location: e.target.value }))} placeholder="Remote" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Type</label>
                  <select value={modal.type || 'Full-time'} onChange={e => setModal(m => ({ ...m!, type: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all bg-white">
                    {['Full-time', 'Part-time', 'Contract', 'Internship'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Description</label>
                  <textarea value={modal.description || ''} onChange={e => setModal(m => ({ ...m!, description: e.target.value }))} rows={3} placeholder="Short job description..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Requirements</label>
                  <textarea value={modal.requirements || ''} onChange={e => setModal(m => ({ ...m!, requirements: e.target.value }))} rows={4} placeholder="Skills, experience, qualifications..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={modal.is_active !== false} onChange={e => setModal(m => ({ ...m!, is_active: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Show as active on public page</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : modal.id ? 'Save Changes' : 'Create Listing'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Career Listing"
        message={`Delete "${deleteTarget?.title}"? All applications for this listing will also be deleted. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
