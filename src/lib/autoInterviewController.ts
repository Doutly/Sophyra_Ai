import { VoiceActivityDetector } from './voiceActivityDetection';

export interface InterviewState {
  phase: 'idle' | 'ai_speaking' | 'user_speaking' | 'processing' | 'transitioning' | 'completed';
  currentQuestion: string;
  currentAnswer: string;
  questionNumber: number;
  totalQuestions: number;
  isListening: boolean;
  isSpeaking: boolean;
}

export interface AutoInterviewConfig {
  silenceThresholdMs?: number;
  minAnswerLengthWords?: number;
  maxAnswerDurationMs?: number;
  transitionDelayMs?: number;
  interruptionEnabled?: boolean;
}

export interface AutoInterviewCallbacks {
  onQuestionStart?: (question: string, number: number) => void;
  onQuestionEnd?: () => void;
  onAnswerStart?: () => void;
  onAnswerComplete?: (answer: string, duration: number) => void;
  onTransitionStart?: () => void;
  onTransitionComplete?: () => void;
  onInterruption?: () => void;
  onStateChange?: (state: InterviewState) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_CONFIG: Required<AutoInterviewConfig> = {
  silenceThresholdMs: 2500,
  minAnswerLengthWords: 10,
  maxAnswerDurationMs: 180000,
  transitionDelayMs: 1500,
  interruptionEnabled: true,
};

export class AutoInterviewController {
  private state: InterviewState = {
    phase: 'idle',
    currentQuestion: '',
    currentAnswer: '',
    questionNumber: 0,
    totalQuestions: 0,
    isListening: false,
    isSpeaking: false,
  };

  private config: Required<AutoInterviewConfig>;
  private callbacks: AutoInterviewCallbacks = {};
  private vad: VoiceActivityDetector | null = null;

  private answerStartTime = 0;
  private silenceCheckInterval: NodeJS.Timeout | null = null;
  private maxDurationTimer: NodeJS.Timeout | null = null;
  private transitionTimer: NodeJS.Timeout | null = null;

  private transcriptBuffer: string[] = [];
  private lastTranscriptUpdate = 0;

  constructor(config: AutoInterviewConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  initialize(vad: VoiceActivityDetector): void {
    this.vad = vad;

    this.vad.setCallbacks({
      onSpeechStart: () => this.handleUserSpeechStart(),
      onSpeechEnd: () => this.handleUserSpeechEnd(),
      onSilenceDetected: (duration) => this.handleSilence(duration),
      onSpeaking: () => this.handleUserSpeaking(),
    });

    console.log('AutoInterviewController initialized');
  }

  setCallbacks(callbacks: AutoInterviewCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  startQuestion(question: string, questionNumber: number, totalQuestions: number): void {
    this.updateState({
      phase: 'ai_speaking',
      currentQuestion: question,
      questionNumber,
      totalQuestions,
      currentAnswer: '',
      isSpeaking: true,
      isListening: false,
    });

    this.callbacks.onQuestionStart?.(question, questionNumber);
    console.log(`Question ${questionNumber}/${totalQuestions} started`);
  }

  onQuestionSpeakingComplete(): void {
    console.log('AI finished speaking question');

    this.updateState({
      phase: 'user_speaking',
      isSpeaking: false,
      isListening: true,
    });

    this.callbacks.onQuestionEnd?.();
    this.startListeningForAnswer();
  }

  onAISpeakingInterrupted(): void {
    if (!this.config.interruptionEnabled) return;

    console.log('AI speaking interrupted by user');

    this.updateState({
      phase: 'user_speaking',
      isSpeaking: false,
      isListening: true,
    });

    this.callbacks.onInterruption?.();
    this.startListeningForAnswer();
  }

  private startListeningForAnswer(): void {
    this.answerStartTime = 0;
    this.transcriptBuffer = [];
    this.lastTranscriptUpdate = 0;

    this.maxDurationTimer = setTimeout(() => {
      console.log('Max answer duration reached');
      this.completeAnswer();
    }, this.config.maxAnswerDurationMs);

    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
    }

    this.silenceCheckInterval = setInterval(() => {
      this.checkForAnswerCompletion();
    }, 500);

    console.log('Started listening for answer');
  }

  private handleUserSpeechStart(): void {
    if (this.state.phase === 'ai_speaking') {
      this.onAISpeakingInterrupted();
      return;
    }

    if (this.state.phase === 'user_speaking') {
      if (this.answerStartTime === 0) {
        this.answerStartTime = Date.now();
        this.callbacks.onAnswerStart?.();
        console.log('User started answering');
      }
    }
  }

  private handleUserSpeaking(): void {
    if (this.state.phase === 'user_speaking' && this.answerStartTime > 0) {
      this.lastTranscriptUpdate = Date.now();
    }
  }

  private handleUserSpeechEnd(): void {
    if (this.state.phase === 'user_speaking') {
      console.log('User speech ended, monitoring silence...');
    }
  }

  private handleSilence(duration: number): void {
    if (this.state.phase === 'user_speaking' && this.answerStartTime > 0) {
      console.log(`Silence detected: ${duration}ms`);
    }
  }

  addTranscriptChunk(text: string, isFinal: boolean): void {
    if (this.state.phase !== 'user_speaking') return;

    if (isFinal) {
      this.transcriptBuffer.push(text);
      this.lastTranscriptUpdate = Date.now();

      const fullTranscript = this.transcriptBuffer.join(' ').trim();
      this.updateState({ currentAnswer: fullTranscript });

      console.log('Transcript updated:', text);
    }
  }

  private checkForAnswerCompletion(): void {
    if (this.state.phase !== 'user_speaking' || this.answerStartTime === 0) {
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastTranscriptUpdate;
    const fullAnswer = this.state.currentAnswer.trim();
    const wordCount = fullAnswer.split(/\s+/).filter(Boolean).length;

    const hasMinWords = wordCount >= this.config.minAnswerLengthWords;
    const hasSufficientSilence = timeSinceLastUpdate >= this.config.silenceThresholdMs;

    if (hasMinWords && hasSufficientSilence && this.vad && !this.vad.getIsSpeaking()) {
      console.log(`Answer completion criteria met:
        - Words: ${wordCount} (min: ${this.config.minAnswerLengthWords})
        - Silence: ${timeSinceLastUpdate}ms (threshold: ${this.config.silenceThresholdMs}ms)
        - Speaking: false`);
      this.completeAnswer();
    }
  }

  private completeAnswer(): void {
    if (this.state.phase !== 'user_speaking') return;

    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }

    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }

    const duration = Date.now() - this.answerStartTime;
    const answer = this.state.currentAnswer.trim();

    console.log(`Answer completed: ${answer.split(/\s+/).length} words, ${duration}ms`);

    this.updateState({
      phase: 'processing',
      isListening: false,
    });

    this.callbacks.onAnswerComplete?.(answer, duration);
    this.startTransition();
  }

  private startTransition(): void {
    this.updateState({ phase: 'transitioning' });
    this.callbacks.onTransitionStart?.();

    console.log(`Starting transition (${this.config.transitionDelayMs}ms)...`);

    this.transitionTimer = setTimeout(() => {
      this.updateState({ phase: 'idle' });
      this.callbacks.onTransitionComplete?.();
      console.log('Transition complete, ready for next question');
    }, this.config.transitionDelayMs);
  }

  skipTransition(): void {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }

    this.updateState({ phase: 'idle' });
    this.callbacks.onTransitionComplete?.();
    console.log('Transition skipped');
  }

  completeInterview(): void {
    this.cleanup();
    this.updateState({ phase: 'completed' });
    console.log('Interview completed');
  }

  forceCompleteAnswer(): void {
    if (this.state.phase === 'user_speaking') {
      console.log('Manually completing answer');
      this.completeAnswer();
    }
  }

  private cleanup(): void {
    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }

    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }

    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
  }

  private updateState(updates: Partial<InterviewState>): void {
    this.state = { ...this.state, ...updates };
    this.callbacks.onStateChange?.(this.state);
  }

  getState(): InterviewState {
    return { ...this.state };
  }

  updateConfig(config: Partial<AutoInterviewConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Config updated:', config);
  }

  destroy(): void {
    this.cleanup();
    console.log('AutoInterviewController destroyed');
  }
}

export const createAutoInterviewController = (config?: AutoInterviewConfig): AutoInterviewController => {
  return new AutoInterviewController(config);
};
