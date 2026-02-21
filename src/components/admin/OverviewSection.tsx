import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Users, BarChart3, TrendingUp, Ticket, Zap, Activity } from 'lucide-react';

const FUNCTIONS_BASE_URL = 'https://us-central1-sophyraai.cloudfunctions.net';

interface ElevenLabsUsage {
  character_count: number;
  character_limit: number;
  next_character_reset_unix: number;
}

interface ActivityItem {
  id: string;
  text: string;
  time: string;
  type: 'signup' | 'interview' | 'request';
}

interface OverviewStats {
  totalCandidates: number;
  totalHR: number;
  totalAISessions: number;
  totalRequests: number;
  pendingRequests: number;
  pendingHR: number;
}

export default function OverviewSection() {
  const [stats, setStats] = useState<OverviewStats>({
    totalCandidates: 0, totalHR: 0, totalAISessions: 0, totalRequests: 0, pendingRequests: 0, pendingHR: 0,
  });
  const [elUsage, setElUsage] = useState<ElevenLabsUsage | null>(null);
  const [elError, setElError] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadElevenLabsUsage();
  }, []);

  const loadStats = async () => {
    try {
      const [candidatesSnap, hrSnap, sessionsSnap, requestsSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role', '==', 'candidate'))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'hr'))),
        getDocs(collection(db, 'sessions')),
        getDocs(collection(db, 'mockInterviewRequests')),
      ]);

      const pendingRequests = requestsSnap.docs.filter(d => d.data().status === 'pending').length;
      const pendingHR = hrSnap.docs.filter(d => !d.data().isApproved).length;

      setStats({
        totalCandidates: candidatesSnap.size,
        totalHR: hrSnap.size,
        totalAISessions: sessionsSnap.size,
        totalRequests: requestsSnap.size,
        pendingRequests,
        pendingHR,
      });

      const recentCandidates = candidatesSnap.docs
        .sort((a, b) => {
          const aTime = a.data().createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.data().createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, 5)
        .map(d => ({
          id: d.id,
          text: `${d.data().name || 'New user'} signed up`,
          time: d.data().createdAt?.toDate?.()?.toLocaleDateString() || 'Recently',
          type: 'signup' as const,
        }));

      setActivity(recentCandidates);
    } catch (err) {
      console.error('Overview stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadElevenLabsUsage = async () => {
    try {
      const response = await fetch(`${FUNCTIONS_BASE_URL}/elevenLabsVoicesProxy`);
      if (!response.ok) throw new Error('proxy failed');
      const usageRes = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        headers: { 'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY },
      });
      if (!usageRes.ok) throw new Error('no subscription data');
      const data = await usageRes.json();
      setElUsage({
        character_count: data.character_count ?? 0,
        character_limit: data.character_limit ?? 0,
        next_character_reset_unix: data.next_character_reset_unix ?? 0,
      });
    } catch {
      setElError(true);
    }
  };

  const usedPct = elUsage ? Math.round((elUsage.character_count / elUsage.character_limit) * 100) : 0;
  const remaining = elUsage ? elUsage.character_limit - elUsage.character_count : 0;
  const resetDate = elUsage ? new Date(elUsage.next_character_reset_unix * 1000).toLocaleDateString() : '';

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Platform-wide analytics and live metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Candidates', value: stats.totalCandidates, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { icon: UserCheckIcon, label: 'HR Professionals', value: stats.totalHR, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { icon: BarChart3, label: 'AI Interviews', value: stats.totalAISessions, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
          { icon: Ticket, label: 'HR Requests', value: stats.totalRequests, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        ].map(({ icon: Icon, label, value, color, bg, border }) => (
          <div key={label} className={`bg-white border ${border} rounded-2xl p-5`}>
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
          </div>
          {activity.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activity.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      item.type === 'signup' ? 'bg-blue-400' :
                      item.type === 'interview' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`} />
                    <p className="text-sm text-slate-700">{item.text}</p>
                  </div>
                  <p className="text-xs text-slate-400 whitespace-nowrap">{item.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">ElevenLabs Credits</h2>
          </div>

          {elError ? (
            <div className="text-center py-4">
              <p className="text-xs text-slate-400">Unable to fetch live credit data.</p>
              <p className="text-xs text-slate-300 mt-1">Check API key or proxy.</p>
            </div>
          ) : elUsage ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-end justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Characters used</span>
                  <span className="text-xs font-semibold text-slate-700">{usedPct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usedPct > 80 ? 'bg-red-400' : usedPct > 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 mb-0.5">Used</p>
                  <p className="text-sm font-bold text-slate-800">{elUsage.character_count.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 mb-0.5">Limit</p>
                  <p className="text-sm font-bold text-slate-800">{elUsage.character_limit.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl col-span-2">
                  <p className="text-[10px] text-emerald-600 mb-0.5">Remaining</p>
                  <p className="text-sm font-bold text-emerald-700">{remaining.toLocaleString()} chars</p>
                </div>
              </div>
              {resetDate && (
                <p className="text-[10px] text-slate-400 text-center">Resets on {resetDate}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 animate-pulse">
              <div className="h-2 bg-slate-100 rounded-full" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Ticket className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-700">{stats.pendingRequests}</p>
            <p className="text-xs text-amber-600">Pending interview requests awaiting admin action</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">{stats.pendingHR}</p>
            <p className="text-xs text-blue-600">HR professionals awaiting approval</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}
