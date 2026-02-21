import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Phone, Mail, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UniversityContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    universityName: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.universityName) return;
    setStatus('loading');
    try {
      await addDoc(collection(db, 'universityInquiries'), {
        ...form,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setStatus('success');
      setForm({ name: '', email: '', phone: '', universityName: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="grid md:grid-cols-5 min-h-[420px]">
      <div className="md:col-span-2 bg-slate-900 p-6 flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
            <GraduationCap className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Partner with Sophyra AI</h3>
          <p className="text-sm text-white/55 leading-relaxed mb-6">
            Bring AI-powered interview preparation to your students. We partner with universities to provide campus-wide access to Sophyra's mock interview platform.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-white/60" />
              </div>
              <div>
                <p className="text-xs text-white/40 font-medium uppercase tracking-wide">Email</p>
                <p className="text-sm text-white/75">contact@sophyra.ai</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-white/60" />
              </div>
              <div>
                <p className="text-xs text-white/40 font-medium uppercase tracking-wide">Phone</p>
                <p className="text-sm text-white/75">+91 90199 11866</p>
                <p className="text-sm text-white/75">+91 80888 87775</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-white/25 mt-4">We respond within 1 business day.</p>
      </div>

      <div className="md:col-span-3 p-6">
        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
            <h4 className="text-lg font-bold text-slate-900 mb-1">Request Submitted!</h4>
            <p className="text-sm text-slate-500">We'll reach out to you within 1 business day.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@university.edu"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="universityName">University / Institution *</Label>
              <Input
                id="universityName"
                name="universityName"
                value={form.universityName}
                onChange={handleChange}
                placeholder="University name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us about your placement cell and how we can help..."
                rows={3}
              />
            </div>
            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Something went wrong. Please try again.</span>
              </div>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {status === 'loading' ? 'Submitting...' : 'Submit Inquiry'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
