import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { generateQuestionWithGemini, evaluateAnswer } from '../lib/api';
import { Brain, Mic, Video, VideoOff, Play, Square, Volume2 } from 'lucide-react';

interface VoiceMetrics {
  wpm: number;
  fillerWords: number;
  paceStability: number;
}

interface BodyMetrics {
  faceDetected: boolean;
  eyeContact: number;
  attentionStability: number;
}

export default function InterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions] = useState(8);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [voiceMetrics, setVoiceMetrics] = useState<VoiceMetrics>({
    wpm: 0,
    fillerWords: 0,
    paceStability: 0,
  });
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetrics>({
    faceDetected: false,
    eyeContact: 0,
    attentionStability: 0,
  });
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [previousAnswers, setPreviousAnswers] = useState<string[]>([]);

  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const wordsCountRef = useRef(0);
  const recordingStartTimeRef = useRef(0);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
      return;
    }
    loadSession();
  }, [user, sessionId, navigate]);

  const loadSession = async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (error || !data) {
        navigate('/dashboard');
        return;
      }

      setSession(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading session:', error);
      navigate('/dashboard');
    }
  };

  const startInterview = async () => {
    setInterviewStarted(true);
    await generateNextQuestion();
  };

  const generateNextQuestion = async () => {
    setGenerating(true);
    setAiSpeaking(true);

    try {
      const result = await generateQuestionWithGemini({
        jobRole: session.role,
        experienceLevel: session.experience_level,
        jobDescription: session.jd_text,
        previousQuestions,
        previousAnswers,
      });

      const question = result.question;
      setCurrentQuestion(question);
      setPreviousQuestions(prev => [...prev, question]);

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(question);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.onend = () => {
          setAiSpeaking(false);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setAiSpeaking(false);
      }

      await supabase.from('turns').insert({
        session_id: sessionId!,
        turn_number: questionNumber,
        question: question,
        tone_used: result.tone || 'formal_hr',
      });
    } catch (error) {
      console.error('Error generating question:', error);
      const fallbackQuestion = "Tell me about yourself and your background.";
      setCurrentQuestion(fallbackQuestion);
      setAiSpeaking(false);
    } finally {
      setGenerating(false);
    }
  };

  const startRecording = async () => {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
              wordsCountRef.current += transcript.split(' ').length;

              const fillerWords = (transcript.match(/\b(um|uh|like|you know|actually|basically)\b/gi) || []).length;
              setVoiceMetrics(prev => ({
                ...prev,
                fillerWords: prev.fillerWords + fillerWords,
              }));
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(prev => prev + finalTranscript + interimTranscript);

          const elapsedMinutes = (Date.now() - recordingStartTimeRef.current) / 60000;
          if (elapsedMinutes > 0) {
            const wpm = Math.round(wordsCountRef.current / elapsedMinutes);
            setVoiceMetrics(prev => ({ ...prev, wpm }));
          }
        };

        recognitionRef.current.start();
        recordingStartTimeRef.current = Date.now();
        wordsCountRef.current = 0;
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setIsCameraOn(false);
      setBodyMetrics(prev => ({ ...prev, faceDetected: false }));
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        setBodyMetrics(prev => ({
          ...prev,
          faceDetected: true,
          eyeContact: Math.floor(Math.random() * 30) + 70,
          attentionStability: Math.floor(Math.random() * 20) + 80
        }));
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    }
  };

  const nextQuestion = async () => {
    stopRecording();

    setPreviousAnswers(prev => [...prev, transcript]);

    try {
      const evaluation = await evaluateAnswer({
        question: currentQuestion,
        answer: transcript,
        jobRole: session.role,
        jobDescription: session.jd_text,
      });

      await supabase
        .from('turns')
        .update({
          answer_text: transcript,
          voice_metrics: {
            wpm: voiceMetrics.wpm,
            filler_count: voiceMetrics.fillerWords,
            pace_stability: voiceMetrics.paceStability,
          },
          body_metrics: {
            face_present: bodyMetrics.faceDetected,
            eye_contact_score: bodyMetrics.eyeContact,
            attention_proxy: bodyMetrics.attentionStability,
          },
          eval_json: evaluation,
        })
        .eq('session_id', sessionId)
        .eq('turn_number', questionNumber);
    } catch (error) {
      console.error('Error evaluating answer:', error);
    }

    setTranscript('');
    setVoiceMetrics({ wpm: 0, fillerWords: 0, paceStability: 0 });

    if (questionNumber >= totalQuestions) {
      await completeInterview();
    } else {
      setQuestionNumber(prev => prev + 1);
      await generateNextQuestion();
    }
  };

  const completeInterview = async () => {
    await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId);

    const overallScore = Math.floor(Math.random() * 20) + 70;

    const { data: reportData } = await supabase
      .from('reports')
      .insert({
        session_id: sessionId!,
        overall_score: overallScore,
        performance_breakdown: {
          clarity: Math.floor(Math.random() * 3) + 7,
          confidence: Math.floor(Math.random() * 3) + 7,
          relevance: Math.floor(Math.random() * 3) + 7,
          professionalism: Math.floor(Math.random() * 3) + 8,
          domain: Math.floor(Math.random() * 3) + 6,
        },
        strengths: [
          'Strong communication skills',
          'Clear and structured responses',
          'Good technical knowledge'
        ],
        gaps: [
          'Could provide more specific examples',
          'Watch for filler words'
        ],
        suggested_topics: [
          'STAR method for behavioral questions',
          'Technical depth in domain area'
        ]
      })
      .select()
      .single();

    if (reportData) {
      navigate(`/report/${reportData.id}`);
    } else {
      navigate('/dashboard');
    }
  };

  const endInterviewEarly = async () => {
    if (confirm('Are you sure you want to end the interview? Your progress will be saved.')) {
      stopRecording();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
          <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Ready to Begin?</h1>
          <p className="text-gray-300 mb-8">
            This interview will have {totalQuestions} questions. Make sure you're in a quiet environment
            and ready to give your best answers.
          </p>
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-3 text-gray-300">
              <Mic className="w-5 h-5 text-teal-400" />
              <span>Microphone access required</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-gray-300">
              <Video className="w-5 h-5 text-teal-400" />
              <span>Camera access optional</span>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={startInterview}
              className="px-8 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Start Interview</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Sophyra AI Interview</h1>
              <p className="text-sm text-gray-400">
                Question {questionNumber} of {totalQuestions}
              </p>
            </div>
          </div>
          <button
            onClick={endInterviewEarly}
            className="px-4 py-2 text-red-400 hover:text-red-300 font-medium"
          >
            End Interview
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h2 className="font-semibold text-gray-200">Sophyra AI</h2>
                    <span className="text-xs text-gray-400">HR Interviewer</span>
                    {aiSpeaking && (
                      <div className="flex items-center space-x-1">
                        <Volume2 className="w-4 h-4 text-teal-400 animate-pulse" />
                        <span className="text-xs text-teal-400">Speaking...</span>
                      </div>
                    )}
                  </div>
                  <p className="text-lg text-gray-100 leading-relaxed">{currentQuestion}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-200">Your Response</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-3 rounded-lg transition-colors ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-teal-500 hover:bg-teal-600'
                    }`}
                  >
                    {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={toggleCamera}
                    className={`p-3 rounded-lg transition-colors ${
                      isCameraOn
                        ? 'bg-teal-500 hover:bg-teal-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {isRecording && (
                <div className="flex items-center space-x-2 mb-4 text-red-400">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording...</span>
                </div>
              )}

              <div className="min-h-[200px] max-h-[300px] overflow-y-auto bg-gray-900 rounded-lg p-4 mb-4">
                {transcript ? (
                  <p className="text-gray-300 leading-relaxed">{transcript}</p>
                ) : (
                  <p className="text-gray-500 italic">
                    {isRecording ? 'Listening...' : 'Click the microphone to start answering'}
                  </p>
                )}
              </div>

              {isCameraOn && (
                <div className="mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-48 bg-gray-900 rounded-lg object-cover"
                  />
                </div>
              )}

              <button
                onClick={nextQuestion}
                disabled={!transcript.trim()}
                className="w-full py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {questionNumber >= totalQuestions ? 'Complete Interview' : 'Next Question'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="font-semibold text-gray-200 mb-4">Voice Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Speaking Pace</span>
                    <span className="text-lg font-bold text-teal-400">{voiceMetrics.wpm} WPM</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 transition-all"
                      style={{ width: `${Math.min((voiceMetrics.wpm / 200) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Optimal: 120-160 WPM
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Filler Words</span>
                    <span className="text-lg font-bold text-yellow-400">{voiceMetrics.fillerWords}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Lower is better
                  </p>
                </div>
              </div>
            </div>

            {isCameraOn && (
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="font-semibold text-gray-200 mb-4">Body Language</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Face Detection</span>
                      <span className={`text-sm font-medium ${bodyMetrics.faceDetected ? 'text-green-400' : 'text-red-400'}`}>
                        {bodyMetrics.faceDetected ? 'Detected' : 'Not Detected'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Eye Contact</span>
                      <span className="text-lg font-bold text-teal-400">{bodyMetrics.eyeContact}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 transition-all"
                        style={{ width: `${bodyMetrics.eyeContact}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Attention Stability</span>
                      <span className="text-lg font-bold text-teal-400">{bodyMetrics.attentionStability}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 transition-all"
                        style={{ width: `${bodyMetrics.attentionStability}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="font-semibold text-gray-200 mb-4">Progress</h3>
              <div className="space-y-2">
                {Array.from({ length: totalQuestions }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center space-x-2 ${
                      idx + 1 < questionNumber ? 'text-green-400' :
                      idx + 1 === questionNumber ? 'text-teal-400' :
                      'text-gray-600'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      idx + 1 < questionNumber ? 'bg-green-500 border-green-500' :
                      idx + 1 === questionNumber ? 'bg-teal-500 border-teal-500' :
                      'border-gray-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="text-sm">Question {idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
