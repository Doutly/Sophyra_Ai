import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import {
  Brain,
  Play,
  ArrowLeft,
  Loader2,
  User,
  Bot,
  CheckCircle,
  AlertCircle,
  FileText,
  Building2,
  Briefcase,
  ChevronDown,
} from 'lucide-react';

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_6401kf6a3faqejpbsks4a5h1j3da';
const MAX_JD_LENGTH = 800;
const ELEVENLABS_API_KEY =
  import.meta.env.VITE_ELEVENLABS_API_KEY || '3962ab55c2cce53b25a1777ffb58e2dc8ea7eb3cd7a6f2c18e94dcd3c384e5e2';

interface SimulationTurn {
  role: 'agent' | 'user';
  message: string;
}

interface SimulationConfig {
  role: string;
  company: string;
  experienceLevel: string;
  jobDescription: string;
}

const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Principal', 'Executive'];

export default function InterviewSimulation() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [config, setConfig] = useState<SimulationConfig>({
    role: '',
    company: '',
    experienceLevel: 'Mid Level',
    jobDescription: '',
  });
  const [running, setRunning] = useState(false);
  const [turns, setTurns] = useState<SimulationTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user) navigate('/auth?mode=signin');
  }, [user, navigate]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  const buildSystemPrompt = () => {
    const jd = config.jobDescription.length > MAX_JD_LENGTH
      ? config.jobDescription.slice(0, MAX_JD_LENGTH) + '...'
      : config.jobDescription || 'General interview questions';
    return `You are Sophyra, an AI interviewer for ${config.company || 'a company'}. Role: ${config.role}, Level: ${config.experienceLevel}. JD: ${jd}. Ask 8 questions: 2 warm-up, 3 technical, 2 behavioral (STAR), 1 closing.`;
  };

  const handleRun = async () => {
    if (!config.role.trim()) {
      setError('Please enter a job role to simulate.');
      return;
    }

    setError(null);
    setTurns([]);
    setDone(false);
    setSavedId(null);
    setRunning(true);

    abortRef.current = new AbortController();

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}/simulate-conversation/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            simulation_specification: {
              simulated_user_config: {
                system_prompt: `You are a job candidate applying for ${config.role}${config.company ? ' at ' + config.company : ''}. Experience level: ${config.experienceLevel}. Answer questions naturally and concisely, as a real candidate would.`,
                first_message: `Hello! I'm here for the ${config.role} interview.`,
              },
            },
            overrides: {
              agent: {
                prompt: {
                  prompt: buildSystemPrompt(),
                },
                first_message: `Hello! I'm Sophyra, your AI interviewer. You're here for the ${config.role} position${config.company ? ' at ' + config.company : ''}. Let's begin — can you tell me a bit about yourself?`,
              },
            },
            max_duration_seconds: 600,
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error ${response.status}: ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available.');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            if (json.type === 'conversation_turn' && json.turn) {
              setTurns((prev) => [
                ...prev,
                { role: json.turn.role as 'agent' | 'user', message: json.turn.message },
              ]);
            }
          } catch {
            /* skip malformed chunks */
          }
        }
      }

      setDone(true);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Simulation error:', err);
      setError(err?.message || 'Simulation failed. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setRunning(false);
    if (turns.length > 0) setDone(true);
  };

  const handleSave = async () => {
    if (!user || turns.length === 0) return;
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'simulations'), {
        userId: user.uid,
        role: config.role,
        company: config.company,
        experienceLevel: config.experienceLevel,
        turns,
        turnCount: turns.length,
        createdAt: Timestamp.now(),
      });
      setSavedId(docRef.id);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTurns([]);
    setDone(false);
    setError(null);
    setSavedId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center space-x-4 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-brand-electric rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Interview Simulation</p>
            <p className="text-[11px] text-slate-400">AI-powered text simulation — no mic required</p>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 sticky top-24">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Simulation Setup
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
                  <Briefcase className="w-3 h-3" />
                  <span>Job Role</span>
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={config.role}
                  onChange={(e) => setConfig((c) => ({ ...c, role: e.target.value }))}
                  placeholder="e.g. Senior Frontend Engineer"
                  disabled={running}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-electric/20 focus:border-brand-electric disabled:opacity-50 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
                  <Building2 className="w-3 h-3" />
                  <span>Company</span>
                  <span className="text-slate-300 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={config.company}
                  onChange={(e) => setConfig((c) => ({ ...c, company: e.target.value }))}
                  placeholder="e.g. Google"
                  disabled={running}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-electric/20 focus:border-brand-electric disabled:opacity-50 transition-all"
                />
              </div>

              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-slate-600">Experience Level</label>
                <button
                  type="button"
                  onClick={() => setShowLevelDropdown((v) => !v)}
                  disabled={running}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-electric/20 focus:border-brand-electric disabled:opacity-50 transition-all flex items-center justify-between"
                >
                  <span>{config.experienceLevel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {showLevelDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-100 shadow-lg z-20 overflow-hidden">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          setConfig((c) => ({ ...c, experienceLevel: level }));
                          setShowLevelDropdown(false);
                        }}
                        className={`w-full px-3 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors ${
                          config.experienceLevel === level
                            ? 'text-brand-electric font-semibold bg-blue-50'
                            : 'text-slate-700'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
                  <FileText className="w-3 h-3" />
                  <span>Job Description</span>
                  <span className="text-slate-300 font-normal">(optional)</span>
                </label>
                <textarea
                  value={config.jobDescription}
                  onChange={(e) => setConfig((c) => ({ ...c, jobDescription: e.target.value }))}
                  placeholder="Paste the JD here to get tailored questions..."
                  rows={5}
                  disabled={running}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-electric/20 focus:border-brand-electric disabled:opacity-50 transition-all resize-none"
                />
              </div>

              {error && (
                <div className="flex items-start space-x-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                </div>
              )}

              <div className="pt-1 space-y-2">
                {!running && !done && (
                  <button
                    onClick={handleRun}
                    disabled={!config.role.trim()}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-brand-electric text-white text-sm font-bold rounded-xl hover:bg-brand-electric-dark transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    <span>Run Simulation</span>
                  </button>
                )}
                {running && (
                  <button
                    onClick={handleStop}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all"
                  >
                    <span>Stop</span>
                  </button>
                )}
                {done && (
                  <div className="space-y-2">
                    {!savedId ? (
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-60"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>{saving ? 'Saving...' : 'Save Transcript'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-700">Saved</span>
                      </div>
                    )}
                    <button
                      onClick={handleReset}
                      className="w-full px-4 py-3 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-all"
                    >
                      New Simulation
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-50">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sophyra simulates both the interviewer and a sample candidate. No microphone needed — review the full Q&A transcript instantly.
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[500px] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Simulation Transcript</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {turns.length === 0
                      ? 'Configure and run a simulation to see the conversation'
                      : `${turns.length} turn${turns.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                {running && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-brand-electric/10 border border-brand-electric/20 rounded-full">
                    <Loader2 className="w-3 h-3 text-brand-electric animate-spin" />
                    <span className="text-xs text-brand-electric font-semibold">Simulating...</span>
                  </div>
                )}
                {done && turns.length > 0 && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs text-emerald-700 font-semibold">Complete</span>
                  </div>
                )}
              </div>

              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                {turns.length === 0 && !running && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                      <Brain className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">
                      No simulation yet
                    </p>
                    <p className="text-xs text-slate-400 max-w-[220px]">
                      Fill in the job details on the left and click Run Simulation.
                    </p>
                  </div>
                )}

                {turns.length === 0 && running && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-12 h-12 bg-brand-electric/10 rounded-2xl flex items-center justify-center mb-4">
                      <Loader2 className="w-6 h-6 text-brand-electric animate-spin" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">Starting simulation...</p>
                    <p className="text-xs text-slate-400 mt-1">This may take a few seconds</p>
                  </div>
                )}

                {turns.map((turn, i) => (
                  <div
                    key={i}
                    className={`flex items-start space-x-3 ${
                      turn.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        turn.role === 'agent'
                          ? 'bg-brand-electric/10 border border-brand-electric/20'
                          : 'bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {turn.role === 'agent' ? (
                        <Bot className="w-4 h-4 text-brand-electric" />
                      ) : (
                        <User className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 max-w-[85%]">
                      <p
                        className={`text-[10px] font-bold mb-1.5 ${
                          turn.role === 'agent' ? 'text-brand-electric' : 'text-slate-500'
                        } ${turn.role === 'user' ? 'text-right' : ''}`}
                      >
                        {turn.role === 'agent' ? 'Sophyra AI' : 'Candidate'}
                      </p>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          turn.role === 'agent'
                            ? 'bg-slate-50 border border-slate-100 text-slate-800'
                            : 'bg-brand-electric/5 border border-brand-electric/15 text-slate-800'
                        }`}
                      >
                        {turn.message}
                      </div>
                    </div>
                  </div>
                ))}

                {running && turns.length > 0 && (
                  <div className="flex items-center space-x-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-brand-electric/10 border border-brand-electric/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-brand-electric" />
                    </div>
                    <div className="flex space-x-1 px-4 py-3">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-brand-electric rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={transcriptEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
