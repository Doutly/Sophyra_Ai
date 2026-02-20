import { RefObject } from 'react';
import {
  Brain,
  Mic,
  MicOff,
  Video,
  VideoOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  session: any;
  candidateName: string;
  videoRef: RefObject<HTMLVideoElement>;
  cameraEnabled: boolean;
  cameraError: boolean;
  micEnabled: boolean;
  connecting: boolean;
  startError: string | null;
  onStart: () => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
}

export default function PreInterviewScreen({
  session,
  candidateName,
  videoRef,
  cameraEnabled,
  cameraError,
  micEnabled,
  connecting,
  startError,
  onStart,
  onToggleCamera,
  onToggleMic,
}: Props) {
  const navigate = useNavigate();

  const deviceChecks = [
    {
      label: 'Microphone',
      ok: micEnabled,
      icon: micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />,
    },
    {
      label: 'Camera',
      ok: !cameraError,
      icon: !cameraError ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="flex items-center px-6 py-4 bg-white border-b border-slate-200 shadow-swiss-sm">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium mr-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 bg-brand-electric rounded-lg flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-slate-800 font-semibold text-sm">Interview Room</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-3">
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video shadow-swiss-lg border border-slate-800">
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
                        {candidateName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">
                      {cameraError ? 'Camera unavailable' : 'Camera off'}
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-xs font-semibold text-white">{candidateName}</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 bg-white rounded-xl border border-slate-200 shadow-swiss-sm px-4 py-3">
              <button
                onClick={onToggleMic}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  micEnabled
                    ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                }`}
              >
                {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span>{micEnabled ? 'Mic On' : 'Mic Off'}</span>
              </button>

              <button
                onClick={onToggleCamera}
                disabled={cameraError}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                  cameraEnabled && !cameraError
                    ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                }`}
              >
                {cameraEnabled && !cameraError ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span>{cameraEnabled && !cameraError ? 'Camera On' : 'Camera Off'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-white rounded-2xl border border-slate-200 shadow-swiss-lg p-6">
            <div>
              <div className="flex items-start space-x-4 mb-6 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-brand-electric/10 border border-brand-electric/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-brand-electric">
                    {candidateName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-base">{candidateName}</p>
                  <p className="text-slate-500 text-sm">Candidate</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Interview Details</p>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Role</span>
                    <span className="text-sm font-semibold text-slate-800">{session?.role || '—'}</span>
                  </div>
                  {session?.company && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Company</span>
                      <span className="text-sm font-semibold text-slate-800">{session.company}</span>
                    </div>
                  )}
                  {session?.experienceLevel && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Experience</span>
                      <span className="text-sm font-semibold text-slate-800 capitalize">{session.experienceLevel}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Interviewer</span>
                    <span className="text-sm font-semibold text-slate-800">Sophyra AI</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Device Check</p>
                <div className="space-y-2">
                  {deviceChecks.map((check) => (
                    <div
                      key={check.label}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
                        check.ok
                          ? 'bg-green-50 border-green-100 text-green-700'
                          : 'bg-red-50 border-red-100 text-red-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {check.icon}
                        <span className="font-medium">{check.label}</span>
                      </div>
                      {check.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">What to expect</p>
                <div className="space-y-1.5">
                  {[
                    '8 tailored questions for your role',
                    'Natural voice conversation',
                    '15–20 minute session',
                    'Detailed performance report after',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center space-x-2 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 bg-brand-electric rounded-full flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              {startError && (
                <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-left">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">{startError}</p>
                </div>
              )}

              <button
                onClick={onStart}
                disabled={connecting}
                className="w-full h-12 bg-brand-electric hover:bg-brand-electric-dark active:scale-[0.99] text-white font-bold rounded-xl transition-all shadow-md shadow-brand-electric/25 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Sophyra...</span>
                  </>
                ) : (
                  <span>Start Interview</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
