import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, functions } from '../lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useConversation } from '@elevenlabs/react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  X,
  Wifi,
  WifiOff,
  Brain,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_6401kf6a3faqejpbsks4a5h1j3da';
const MAX_JD_LENGTH = 800;

async function getSignedUrl(agentId: string): Promise<string> {
  const getSignedUrlFn = httpsCallable<{ agentId: string }, { signed_url: string }>(
    functions,
    'getElevenLabsSignedUrl'
  );
  const result = await getSignedUrlFn({ agentId });
  if (!result.data?.signed_url) throw new Error('No signed URL returned');
  return result.data.signed_url;
}

interface TranscriptMessage {
  id: string;
  source: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

export default function InterviewRoomV2() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [ended, setEnded] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cameraError, setCameraError] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const candidateNameRef = useRef('Candidate');
  const startedRef = useRef(false);
  const endedRef = useRef(false);
  const transcriptCountRef = useRef(0);
  const connectingRef = useRef(false);
  const connectedAtRef = useRef<number | null>(null);

  const conversation = useConversation({
    micMuted: !micEnabled,
    onConnect: () => {
      connectingRef.current = false;
      connectedAtRef.current = Date.now();
      setConnecting(false);
    },
    onDisconnect: () => {
      connectingRef.current = false;
      setConnecting(false);

      if (endedRef.current) return;

      const connectedDuration = connectedAtRef.current
        ? Date.now() - connectedAtRef.current
        : 0;
      const minSessionMs = 8000;
      if (
        startedRef.current &&
        transcriptCountRef.current > 0 &&
        connectedDuration > minSessionMs
      ) {
        handleEnd();
      } else if (
        startedRef.current &&
        connectedDuration <= minSessionMs &&
        connectedDuration > 0
      ) {
        setStartError('Connection dropped unexpectedly. Please try again.');
        startedRef.current = false;
        setStarted(false);
        connectedAtRef.current = null;
      }
    },
    onMessage: (msg: { message: string; source: 'user' | 'ai' }) => {
      transcriptCountRef.current += 1;
      setTranscript((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          source: msg.source,
          message: msg.message,
          timestamp: new Date(),
        },
      ]);
    },
    onError: (message: string, context?: unknown) => {
      console.error('ElevenLabs error:', message, context);
      connectingRef.current = false;
      setConnecting(false);
      setStartError('Connection error. Please try again.');
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
      return;
    }
    initRoom();

    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, sessionId]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const initRoom = async () => {
    try {
      const sessionRef = doc(db, 'sessions', sessionId!);
      const snap = await getDoc(sessionRef);
      if (!snap.exists()) throw new Error('Session not found');

      const data = snap.data();
      setSession(data);
      candidateNameRef.current =
        data.candidateName ||
        user?.displayName ||
        user?.email?.split('@')[0] ||
        'Candidate';

      await startCamera();
      setLoading(false);
    } catch (err) {
      console.error('Error initializing room:', err);
      navigate('/dashboard');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError(true);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioStream;
      } catch {
        console.error('Microphone access denied');
      }
    }
  };

  const stopCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
  };

  const handleStart = async () => {
    if (!session) return;
    if (connectingRef.current) return;
    if (conversation.status === 'connected' || conversation.status === 'connecting') return;

    setStartError(null);
    setConnecting(true);
    connectingRef.current = true;

    try {
      const rawJd = session.jdText || 'General interview questions';
      const jd = rawJd.length > MAX_JD_LENGTH ? rawJd.slice(0, MAX_JD_LENGTH) + '...' : rawJd;
      const company = session.company || 'a company';
      const role = session.role || 'the position';

      const signedUrl = await getSignedUrl(AGENT_ID);

      const convId = await conversation.startSession({
        signedUrl,
        dynamicVariables: {
          candidate_name: candidateNameRef.current,
          company,
          role,
          experience_level: session.experienceLevel || 'any level',
          job_description: jd,
          resume_skills: session.resumeSkills?.slice(0, 10).join(', ') || '',
          resume_summary: session.resumeSummary?.slice(0, 200) || '',
        },
      });

      startedRef.current = true;
      setStarted(true);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);

      await updateDoc(doc(db, 'sessions', sessionId!), {
        started_at: Timestamp.now(),
        status: 'in_progress',
        ...(convId ? { elevenLabsConversationId: convId } : {}),
      });
    } catch (err: any) {
      console.error('Failed to start session:', err);
      connectingRef.current = false;
      setConnecting(false);
      setStartError(
        err?.message || 'Failed to connect. Please check your microphone and try again.'
      );
    }
  };

  const handleEnd = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    connectedAtRef.current = null;
    setEnded(true);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const status = conversation.status;
      if (status === 'connected') {
        await conversation.endSession();
      }
    } catch {
      /* ignore */
    }

    try {
      await updateDoc(doc(db, 'sessions', sessionId!), {
        ended_at: Timestamp.now(),
        status: 'completed',
        completed_at: Timestamp.now(),
      });
    } catch (err) {
      console.error('Error updating session end:', err);
    }

    stopCamera();

    setTimeout(() => {
      navigate(`/report/${sessionId}`);
    }, 2500);
  }, [sessionId, conversation, navigate]);

  const confirmEnd = () => {
    if (window.confirm('End the interview? Your progress will be saved.')) {
      handleEnd();
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setMicEnabled((v) => !v);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setCameraEnabled((v) => !v);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const connectionStatus = conversation.status;
  const isSpeaking = conversation.isSpeaking;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-electric border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Preparing your interview room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col select-none">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-electric rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">
              {session?.role || 'Mock Interview'}
            </p>
            {session?.company && (
              <p className="text-slate-500 text-xs mt-0.5">{session.company}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {started && !ended && (
            <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-white text-sm font-mono tabular-nums">{formatTime(elapsedSeconds)}</span>
            </div>
          )}

          <div className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
            connectionStatus === 'connected'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : connectionStatus === 'connecting'
              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
              : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
          }`}>
            {connectionStatus === 'connected' ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="capitalize">
              {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting' : 'Ready'}
            </span>
          </div>

          <button
            onClick={() => setShowTranscript((v) => !v)}
            className={`p-2 rounded-lg transition-all ${showTranscript ? 'bg-brand-electric text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="w-full max-w-5xl">
            {!started && !ended ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-24 h-24 bg-brand-electric/10 border border-brand-electric/30 rounded-3xl flex items-center justify-center mb-6">
                  <Brain className="w-12 h-12 text-brand-electric" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Ready when you are</h2>
                <p className="text-slate-400 text-sm mb-8 max-w-xs">
                  Sophyra will conduct your {session?.role} interview. Make sure your microphone is on before starting.
                </p>

                {startError && (
                  <div className="mb-6 flex items-start space-x-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 max-w-sm w-full text-left">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">{startError}</p>
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left max-w-sm w-full space-y-2">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">What to expect</p>
                  {['8 tailored questions for your role', 'Natural voice conversation', '15–20 minute session', 'Detailed performance report after'].map((item, i) => (
                    <div key={i} className="flex items-center space-x-2 text-sm text-slate-300">
                      <span className="w-1.5 h-1.5 bg-brand-electric rounded-full flex-shrink-0"></span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleStart}
                  disabled={connecting}
                  className="px-10 py-4 bg-brand-electric text-white font-bold rounded-2xl hover:bg-brand-electric-dark transition-all shadow-lg shadow-brand-electric/30 text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Start Interview</span>
                  )}
                </button>
              </div>
            ) : ended ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <PhoneOff className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Interview Complete</h2>
                <p className="text-slate-400 text-sm">Generating your performance report...</p>
                <div className="mt-4 flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 bg-brand-electric rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }}></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 h-[calc(100vh-180px)]">
                <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {isSpeaking && (
                        <>
                          <div className="absolute inset-0 rounded-full bg-brand-electric/10 animate-ping scale-150"></div>
                          <div className="absolute inset-0 rounded-full bg-brand-electric/5 animate-ping scale-200" style={{ animationDelay: '200ms' }}></div>
                        </>
                      )}
                      <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${isSpeaking ? 'bg-brand-electric/20 border-2 border-brand-electric/60 shadow-lg shadow-brand-electric/20' : 'bg-slate-800 border border-white/10'}`}>
                        <Brain className={`w-14 h-14 transition-colors ${isSpeaking ? 'text-brand-electric' : 'text-slate-500'}`} />
                      </div>
                    </div>
                  </div>

                  {isSpeaking && (
                    <div className="absolute bottom-16 left-0 right-0 flex items-end justify-center space-x-1 h-8">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-brand-electric rounded-full animate-pulse"
                          style={{
                            height: `${20 + (i % 4) * 20}%`,
                            animationDelay: `${i * 60}ms`,
                            animationDuration: `${400 + i * 50}ms`,
                          }}
                        ></div>
                      ))}
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center space-x-2">
                    <span className="text-xs font-semibold text-white">Sophyra AI</span>
                    {isSpeaking && <span className="text-xs text-brand-electric">Speaking...</span>}
                  </div>
                </div>

                <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-white/5">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover scale-x-[-1] ${!cameraEnabled || cameraError ? 'hidden' : ''}`}
                  />

                  {(!cameraEnabled || cameraError) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
                        <span className="text-3xl font-bold text-slate-400">
                          {candidateNameRef.current.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center space-x-2">
                    <span className="text-xs font-semibold text-white">{candidateNameRef.current}</span>
                    {!micEnabled && <MicOff className="w-3 h-3 text-red-400" />}
                  </div>

                  {!micEnabled && (
                    <div className="absolute top-3 right-3 bg-red-500/20 border border-red-500/40 rounded-full p-1.5">
                      <MicOff className="w-3 h-3 text-red-400" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {showTranscript && (
          <div className="w-80 border-l border-white/5 flex flex-col bg-slate-900">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">Live Transcript</h3>
              <button
                onClick={() => setShowTranscript(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcript.length === 0 ? (
                <p className="text-xs text-slate-500 text-center mt-8">
                  Transcript will appear here as the interview progresses
                </p>
              ) : (
                transcript.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.source === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${msg.source === 'user' ? 'bg-brand-electric/20 text-white border border-brand-electric/20' : 'bg-white/5 text-slate-300 border border-white/5'}`}>
                      <p className={`text-[10px] font-semibold mb-1 ${msg.source === 'user' ? 'text-brand-electric-light' : 'text-slate-400'}`}>
                        {msg.source === 'user' ? 'You' : 'Sophyra'}
                      </p>
                      <p className="leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}
      </main>

      {started && !ended && (
        <footer className="flex items-center justify-center space-x-4 px-6 py-4 border-t border-white/5">
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${micEnabled ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' : 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'}`}
            title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleCamera}
            disabled={cameraError}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${cameraEnabled && !cameraError ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' : 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'} disabled:opacity-40 disabled:cursor-not-allowed`}
            title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraEnabled && !cameraError ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={confirmEnd}
            className="h-12 px-6 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full flex items-center space-x-2 transition-all shadow-lg shadow-red-500/20"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-sm">End Interview</span>
          </button>
        </footer>
      )}
    </div>
  );
}
