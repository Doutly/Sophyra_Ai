import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from 'firebase/firestore';
import { Mail, Phone, X, Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface Submission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface UniversityInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  universityName: string;
  message: string;
  status: string;
  createdAt: string;
}

type TabType = 'contact' | 'university';

export default function ContactSection() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [inquiries, setInquiries] = useState<UniversityInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('contact');
  const [detailContact, setDetailContact] = useState<Submission | null>(null);
  const [detailUniversity, setDetailUniversity] = useState<UniversityInquiry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; collection: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    const [subSnap, inqSnap] = await Promise.all([
      getDocs(query(collection(db, 'contactSubmissions'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'universityInquiries'), orderBy('createdAt', 'desc'))),
    ]);
    setSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)));
    setInquiries(inqSnap.docs.map(d => ({ id: d.id, ...d.data() } as UniversityInquiry)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await updateDoc(doc(db, 'contactSubmissions', id), { isRead: true });
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, isRead: true } : s));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await deleteDoc(doc(db, deleteTarget.collection, deleteTarget.id));
    setDeleteTarget(null);
    setDeleteLoading(false);
    await load();
  };

  const openContactDetail = async (s: Submission) => {
    setDetailContact(s);
    if (!s.isRead) await markRead(s.id);
  };

  const unreadContact = submissions.filter(s => !s.isRead).length;

  const formatDate = (val: string | { toDate?: () => Date }) => {
    if (!val) return '';
    if (typeof val === 'string') return new Date(val).toLocaleDateString();
    if (typeof val === 'object' && val.toDate) return val.toDate().toLocaleDateString();
    return '';
  };

  const formatDateFull = (val: string | { toDate?: () => Date }) => {
    if (!val) return '';
    if (typeof val === 'string') return new Date(val).toLocaleString();
    if (typeof val === 'object' && val.toDate) return val.toDate().toLocaleString();
    return '';
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Contact Inbox</h1>
        <p className="text-sm text-slate-500 mt-0.5">{unreadContact} unread messages</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex gap-1">
          {([
            ['contact', 'Contact Messages', unreadContact],
            ['university', 'University Inquiries', 0],
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
        ) : tab === 'contact' ? (
          submissions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No messages in this inbox</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {submissions.map(s => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer ${!s.isRead ? 'bg-blue-50/30' : ''}`}
                  onClick={() => openContactDetail(s)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!s.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <div className="min-w-0">
                      <p className={`text-sm text-slate-800 ${!s.isRead ? 'font-bold' : 'font-semibold'}`}>{s.name}</p>
                      <p className="text-xs text-slate-500 truncate">{s.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-xs text-slate-400">{formatDate(s.createdAt as unknown as string)}</p>
                    <button onClick={e => { e.stopPropagation(); setDeleteTarget({ id: s.id, name: s.name, collection: 'contactSubmissions' }); }} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          inquiries.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No university inquiries yet</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {inquiries.map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => setDetailUniversity(s)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-500 truncate">{s.universityName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-xs text-slate-400">{formatDate(s.createdAt as unknown as string)}</p>
                    <button onClick={e => { e.stopPropagation(); setDeleteTarget({ id: s.id, name: s.name, collection: 'universityInquiries' }); }} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {detailContact && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setDetailContact(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-base font-bold text-slate-900">Message Details</h2>
              <button onClick={() => setDetailContact(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-slate-900">{detailContact.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDateFull(detailContact.createdAt as unknown as string)}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${detailContact.isRead ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>
                  {detailContact.isRead ? 'Read' : 'Unread'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${detailContact.email}`} className="text-sm text-blue-600 hover:underline">{detailContact.email}</a>
                </div>
                {detailContact.phone && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{detailContact.phone}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Message</p>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{detailContact.message}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <a href={`mailto:${detailContact.email}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
                  <Mail className="w-4 h-4" />Reply
                </a>
                <button onClick={() => { setDeleteTarget({ id: detailContact.id, name: detailContact.name, collection: 'contactSubmissions' }); setDetailContact(null); }} className="flex-1 py-2.5 text-sm font-semibold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailUniversity && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setDetailUniversity(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-base font-bold text-slate-900">University Inquiry</h2>
              <button onClick={() => setDetailUniversity(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-base font-bold text-slate-900">{detailUniversity.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{detailUniversity.universityName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDateFull(detailUniversity.createdAt as unknown as string)}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${detailUniversity.email}`} className="text-sm text-blue-600 hover:underline">{detailUniversity.email}</a>
                </div>
                {detailUniversity.phone && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{detailUniversity.phone}</span>
                  </div>
                )}
              </div>
              {detailUniversity.message && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Message</p>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{detailUniversity.message}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <a href={`mailto:${detailUniversity.email}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
                  <Mail className="w-4 h-4" />Reply
                </a>
                <button onClick={() => { setDeleteTarget({ id: detailUniversity.id, name: detailUniversity.name, collection: 'universityInquiries' }); setDetailUniversity(null); }} className="flex-1 py-2.5 text-sm font-semibold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2">
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
