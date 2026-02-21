import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Phone, X, Trash2, Eye } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface Submission {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  is_read: boolean;
  source: string;
  created_at: string;
}

export default function ContactSection() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'contact' | 'university'>('contact');
  const [detail, setDetail] = useState<Submission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false });
    setSubmissions(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await supabase.from('contact_submissions').update({ is_read: true }).eq('id', id);
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, is_read: true } : s));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await supabase.from('contact_submissions').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    setDeleteLoading(false);
    await load();
  };

  const openDetail = async (s: Submission) => {
    setDetail(s);
    if (!s.is_read) await markRead(s.id);
  };

  const visible = submissions.filter(s => s.source === tab);
  const unreadContact = submissions.filter(s => s.source === 'contact' && !s.is_read).length;
  const unreadUniversity = submissions.filter(s => s.source === 'university' && !s.is_read).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Contact Inbox</h1>
        <p className="text-sm text-slate-500 mt-0.5">{submissions.filter(s => !s.is_read).length} unread messages</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex gap-1">
          {([
            ['contact', 'Contact Messages', unreadContact],
            ['university', 'University Inquiries', unreadUniversity],
          ] as const).map(([id, label, unread]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {label}
              {unread > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">{unread}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-1 p-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No messages in this inbox</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map(s => (
              <div
                key={s.id}
                className={`flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer ${!s.is_read ? 'bg-blue-50/30' : ''}`}
                onClick={() => openDetail(s)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!s.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold text-slate-800 ${!s.is_read ? 'font-bold' : ''}`}>{s.name}</p>
                    <p className="text-xs text-slate-500 truncate">{s.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString()}</p>
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(s); }} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setDetail(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-base font-bold text-slate-900">Message Details</h2>
              <button onClick={() => setDetail(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-slate-900">{detail.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(detail.created_at).toLocaleString()}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${detail.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>
                  {detail.is_read ? 'Read' : 'Unread'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${detail.email}`} className="text-sm text-blue-600 hover:underline">{detail.email}</a>
                </div>
                {detail.phone && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{detail.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Message</p>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{detail.message}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <a href={`mailto:${detail.email}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
                  <Mail className="w-4 h-4" />Reply
                </a>
                <button onClick={() => { setDeleteTarget(detail); setDetail(null); }} className="flex-1 py-2.5 text-sm font-semibold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Message"
        message={`Delete this message from ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
