import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useConversation } from '@elevenlabs/react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Wifi,
  WifiOff,
  Brain,
  Code2,
  Users,
  Volume2,
  VolumeX,
  CheckCircle2,
} from 'lucide-react';
import CodeEditorPanel from '../components/interview/CodeEditorPanel';
import TranscriptSidebar from '../components/interview/TranscriptSidebar';
import PreInterviewScreen from '../components/interview/PreInterviewScreen';
import SimliAvatarPanel, { SimliAvatarPanelHandle, SimliAvatarStatus } from '../components/interview/SimliAvatarPanel';

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
const MAX_JD_LENGTH = 800;

export interface TranscriptMessage {
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
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cameraError, setCameraError] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<SimliAvatarStatus>('idle');

  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const candidateNameRef = useRef('Candidate');
  const startedRef = useRef(false);
  const endedRef = useRef(false);
  const transcriptCountRef = useRef(0);
  const connectingRef = useRef(false);
  const connectedAtRef = useRef<number | null>(null);
  const simliRef = useRef<SimliAvatarPanelHandle>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const conversation = useConversation({
    agentId: AGENT_ID,
    connectionType: 'websocket',
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
      startedRef.current = false;
      setConnecting(false);
      setStarted(false);
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

  useEffect(() => {
    if (!videoRef.current || !localStreamRef.current) return;
    if (videoRef.current.srcObject !== localStreamRef.current) {
      videoRef.current.srcObject = localStreamRef.current;
    }
  });

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
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const rawJd = session.jdText || 'General interview questions';
      const jd = rawJd.length > MAX_JD_LENGTH ? rawJd.slice(0, MAX_JD_LENGTH) + '...' : rawJd;
      const company = session.company || 'a company';
      const role = session.role || 'the position';

      const convId = await conversation.startSession({
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

  const stopAudioBridge = useCallback(() => {
    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current = null;
    }
    if (audioSourceRef.current) {
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const handleEnd = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    connectedAtRef.current = null;
    setEnded(true);

    if (timerRef.current) clearInterval(timerRef.current);

    stopAudioBridge();

    try {
      await simliRef.current?.stop();
    } catch {
      /* ignore */
    }

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
  }, [sessionId, conversation, navigate, stopAudioBridge]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-electric border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Preparing your interview room...</p>
        </div>
      </div>
    );
  }

  if (!started && !ended) {
    return (
      <>
        <div className="hidden" aria-hidden="true">
          <SimliAvatarPanel
            ref={simliRef}
            isSpeaking={false}
            userId={user?.uid}
            onStatusChange={setAvatarStatus}
          />
        </div>
        <PreInterviewScreen
          session={session}
          candidateName={candidateNameRef.current}
          videoRef={videoRef}
          cameraEnabled={cameraEnabled}
          cameraError={cameraError}
          micEnabled={micEnabled}
          connecting={connecting}
          startError={startError}
          avatarStatus={avatarStatus}
          onStart={handleStart}
          onToggleCamera={toggleCamera}
          onToggleMic={toggleMic}
        />
      </>
    );
  }

  if (ended) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-swiss-xl border border-slate-100 p-12 text-center max-w-sm w-full mx-4 animate-scale-in">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Interview Complete</h2>
          <p className="text-slate-500 text-sm mb-2">
            Duration: <span className="font-semibold text-slate-700">{formatTime(elapsedSeconds)}</span>
          </p>
          <p className="text-slate-400 text-sm mb-6">Generating your performance report...</p>
          <div className="flex justify-center space-x-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-brand-electric rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden select-none">
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 shadow-swiss-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-electric rounded-lg flex items-center justify-center shadow-sm">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-slate-900 font-semibold text-sm leading-none">
              {session?.role || 'Mock Interview'}
            </p>
            {session?.company && (
              <p className="text-slate-400 text-xs mt-0.5">{session.company}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {started && !ended && (
            <div className="flex items-center space-x-2 bg-red-50 border border-red-100 rounded-full px-3.5 py-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-slate-800 text-sm font-mono font-semibold tabular-nums tracking-wider">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          )}

          <div className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${
            connectionStatus === 'connected'
              ? 'bg-green-50 text-green-700 border-green-200'
              : connectionStatus === 'connecting'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {connectionStatus === 'connected' ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="capitalize">
              {connectionStatus === 'connected'
                ? 'Live'
                : connectionStatus === 'connecting'
                ? 'Connecting'
                : 'Ready'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className={`flex-1 p-4 grid gap-4 min-h-0 ${showCodeEditor ? 'grid-rows-[1fr_auto]' : 'grid-rows-[1fr]'}`}>
            <div className="grid grid-cols-2 gap-4 min-h-0">
              <SimliAvatarPanel
                ref={simliRef}
                isSpeaking={isSpeaking}
                userId={user?.uid}
              />

              <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-swiss-lg min-h-0">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover scale-x-[-1] ${!cameraEnabled || cameraError ? 'hidden' : ''}`}
                />

                {(!cameraEnabled || cameraError) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center mx-auto mb-3">
                        <span className="text-3xl font-bold text-slate-300">
                          {candidateNameRef.current.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs">Camera off</p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="text-xs font-semibold text-white">{candidateNameRef.current}</span>
                    {!micEnabled && <MicOff className="w-3 h-3 text-red-400" />}
                  </div>
                  <div className="bg-black/40 backdrop-blur-sm rounded-md px-2 py-1">
                    <span className="text-xs text-slate-400">You</span>
                  </div>
                </div>

                {!micEnabled && (
                  <div className="absolute top-3 right-3 bg-red-500/20 border border-red-500/40 rounded-full p-1.5">
                    <MicOff className="w-3 h-3 text-red-400" />
                  </div>
                )}
              </div>
            </div>

            {showCodeEditor && (
              <CodeEditorPanel onClose={() => setShowCodeEditor(false)} />
            )}
          </div>

          <footer className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white border-t border-slate-200 shadow-swiss-sm">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 bg-slate-100 rounded-full px-3 py-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-medium text-slate-600">2 participants</span>
              </div>
              <button
                onClick={() => setShowTranscript((v) => !v)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  showTranscript
                    ? 'bg-brand-electric text-white border-brand-electric'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                title="Toggle transcript"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Transcript</span>
                {transcript.length > 0 && (
                  <span className={`text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold ${showTranscript ? 'bg-white/20 text-white' : 'bg-brand-electric text-white'}`}>
                    {transcript.length > 9 ? '9+' : transcript.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowCodeEditor((v) => !v)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  showCodeEditor
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                title="Toggle code editor"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code Editor</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMic}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border shadow-swiss-sm ${
                  micEnabled
                    ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                }`}
                title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                {micEnabled ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
              </button>

              <button
                onClick={toggleCamera}
                disabled={cameraError}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border shadow-swiss-sm ${
                  cameraEnabled && !cameraError
                    ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {cameraEnabled && !cameraError ? <Video className="w-4.5 h-4.5" /> : <VideoOff className="w-4.5 h-4.5" />}
              </button>

              <button
                onClick={() => setSpeakerEnabled((v) => !v)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border shadow-swiss-sm ${
                  speakerEnabled
                    ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                }`}
                title={speakerEnabled ? 'Mute speaker' : 'Unmute speaker'}
              >
                {speakerEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
              </button>
            </div>

            <div className="flex items-center">
              <button
                onClick={confirmEnd}
                className="flex items-center space-x-2 h-11 px-5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold rounded-full transition-all shadow-sm text-sm"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Interview</span>
              </button>
            </div>
          </footer>
        </div>

        {showTranscript && (
          <TranscriptSidebar
            transcript={transcript}
            candidateName={candidateNameRef.current}
            onClose={() => setShowTranscript(false)}
          />
        )}
      </main>
    </div>
  );
}
