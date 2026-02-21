import { useEffect, useState } from 'react';
import { Zap, Mic, MessageSquare, ChevronDown, ChevronUp, RefreshCw, Save, AlertCircle, Settings } from 'lucide-react';

const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY as string;
const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string;
const BASE = 'https://api.elevenlabs.io';

interface Subscription {
  character_count: number;
  character_limit: number;
  next_character_reset_unix: number;
  tier: string;
}

interface AgentDetails {
  name: string;
  first_message?: string;
  prompt?: { prompt: string };
  conversation_config?: {
    agent?: {
      prompt?: { prompt: string };
      first_message?: string;
    };
    tts?: { voice_id?: string };
  };
}

interface Conversation {
  conversation_id: string;
  start_time: number;
  call_duration_secs: number;
  status: string;
  metadata?: { cost?: number };
}

interface ConversationDetail {
  transcript: { role: string; message: string; time_in_call_secs?: number }[];
  metadata?: { cost?: number };
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}>{children}</span>;
}

function StatCard({ icon: Icon, label, value, sub, bg, color }: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  bg: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ElevenLabsSection() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Record<string, ConversationDetail>>({});
  const [transcriptLoading, setTranscriptLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promptText, setPromptText] = useState('');
  const [promptEditing, setPromptEditing] = useState(false);
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);

  const headers = { 'xi-api-key': API_KEY };

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, agentRes, convsRes] = await Promise.all([
        fetch(`${BASE}/v1/user/subscription`, { headers }),
        fetch(`${BASE}/v1/convai/agents/${AGENT_ID}`, { headers }),
        fetch(`${BASE}/v1/convai/conversations?agent_id=${AGENT_ID}&page_size=50`, { headers }),
      ]);

      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription({
          character_count: data.character_count ?? 0,
          character_limit: data.character_limit ?? 0,
          next_character_reset_unix: data.next_character_reset_unix ?? 0,
          tier: data.tier ?? 'unknown',
        });
      }

      if (agentRes.ok) {
        const data: AgentDetails = await agentRes.json();
        setAgent(data);
        const currentPrompt =
          data.conversation_config?.agent?.prompt?.prompt ||
          data.prompt?.prompt ||
          '';
        setPromptText(currentPrompt);
      }

      if (convsRes.ok) {
        const data = await convsRes.json();
        setConversations(data.conversations ?? []);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load ElevenLabs data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const loadTranscript = async (id: string) => {
    if (transcripts[id]) {
      setExpanded(prev => (prev === id ? null : id));
      return;
    }
    setTranscriptLoading(id);
    setExpanded(id);
    try {
      const res = await fetch(`${BASE}/v1/convai/conversations/${id}`, { headers });
      if (res.ok) {
        const data: ConversationDetail = await res.json();
        setTranscripts(prev => ({ ...prev, [id]: data }));
      }
    } finally {
      setTranscriptLoading(null);
    }
  };

  const handleSavePrompt = async () => {
    setPromptSaving(true);
    try {
      const res = await fetch(`${BASE}/v1/convai/agents/${AGENT_ID}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_config: {
            agent: {
              prompt: { prompt: promptText },
            },
          },
        }),
      });
      if (res.ok) {
        setPromptSaved(true);
        setPromptEditing(false);
        setTimeout(() => setPromptSaved(false), 3000);
      }
    } finally {
      setPromptSaving(false);
    }
  };

  const usedPct = subscription
    ? Math.min(100, Math.round((subscription.character_count / subscription.character_limit) * 100))
    : 0;
  const remaining = subscription
    ? (subscription.character_limit - subscription.character_count).toLocaleString()
    : '—';
  const resetDate = subscription
    ? new Date(subscription.next_character_reset_unix * 1000).toLocaleDateString()
    : '—';

  const totalCost = conversations.reduce((s, c) => s + (c.metadata?.cost ?? 0), 0);
  const avgDuration =
    conversations.length > 0
      ? Math.round(conversations.reduce((s, c) => s + c.call_duration_secs, 0) / conversations.length)
      : 0;

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-48 bg-slate-100 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-sm font-semibold text-slate-700 mb-1">Failed to load ElevenLabs data</p>
        <p className="text-xs text-slate-400 mb-4">{error}</p>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ElevenLabs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Agent analytics, conversations, credits, and prompt management</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Mic} label="Total Conversations" value={conversations.length} bg="bg-blue-50" color="text-blue-600" />
        <StatCard
          icon={Zap}
          label="Credits Used"
          value={subscription ? `${subscription.character_count.toLocaleString()}` : '—'}
          sub={`of ${subscription?.character_limit.toLocaleString() ?? '—'} · resets ${resetDate}`}
          bg="bg-amber-50"
          color="text-amber-600"
        />
        <StatCard
          icon={MessageSquare}
          label="Avg Duration"
          value={`${avgDuration}s`}
          sub={conversations.length > 0 ? `across ${conversations.length} sessions` : 'No sessions yet'}
          bg="bg-emerald-50"
          color="text-emerald-600"
        />
        <StatCard
          icon={Settings}
          label="Est. Total Cost"
          value={totalCost > 0 ? `$${totalCost.toFixed(4)}` : '$0.00'}
          sub={agent?.name ?? 'Agent data unavailable'}
          bg="bg-slate-100"
          color="text-slate-600"
        />
      </div>

      {subscription && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">Credit Usage</h2>
            <Badge color={subscription.tier === 'free' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'}>
              {subscription.tier}
            </Badge>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all ${usedPct > 80 ? 'bg-red-400' : usedPct > 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{subscription.character_count.toLocaleString()} used</span>
            <span className="font-semibold text-slate-700">{usedPct}%</span>
            <span>{remaining} remaining</span>
          </div>
        </div>
      )}

      {agent && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Agent: {agent.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">ID: {AGENT_ID}</p>
            </div>
            <button
              onClick={() => { setPromptEditing(e => !e); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              {promptEditing ? 'Cancel Edit' : 'Edit Prompt'}
            </button>
          </div>

          {(agent.conversation_config?.agent?.first_message || agent.first_message) && (
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">First Message</p>
              <p className="text-sm text-slate-600 italic">"{agent.conversation_config?.agent?.first_message || agent.first_message}"</p>
            </div>
          )}

          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">System Prompt</p>
              {promptSaved && <Badge color="bg-emerald-50 text-emerald-700">Saved!</Badge>}
            </div>
            {promptEditing ? (
              <div className="space-y-3">
                <textarea
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 text-sm text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all resize-none font-mono leading-relaxed"
                  placeholder="Enter system prompt..."
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setPromptEditing(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                  <button onClick={handleSavePrompt} disabled={promptSaving} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    {promptSaving ? 'Saving...' : 'Save Prompt'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                  {promptText || 'No system prompt configured.'}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Conversation History</h2>
          <p className="text-xs text-slate-400 mt-0.5">{conversations.length} total · click a row to expand transcript</p>
        </div>

        {conversations.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {conversations.map(conv => {
              const date = new Date(conv.start_time * 1000);
              const isOpen = expanded === conv.conversation_id;
              const detail = transcripts[conv.conversation_id];
              const cost = conv.metadata?.cost;
              return (
                <div key={conv.conversation_id}>
                  <button
                    onClick={() => loadTranscript(conv.conversation_id)}
                    className="w-full flex items-center justify-between gap-4 p-4 hover:bg-slate-50/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <code className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{conv.conversation_id.slice(0, 16)}…</code>
                        <Badge color={conv.status === 'done' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>{conv.status}</Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>{conv.call_duration_secs}s</span>
                        {cost != null && <span>${cost.toFixed(4)}</span>}
                      </div>
                    </div>
                    <div className="text-slate-400 flex-shrink-0">
                      {transcriptLoading === conv.conversation_id ? (
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                      ) : isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isOpen && detail && (
                    <div className="px-5 pb-4 bg-slate-50/50">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Transcript</p>
                      {detail.transcript.length === 0 ? (
                        <p className="text-xs text-slate-400">No transcript available</p>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {detail.transcript.map((t, i) => (
                            <div
                              key={i}
                              className={`flex gap-2.5 ${t.role === 'agent' ? '' : 'flex-row-reverse'}`}
                            >
                              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${t.role === 'agent' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                                {t.role === 'agent' ? 'AI' : 'U'}
                              </div>
                              <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs leading-relaxed ${t.role === 'agent' ? 'bg-white border border-slate-200 text-slate-700' : 'bg-blue-50 text-blue-800'}`}>
                                {t.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
