import { useState, useEffect } from 'react';
import { Mic, Volume2, Loader } from 'lucide-react';

interface VoiceAgentUIProps {
  isAISpeaking: boolean;
  isUserSpeaking: boolean;
  currentQuestion: string;
  transcript: string;
  volumeLevel: number;
  questionNumber: number;
  totalQuestions: number;
  aiName?: string;
}

export default function VoiceAgentUI({
  isAISpeaking,
  isUserSpeaking,
  currentQuestion,
  transcript,
  volumeLevel,
  questionNumber,
  totalQuestions,
  aiName = 'Sarah',
}: VoiceAgentUIProps) {
  const [waveform, setWaveform] = useState<number[]>(Array(40).fill(0));

  useEffect(() => {
    if (isAISpeaking || isUserSpeaking) {
      const interval = setInterval(() => {
        setWaveform(prev => {
          const newWave = prev.map(() => {
            const base = isUserSpeaking ? volumeLevel / 100 : 0.5;
            return base + Math.random() * 0.5;
          });
          return newWave;
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      setWaveform(Array(40).fill(0));
    }
  }, [isAISpeaking, isUserSpeaking, volumeLevel]);

  const getStatusText = () => {
    if (isAISpeaking) return 'Speaking...';
    if (isUserSpeaking) return 'Listening...';
    return 'Waiting for you to speak...';
  };

  const getStatusColor = () => {
    if (isAISpeaking) return 'text-brand-electric-light';
    if (isUserSpeaking) return 'text-blue-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Progress indicator - minimal */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-400 text-sm">
            <span>Question {questionNumber} of {totalQuestions}</span>
            <div className="flex space-x-1">
              {Array.from({ length: totalQuestions }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i < questionNumber ? 'bg-brand-electric' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main voice agent interface */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-12 border border-gray-700/50 shadow-2xl">
          {/* AI Avatar Circle */}
          <div className="flex flex-col items-center mb-12">
            <div className="relative">
              {/* Pulsing rings when speaking */}
              {isAISpeaking && (
                <>
                  <div className="absolute inset-0 rounded-full bg-brand-electric/20 animate-ping" />
                  <div className="absolute inset-0 rounded-full bg-brand-electric/10 animate-pulse" />
                </>
              )}

              {/* Main avatar circle */}
              <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                isAISpeaking
                  ? 'bg-gradient-to-br from-brand-electric to-blue-500 shadow-lg shadow-brand-electric/50'
                  : isUserSpeaking
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50'
                  : 'bg-gradient-to-br from-gray-600 to-gray-700'
              }`}>
                {isAISpeaking ? (
                  <Volume2 className="w-12 h-12 text-white animate-pulse" />
                ) : isUserSpeaking ? (
                  <Mic className="w-12 h-12 text-white animate-pulse" />
                ) : (
                  <Volume2 className="w-12 h-12 text-gray-400" />
                )}
              </div>
            </div>

            {/* AI Name */}
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-semibold text-white">{aiName}</h2>
              <p className={`text-sm mt-1 ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
          </div>

          {/* Waveform visualization */}
          <div className="mb-8">
            <div className="flex items-end justify-center space-x-1 h-20">
              {waveform.map((height, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-100 ${
                    isAISpeaking
                      ? 'bg-gradient-to-t from-brand-electric to-blue-500'
                      : isUserSpeaking
                      ? 'bg-gradient-to-t from-blue-500 to-purple-500'
                      : 'bg-gray-700'
                  }`}
                  style={{
                    height: `${Math.max(4, height * 100)}%`,
                    opacity: height > 0 ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Current question (when AI is speaking) */}
          {isAISpeaking && currentQuestion && (
            <div className="mb-6 p-6 bg-gray-900/50 rounded-2xl border border-brand-electric/30">
              <div className="flex items-start space-x-3">
                <Volume2 className="w-5 h-5 text-brand-electric-light mt-1 flex-shrink-0 animate-pulse" />
                <p className="text-lg text-gray-200 leading-relaxed">
                  {currentQuestion}
                </p>
              </div>
            </div>
          )}

          {/* User's response (when user is speaking) */}
          {isUserSpeaking && transcript && (
            <div className="mb-6 p-6 bg-gray-900/50 rounded-2xl border border-blue-500/30">
              <div className="flex items-start space-x-3">
                <Mic className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0 animate-pulse" />
                <div className="flex-1">
                  <p className="text-lg text-gray-200 leading-relaxed">
                    {transcript}
                  </p>
                  <div className="flex items-center space-x-2 mt-3">
                    <div className="flex space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {transcript.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Waiting state */}
          {!isAISpeaking && !isUserSpeaking && (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2 text-gray-400">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
                <span className="text-sm">Ready when you are...</span>
              </div>
            </div>
          )}

          {/* Subtle hints */}
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <div className="flex items-center justify-center space-x-8 text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-brand-electric" />
                <span>AI Speaking</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>You're Speaking</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span>Waiting</span>
              </div>
            </div>
          </div>
        </div>

        {/* Processing indicator */}
        {!isAISpeaking && !isUserSpeaking && transcript && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-3 text-gray-400 bg-gray-800/50 px-6 py-3 rounded-full backdrop-blur-xl border border-gray-700/50">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Processing your answer...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
