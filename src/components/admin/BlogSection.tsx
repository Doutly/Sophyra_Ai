import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { Plus, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string;
  author: string;
  category: string;
  excerpt: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

const EMPTY_POST: Omit<BlogPost, 'id' | 'createdAt'> = {
  title: '',
  slug: '',
  coverImageUrl: '',
  author: 'Sophyra AI',
  category: 'General',
  excerpt: '',
  content: '',
  isPublished: false,
  publishedAt: null,
};

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<BlogPost> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => setModal({ ...EMPTY_POST });
  const openEdit = (p: BlogPost) => setModal({ ...p });

  const handleSave = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      const now = Timestamp.now().toDate().toISOString();
      const payload = {
        title: modal.title || '',
        slug: modal.slug || toSlug(modal.title || ''),
        coverImageUrl: modal.coverImageUrl || '',
        author: modal.author || 'Sophyra AI',
        category: modal.category || 'General',
        excerpt: modal.excerpt || '',
        content: modal.content || '',
        isPublished: modal.isPublished || false,
        publishedAt: modal.isPublished ? (modal.publishedAt || now) : null,
      };

      if (modal.id) {
        await updateDoc(doc(db, 'blogs', modal.id), payload);
      } else {
        await addDoc(collection(db, 'blogs'), { ...payload, createdAt: now });
      }
      setModal(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (p: BlogPost) => {
    const now = Timestamp.now().toDate().toISOString();
    await updateDoc(doc(db, 'blogs', p.id), {
      isPublished: !p.isPublished,
      publishedAt: !p.isPublished ? now : null,
    });
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await deleteDoc(doc(db, 'blogs', deleteTarget.id));
    setDeleteTarget(null);
    setDeleteLoading(false);
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Blog</h1>
          <p className="text-sm text-slate-500 mt-0.5">{posts.length} posts · {posts.filter(p => p.isPublished).length} published</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all">
          <Plus className="w-4 h-4" />New Post
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Title</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Category</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Author</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Created</th>
                <th className="text-center py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(j => <td key={j} className="py-3 px-4"><div className="h-3 bg-slate-100 rounded" /></td>)}
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">No blog posts yet. Create your first one!</td></tr>
              ) : (
                posts.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{p.title || '(untitled)'}</p>
                      <p className="text-xs text-slate-400 font-mono">/blog/{p.slug}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p.category}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{p.author}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${p.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {p.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleTogglePublish(p)} className={`p-1.5 rounded-lg transition-all ${p.isPublished ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`} title={p.isPublished ? 'Unpublish' : 'Publish'}>
                          {p.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
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

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-base font-bold text-slate-900">{modal.id ? 'Edit Post' : 'New Blog Post'}</h2>
              <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Title</label>
                  <input value={modal.title || ''} onChange={e => setModal(m => ({ ...m!, title: e.target.value, slug: m?.id ? m.slug : toSlug(e.target.value) }))} placeholder="Post title" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Slug</label>
                  <input value={modal.slug || ''} onChange={e => setModal(m => ({ ...m!, slug: e.target.value }))} placeholder="url-friendly-slug" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
                  <input value={modal.category || ''} onChange={e => setModal(m => ({ ...m!, category: e.target.value }))} placeholder="General" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Author</label>
                  <input value={modal.author || ''} onChange={e => setModal(m => ({ ...m!, author: e.target.value }))} placeholder="Sophyra AI" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Cover Image URL</label>
                  <input value={modal.coverImageUrl || ''} onChange={e => setModal(m => ({ ...m!, coverImageUrl: e.target.value }))} placeholder="https://images.pexels.com/..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Excerpt</label>
                  <textarea value={modal.excerpt || ''} onChange={e => setModal(m => ({ ...m!, excerpt: e.target.value }))} rows={2} placeholder="Short preview text..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Content</label>
                  <textarea value={modal.content || ''} onChange={e => setModal(m => ({ ...m!, content: e.target.value }))} rows={8} placeholder="Full article content..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all resize-y font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={modal.isPublished || false} onChange={e => setModal(m => ({ ...m!, isPublished: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Publish immediately</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : modal.id ? 'Save Changes' : 'Create Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Blog Post"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
