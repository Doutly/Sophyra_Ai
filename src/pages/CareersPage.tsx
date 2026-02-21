import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, MapPin, Briefcase, Clock, Send, X, Upload } from 'lucide-react';

interface CareerListing {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
}

interface ApplicationForm {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const EMPTY_FORM: ApplicationForm = { name: '', email: '', phone: '', message: '' };

export default function CareersPage() {
  const [listings, setListings] = useState<CareerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyTarget, setApplyTarget] = useState<CareerListing | null>(null);
  const [form, setForm] = useState<ApplicationForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.from('careers').select('*').eq('is_active', true).order('created_at', { ascending: false }).then(({ data }) => {
      setListings(data || []);
      setLoading(false);
    });
  }, []);

  const handleApply = async () => {
    if (!applyTarget || !form.name || !form.email) return;
    setSubmitting(true);
    try {
      await supabase.from('job_applications').insert({
        career_id: applyTarget.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        resume_url: '',
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setApplyTarget(null);
    setForm(EMPTY_FORM);
    setSubmitted(false);
  };

  const TYPE_COLORS: Record<string, string> = {
    'Full-time': 'bg-blue-50 text-blue-700',
    'Part-time': 'bg-cyan-50 text-cyan-700',
    'Contract': 'bg-amber-50 text-amber-700',
    'Internship': 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <img src="/lo.png" alt="Sophyra AI" className="w-6 h-6 object-contain" />
            <span className="text-sm font-bold text-slate-900">Careers at Sophyra AI</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10 max-w-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">We're Hiring</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Join Sophyra AI</h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            We're a lean, ambitious team working at the intersection of AI, voice technology, and education. We value curiosity, ownership, and a bias for action.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">No open positions right now</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Send your resume to{' '}
              <a href="mailto:careers@sophyra.ai" className="text-blue-600 hover:underline">careers@sophyra.ai</a>
              {' '}and we'll keep you in mind for future roles.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h2 className="text-base font-bold text-slate-900">{listing.title}</h2>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[listing.type] || 'bg-slate-100 text-slate-600'}`}>{listing.type}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{listing.department}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{listing.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{listing.type}</span>
                    </div>
                    {listing.description && <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{listing.description}</p>}
                  </div>
                  <button
                    onClick={() => { setApplyTarget(listing); setForm(EMPTY_FORM); setSubmitted(false); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />Apply
                  </button>
                </div>

                {listing.requirements && (
                  <details className="mt-4 pt-4 border-t border-slate-100">
                    <summary className="text-xs font-semibold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors">View Requirements</summary>
                    <div className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{listing.requirements}</div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 p-6 bg-white border border-slate-200 rounded-2xl">
          <h3 className="text-base font-bold text-slate-900 mb-2">Don't see the right role?</h3>
          <p className="text-sm text-slate-500 mb-4">We're always looking for great people. Send your resume and tell us why you want to work at Sophyra.</p>
          <a href="mailto:careers@sophyra.ai" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all">
            <Send className="w-3.5 h-3.5" />careers@sophyra.ai
          </a>
        </div>
      </div>

      {applyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Apply for {applyTarget.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{applyTarget.department} · {applyTarget.location}</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitted ? (
              <div className="px-6 py-10 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Send className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Application Sent!</h3>
                <p className="text-sm text-slate-500 mb-5">We've received your application for {applyTarget.title}. We'll be in touch soon.</p>
                <button onClick={closeModal} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all">
                  Close
                </button>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@email.com" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Resume / LinkedIn URL</label>
                  <input value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Link to your resume or LinkedIn profile" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Upload className="w-3 h-3" />Or email your resume directly to <a href="mailto:careers@sophyra.ai" className="text-blue-600 hover:underline">careers@sophyra.ai</a>
                </p>
                <div className="flex gap-3 pt-1">
                  <button onClick={closeModal} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleApply} disabled={submitting || !form.name || !form.email} className="flex-1 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
