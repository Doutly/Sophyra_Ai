import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { SimliClient, LogLevel } from 'simli-client';
import { Brain } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export type SimliAvatarStatus = 'idle' | 'loading' | 'connected' | 'speaking' | 'error' | 'fallback';

export interface SimliAvatarPanelHandle {
  sendAudioData: (data: Uint8Array) => void;
  listenToMediastreamTrack: (track: MediaStreamTrack) => void;
  clearBuffer: () => void;
  stop: () => Promise<void>;
}

interface SimliAvatarPanelProps {
  isSpeaking: boolean;
  candidateName?: string;
  onStatusChange?: (status: SimliAvatarStatus) => void;
}

async function fetchSessionToken(): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/simli-session-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ maxSessionLength: 600, maxIdleTime: 180 }),
  });
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
  const data = await res.json();
  if (!data.session_token) throw new Error('No session token in response');
  return data.session_token;
}

const SimliAvatarPanel = forwardRef<SimliAvatarPanelHandle, SimliAvatarPanelProps>(
  ({ isSpeaking, onStatusChange }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const simliClientRef = useRef<SimliClient | null>(null);
    const [status, setStatus] = useState<SimliAvatarStatus>('idle');
    const [videoVisible, setVideoVisible] = useState(false);
    const statusRef = useRef<SimliAvatarStatus>('idle');

    const updateStatus = useCallback((s: SimliAvatarStatus) => {
      statusRef.current = s;
      setStatus(s);
      onStatusChange?.(s);
    }, [onStatusChange]);

    const cleanup = useCallback(async () => {
      if (simliClientRef.current) {
        try {
          await simliClientRef.current.stop();
        } catch {
          // ignore cleanup errors
        }
        simliClientRef.current = null;
      }
    }, []);

    useEffect(() => {
      let cancelled = false;

      const init = async () => {
        if (!videoRef.current || !audioRef.current) return;
        updateStatus('loading');

        try {
          const token = await fetchSessionToken();
          if (cancelled) return;

          const client = new SimliClient(
            token,
            videoRef.current,
            audioRef.current,
            null,
            LogLevel.INFO,
            'livekit'
          );

          client.on('start', () => {
            if (cancelled) return;
            setVideoVisible(true);
            updateStatus('connected');
          });

          client.on('speaking', () => {
            if (cancelled) return;
            updateStatus('speaking');
          });

          client.on('silent', () => {
            if (cancelled) return;
            if (statusRef.current === 'speaking') {
              updateStatus('connected');
            }
          });

          client.on('stop', () => {
            if (cancelled) return;
            updateStatus('idle');
            setVideoVisible(false);
          });

          client.on('error', () => {
            if (cancelled) return;
            updateStatus('fallback');
            setVideoVisible(false);
          });

          client.on('startup_error', (msg: string) => {
            if (cancelled) return;
            console.error('Simli startup error:', msg);
            updateStatus('fallback');
            setVideoVisible(false);
          });

          simliClientRef.current = client;
          await client.start();
        } catch (err) {
          if (cancelled) return;
          console.error('Simli init error:', err);
          updateStatus('fallback');
        }
      };

      init();

      return () => {
        cancelled = true;
        cleanup();
      };
    }, []);

    useImperativeHandle(ref, () => ({
      sendAudioData: (data: Uint8Array) => {
        simliClientRef.current?.sendAudioData(data);
      },
      listenToMediastreamTrack: (track: MediaStreamTrack) => {
        simliClientRef.current?.listenToMediastreamTrack(track);
      },
      clearBuffer: () => {
        simliClientRef.current?.ClearBuffer();
      },
      stop: async () => {
        await cleanup();
      },
    }));

    const isFallback = status === 'fallback' || status === 'error';
    const isLoading = status === 'loading' || status === 'idle';
    const avatarSpeaking = status === 'speaking' || isSpeaking;

    return (
      <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-swiss-lg flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${videoVisible ? 'opacity-100' : 'opacity-0'}`}
        />
        <audio ref={audioRef} autoPlay className="hidden" />

        {!videoVisible && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              {avatarSpeaking && !isFallback && (
                <>
                  <div className="absolute w-36 h-36 rounded-full bg-brand-electric/10 animate-ping" />
                  <div
                    className="absolute w-44 h-44 rounded-full bg-brand-electric/5 animate-ping"
                    style={{ animationDelay: '300ms' }}
                  />
                </>
              )}
              <div
                className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
                  avatarSpeaking && !isFallback
                    ? 'bg-brand-electric/20 border-2 border-brand-electric/50 shadow-blue-glow'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {isLoading && !isFallback ? (
                  <div className="w-14 h-14 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-brand-electric border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <Brain
                    className={`w-14 h-14 transition-colors duration-300 ${
                      avatarSpeaking ? 'text-brand-electric' : 'text-slate-500'
                    }`}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {!videoVisible && avatarSpeaking && !isFallback && (
          <div className="absolute bottom-14 left-0 right-0 flex items-end justify-center space-x-0.5 h-8 px-8">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-brand-electric rounded-full animate-pulse"
                style={{
                  height: `${25 + Math.sin(i * 0.8) * 60}%`,
                  minHeight: '4px',
                  animationDelay: `${i * 45}ms`,
                  animationDuration: `${350 + i * 40}ms`,
                }}
              />
            ))}
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center space-x-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                avatarSpeaking
                  ? 'bg-green-400 animate-pulse'
                  : status === 'connected' || videoVisible
                  ? 'bg-green-600'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-xs font-semibold text-white">Sophyra AI</span>
            {avatarSpeaking && (
              <span className="text-xs text-brand-electric-light font-medium">Speaking...</span>
            )}
            {isLoading && !isFallback && (
              <span className="text-xs text-slate-400 font-medium">Loading avatar...</span>
            )}
          </div>
          <div className="bg-black/40 backdrop-blur-sm rounded-md px-2 py-1">
            <span className="text-xs text-slate-400">HR Interviewer</span>
          </div>
        </div>
      </div>
    );
  }
);

SimliAvatarPanel.displayName = 'SimliAvatarPanel';

export default SimliAvatarPanel;
