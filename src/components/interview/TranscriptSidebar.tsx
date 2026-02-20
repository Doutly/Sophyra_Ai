import { useEffect, useRef } from 'react';
import { X, Brain, MessageSquare } from 'lucide-react';
import type { TranscriptMessage } from '../../pages/InterviewRoomV2';

interface Props {
  transcript: TranscriptMessage[];
  candidateName: string;
  onClose: () => void;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TranscriptSidebar({ transcript, candidateName, onClose }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-white border-l border-slate-200 animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Live Transcript</h3>
          {transcript.length > 0 && (
            <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-medium">
              {transcript.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex space-x-1 mb-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <p className="text-sm text-slate-400 font-medium">Waiting for conversation</p>
            <p className="text-xs text-slate-300 mt-1">Messages will appear here</p>
          </div>
        ) : (
          transcript.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.source === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mb-1 ${
                msg.source === 'ai'
                  ? 'bg-brand-electric/10 border border-brand-electric/20'
                  : 'bg-slate-100 border border-slate-200'
              }`}>
                {msg.source === 'ai' ? (
                  <Brain className="w-3 h-3 text-brand-electric" />
                ) : (
                  <span className="text-[9px] font-bold text-slate-500">
                    {candidateName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className={`max-w-[80%] ${msg.source === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  msg.source === 'user'
                    ? 'bg-brand-electric text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-700 border border-slate-200 rounded-bl-sm'
                }`}>
                  {msg.message}
                </div>
                <span className="text-[10px] text-slate-300 mt-1 px-1">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
