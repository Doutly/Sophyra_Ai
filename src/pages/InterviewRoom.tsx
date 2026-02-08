import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { generateQuestionWithGemini, evaluateAnswer } from '../lib/api';
import { Brain, Mic, Video, VideoOff, Play, Square, Volume2, VolumeX, Power } from 'lucide-react';
import { elevenLabs, conversationalVoiceConfig, professionalVoiceConfig } from '../lib/elevenLabs';
import { ConversationalAI } from '../lib/conversationalAI';
import VoiceAgentUI from '../components/VoiceAgentUI';
import { ElevenLabsStreamService, ElevenLabsSTTService, createStreamService, createSTTService } from '../lib/elevenLabsStream';
import { ConversationStateManager, createConversationState } from '../lib/conversationState';
import { createVAD, createInterruptionDetector, InterruptionDetector } from '../lib/voiceActivityDetection';
import { AutoInterviewController, createAutoInterviewController, InterviewState as AutoInterviewState } from '../lib/autoInterviewController';
import { QuestionQueueManager, createQuestionQueue } from '../lib/questionQueueManager';
import { VoiceConsistencyManager, createVoiceManager } from '../lib/voiceConsistencyManager';
import { EnhancedSTTService, createEnhancedSTT, STTResult } from '../lib/enhancedSTT';
import {
  PROFESSIONAL_WELCOME,
  FINAL_FAREWELL,
  wrapQuestionWithContext,
  determineInterviewPhase,
  getAnswerAcknowledgment,
  InterviewPhase
} from '../lib/interviewDialogue';

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
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  const [conversationalAI, setConversationalAI] = useState<ConversationalAI | null>(null);
  const [currentPhase, setCurrentPhase] = useState<InterviewPhase['phase']>('welcome');
  const [showWelcome, setShowWelcome] = useState(true);
  const [acknowledgment, setAcknowledgment] = useState<string>('');
  const [useRealTimeStream, setUseRealTimeStream] = useState(true);
  const [conversationState, setConversationState] = useState<ConversationStateManager | null>(null);

  const [useAutoMode, setUseAutoMode] = useState(true);
  const [autoState, setAutoState] = useState<AutoInterviewState | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const streamServiceRef = useRef<ElevenLabsStreamService | null>(null);
  const sttServiceRef = useRef<ElevenLabsSTTService | null>(null);
  const enhancedSTTRef = useRef<EnhancedSTTService | null>(null);
  const interimTranscriptRef = useRef<string>('');
  const interruptionDetectorRef = useRef<InterruptionDetector | null>(null);
  const autoControllerRef = useRef<AutoInterviewController | null>(null);
  const questionQueueRef = useRef<QuestionQueueManager | null>(null);
  const voiceManagerRef = useRef<VoiceConsistencyManager | null>(null);

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

      const conversational = new ConversationalAI({
        jobRole: data.role,
        experienceLevel: data.experience_level,
        questionNumber: 1,
        totalQuestions,
        previousQuestions: [],
        previousAnswers: [],
      });
      setConversationalAI(conversational);

      const convState = createConversationState(sessionId);
      setConversationState(convState);

      const questionQueue = createQuestionQueue(sessionId, totalQuestions);
      await questionQueue.initialize();
      questionQueueRef.current = questionQueue;
      console.log('Question queue initialized');

      const voiceManager = createVoiceManager(sessionId);
      await voiceManager.initialize({
        experienceLevel: data.experience_level || 'experienced',
        voiceGender: 'female',
        voiceTone: data.experience_level === 'fresher' ? 'conversational' : 'professional',
      });
      voiceManagerRef.current = voiceManager;
      console.log('Voice manager initialized:', voiceManager.getVoiceDescription());

      if (useRealTimeStream) {
        await initializeRealTimeServices();
      }

      if (useAutoMode) {
        await initializeAutoMode();
      }

      await initializeEnhancedSTT();

      setLoading(false);
    } catch (error) {
      console.error('Error loading session:', error);
      navigate('/dashboard');
    }
  };

  const initializeRealTimeServices = async () => {
    try {
      const ELEVEN_LABS_API_KEY = 'sk_2feb87f2f52657be03e3ab471343a8017020f6ffaf7304a9';

      streamServiceRef.current = createStreamService(ELEVEN_LABS_API_KEY, {
        stability: session?.experience_level === 'fresher' ? 0.6 : 0.75,
        similarityBoost: 0.75,
        style: session?.experience_level === 'fresher' ? 0.7 : 0.4,
      });

      streamServiceRef.current.setCallbacks({
        onConnect: () => console.log('Stream service connected'),
        onComplete: () => setAiSpeaking(false),
        onError: (error) => console.error('Stream error:', error),
      });

      await streamServiceRef.current.connect();

      sttServiceRef.current = createSTTService(ELEVEN_LABS_API_KEY);

      console.log('Real-time services initialized');
    } catch (error) {
      console.error('Failed to initialize real-time services:', error);
      setUseRealTimeStream(false);
    }
  };

  const initializeAutoMode = async () => {
    try {
      const interruptionDetector = createInterruptionDetector({
        energyThreshold: -50,
        silenceThreshold: -60,
        silenceDuration: 2500,
        speechStartDelay: 200,
        minSpeechDuration: 400,
      });

      await interruptionDetector.initialize();

      const vad = interruptionDetector.getVAD();
      vad.setCallbacks({
        onVolumeChange: (volume) => setVolumeLevel(volume),
      });

      interruptionDetector.setOnInterrupt(() => {
        console.log('User interrupted, stopping AI speech');
        if (streamServiceRef.current) {
          streamServiceRef.current.stop();
        }
        setAiSpeaking(false);

        if (autoControllerRef.current) {
          autoControllerRef.current.onAISpeakingInterrupted();
        }
      });

      interruptionDetectorRef.current = interruptionDetector;

      const autoController = createAutoInterviewController({
        silenceThresholdMs: 2500,
        minAnswerLengthWords: 10,
        maxAnswerDurationMs: 180000,
        transitionDelayMs: 1500,
        interruptionEnabled: true,
      });

      autoController.initialize(vad);

      autoController.setCallbacks({
        onQuestionStart: (question, number) => {
          console.log(`Auto: Question ${number} started`);
          setCurrentQuestion(question);
          setQuestionNumber(number);
          interruptionDetector.setAISpeaking(true);
        },
        onQuestionEnd: () => {
          console.log('Auto: AI finished speaking, user can answer');
          interruptionDetector.setAISpeaking(false);
          setAiSpeaking(false);
          setIsRecording(true);
        },
        onAnswerStart: () => {
          console.log('Auto: User started answering');
          setTranscript('');
        },
        onAnswerComplete: async (answer, duration) => {
          console.log(`Auto: Answer completed (${duration}ms)`);
          setTranscript(answer);
          setPreviousAnswers(prev => [...prev, answer]);
          setIsRecording(false);

          if (conversationState) {
            conversationState.addTurn(currentQuestion, answer, []);
          }

          await evaluateAndSaveAnswer(answer);

          if (questionNumber < totalQuestions) {
            setTimeout(() => generateNextQuestion(), 1500);
          } else {
            completeInterview();
          }
        },
        onTransitionStart: () => {
          console.log('Auto: Transitioning to next question');
        },
        onStateChange: (state) => {
          setAutoState(state);
        },
        onError: (error) => {
          console.error('Auto controller error:', error);
        },
      });

      autoControllerRef.current = autoController;

      console.log('Auto mode initialized');
    } catch (error) {
      console.error('Failed to initialize auto mode:', error);
      setUseAutoMode(false);
    }
  };

  const initializeEnhancedSTT = async () => {
    try {
      const enhancedSTT = createEnhancedSTT({
        minConfidence: 0.7,
        fallbackEnabled: true,
        autoGainControl: true,
        echoCancellation: true,
      });

      await enhancedSTT.initialize();

      enhancedSTT.setCallbacks({
        onTranscript: (result: STTResult) => {
          if (result.isFinal) {
            const fullText = (transcript + ' ' + result.transcript).trim();
            setTranscript(fullText);

            if (autoControllerRef.current) {
              autoControllerRef.current.addTranscriptChunk(result.transcript, true);
            }
          } else {
            setTranscript(transcript + ' ' + result.transcript);
          }
        },
        onLowConfidence: (text, confidence) => {
          console.warn(`Low confidence (${confidence.toFixed(2)}): ${text}`);
        },
        onError: (error) => {
          console.error('Enhanced STT error:', error);
        },
      });

      enhancedSTTRef.current = enhancedSTT;
      console.log('Enhanced STT initialized');
    } catch (error) {
      console.error('Failed to initialize enhanced STT:', error);
    }
  };

  const speakWithStream = async (text: string) => {
    if (!streamServiceRef.current || !streamServiceRef.current.isConnected()) {
      fallbackToWebSpeech(text);
      return;
    }

    try {
      setAiSpeaking(true);
      await streamServiceRef.current.streamText(text);
    } catch (error) {
      console.error('Stream TTS error:', error);
      fallbackToWebSpeech(text);
    }
  };

  const startRealTimeListening = () => {
    if (!sttServiceRef.current) {
      startRecording();
      return;
    }

    sttServiceRef.current.startListening(
      (text, isFinal) => {
        if (isFinal) {
          const fullText = (transcript + ' ' + text).trim();
          setTranscript(fullText);
          interimTranscriptRef.current = '';

          if (autoControllerRef.current) {
            autoControllerRef.current.addTranscriptChunk(text, true);
          }
        } else {
          interimTranscriptRef.current = text;
          setTranscript(transcript + ' ' + text);

          if (autoControllerRef.current) {
            autoControllerRef.current.addTranscriptChunk(text, false);
          }
        }
      },
      (error) => {
        console.error('STT error:', error);
        startRecording();
      }
    );

    setIsRecording(true);
  };

  const stopRealTimeListening = () => {
    if (sttServiceRef.current) {
      sttServiceRef.current.stopListening();
    }
    setIsRecording(false);
  };

  const evaluateAndSaveAnswer = async (answer: string) => {
    try {
      const evaluation = await evaluateAnswer({
        question: currentQuestion,
        answer,
        jobRole: session.role,
        jobDescription: session.jd_text,
      });

      await supabase.from('turns').update({
        answer,
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
      }).eq('session_id', sessionId!).eq('turn_number', questionNumber);
    } catch (error) {
      console.error('Failed to evaluate answer:', error);
    }
  };

  const completeInterview = async () => {
    setInterviewStarted(false);

    if (interruptionDetectorRef.current) {
      interruptionDetectorRef.current.stop();
    }

    if (autoControllerRef.current) {
      autoControllerRef.current.completeInterview();
    }

    if (useRealTimeStream && streamServiceRef.current) {
      await speakWithStream(FINAL_FAREWELL);
    } else {
      fallbackToWebSpeech(FINAL_FAREWELL);
    }

    await supabase.from('sessions').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId!);

    setTimeout(() => {
      navigate(`/report/${sessionId}`);
    }, 3000);
  };

  const startInterview = async () => {
    setInterviewStarted(true);
    setShowWelcome(true);
    setCurrentQuestion(PROFESSIONAL_WELCOME);
    setAiSpeaking(true);

    if (useAutoMode && interruptionDetectorRef.current) {
      interruptionDetectorRef.current.start();
    }

    if (useRealTimeStream && streamServiceRef.current) {
      await speakWithStream(PROFESSIONAL_WELCOME);

      if (autoControllerRef.current) {
        autoControllerRef.current.onQuestionSpeakingComplete();
      }

      setTimeout(() => {
        setShowWelcome(false);
        generateNextQuestion();
      }, 2000);
    } else {
      const voiceConfig = session.experience_level === 'fresher'
        ? conversationalVoiceConfig
        : professionalVoiceConfig;

      if (useElevenLabs) {
        await elevenLabs.textToSpeech(
          PROFESSIONAL_WELCOME,
          voiceConfig,
          () => setAiSpeaking(true),
          () => {
            setAiSpeaking(false);
            setShowWelcome(false);
            setTimeout(() => generateNextQuestion(), 2000);
          },
          (error) => {
            console.error('TTS error:', error);
            fallbackToWebSpeech(PROFESSIONAL_WELCOME);
            setTimeout(() => {
              setShowWelcome(false);
              generateNextQuestion();
            }, 5000);
          }
        );
      } else {
        fallbackToWebSpeech(PROFESSIONAL_WELCOME);
        setTimeout(() => {
          setShowWelcome(false);
          generateNextQuestion();
        }, 8000);
      }
    }
  };

  const generateNextQuestion = async () => {
    if (!questionQueueRef.current) {
      console.error('Question queue not initialized');
      return;
    }

    if (!questionQueueRef.current.hasNextQuestion() && questionQueueRef.current.getCurrentQuestionNumber() > 1) {
      console.log('No more questions, completing interview');
      await completeInterview();
      return;
    }

    const currentQueueNumber = questionQueueRef.current.getCurrentQuestionNumber();
    console.log(`Generating question ${currentQueueNumber}/${totalQuestions}`);

    setAiSpeaking(true);
    setAcknowledgment('');

    try {
      const coveredTopics = conversationState?.getAllAskedQuestions().map(q =>
        q.split(' ').slice(0, 3).join(' ')
      ) || [];

      const result = await generateQuestionWithGemini({
        jobRole: session.role,
        experienceLevel: session.experience_level,
        jobDescription: session.jd_text,
        previousQuestions,
        previousAnswers,
        conversationHistory: conversationState?.getConversationHistory(),
        avoidTopics: coveredTopics,
      });

      let baseQuestion = result.question;

      if (questionQueueRef.current.isQuestionAlreadyAsked(baseQuestion)) {
        console.warn('DUPLICATE DETECTED: Question already asked, regenerating...');
        const retryResult = await generateQuestionWithGemini({
          jobRole: session.role,
          experienceLevel: session.experience_level,
          jobDescription: session.jd_text,
          previousQuestions: [...previousQuestions, baseQuestion],
          previousAnswers,
          conversationHistory: conversationState?.getConversationHistory(),
          avoidTopics: coveredTopics,
        });
        baseQuestion = retryResult.question;
      }

      const newPhase = determineInterviewPhase(currentQueueNumber, totalQuestions);
      const wrappedQuestion = wrapQuestionWithContext(
        baseQuestion,
        currentQueueNumber,
        totalQuestions,
        currentPhase
      );
      setCurrentPhase(newPhase);

      const questionObj = questionQueueRef.current.addQuestion(wrappedQuestion);
      questionQueueRef.current.markAsAsked(questionObj.number);

      setQuestionNumber(currentQueueNumber);
      setCurrentQuestion(wrappedQuestion);
      setPreviousQuestions(prev => [...prev, wrappedQuestion]);

      if (autoControllerRef.current) {
        autoControllerRef.current.startQuestion(wrappedQuestion, questionNumber, totalQuestions);
      }

      if (useRealTimeStream && streamServiceRef.current) {
        await speakWithStream(wrappedQuestion);

        if (autoControllerRef.current) {
          autoControllerRef.current.onQuestionSpeakingComplete();
        }

        if (sttServiceRef.current || useAutoMode) {
          startRealTimeListening();
        }
      } else {
        const voiceConfig = session.experience_level === 'fresher'
          ? conversationalVoiceConfig
          : professionalVoiceConfig;

        if (useElevenLabs) {
          await elevenLabs.textToSpeech(
            wrappedQuestion,
            voiceConfig,
            () => setAiSpeaking(true),
            () => setAiSpeaking(false),
            (error) => {
              console.error('TTS error:', error);
              fallbackToWebSpeech(wrappedQuestion);
            }
          );
        } else {
          fallbackToWebSpeech(wrappedQuestion);
        }
      }

      await supabase.from('turns').insert({
        session_id: sessionId!,
        turn_number: questionNumber,
        question: wrappedQuestion,
        tone_used: result.tone || 'professional_hr',
      });
    } catch (error) {
      console.error('Error generating question:', error);
      const fallbackQuestion = "Let's start with this: Tell me about yourself and your background.";
      setCurrentQuestion(fallbackQuestion);

      if (useRealTimeStream && streamServiceRef.current) {
        await speakWithStream(fallbackQuestion);
      } else {
        fallbackToWebSpeech(fallbackQuestion);
      }
    }
  };

  const fallbackToWebSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => setAiSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setAiSpeaking(false);
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
    if (useRealTimeStream && sttServiceRef.current) {
      stopRealTimeListening();
    } else {
      stopRecording();
    }

    const answerWordCount = transcript.trim().split(/\s+/).length;
    const ack = getAnswerAcknowledgment(answerWordCount);
    setAcknowledgment(ack);

    if (conversationState) {
      conversationState.addTurn(currentQuestion, transcript, []);
    }

    if (questionQueueRef.current) {
      questionQueueRef.current.markAsAnswered(questionNumber, transcript);
      console.log('Marked question as answered in queue');
    }

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

    if (questionQueueRef.current) {
      if (questionQueueRef.current.canAdvance()) {
        questionQueueRef.current.moveToNext();
        await generateNextQuestion();
      } else if (!questionQueueRef.current.hasNextQuestion()) {
        console.log('No more questions - completing interview');
        await completeInterview();
      }
    } else {
      if (questionNumber >= totalQuestions) {
        await completeInterview();
      } else {
        setQuestionNumber(prev => prev + 1);
        await generateNextQuestion();
      }
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
          <div className="w-16 h-16 border-4 border-brand-electric border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
          <div className="w-20 h-20 bg-brand-electric rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Ready to Begin?</h1>
          <p className="text-gray-300 mb-8">
            This interview will have {totalQuestions} questions. Make sure you're in a quiet environment
            and ready to give your best answers.
          </p>
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-3 text-gray-300">
              <Mic className="w-5 h-5 text-brand-electric-light" />
              <span>Microphone access required</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-gray-300">
              <Video className="w-5 h-5 text-brand-electric-light" />
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
              className="px-8 py-3 bg-brand-electric text-white font-semibold rounded-lg hover:bg-brand-electric-dark transition-colors flex items-center space-x-2"
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
    <div className="relative">
      {/* Emergency exit button - subtle, top-right corner */}
      <button
        onClick={endInterviewEarly}
        className="fixed top-6 right-6 z-50 p-3 bg-gray-800/80 hover:bg-red-500/20 border border-gray-700 hover:border-red-500 rounded-full backdrop-blur-sm transition-all group"
        title="End Interview"
      >
        <Power className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
      </button>

      {/* Pure Voice Agent UI */}
      <VoiceAgentUI
        isAISpeaking={aiSpeaking}
        isUserSpeaking={isRecording}
        currentQuestion={currentQuestion}
        transcript={transcript}
        volumeLevel={volumeLevel}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        aiName="Sarah"
      />

      {/* Video element - hidden but functional */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />
    </div>
  );
}
