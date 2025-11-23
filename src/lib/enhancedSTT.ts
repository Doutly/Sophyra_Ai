export interface STTResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  source: 'browser' | 'elevenlabs' | 'manual';
  timestamp: number;
}

export interface STTConfig {
  minConfidence?: number;
  noiseSuppressionLevel?: number;
  autoGainControl?: boolean;
  echoCancellation?: boolean;
  fallbackEnabled?: boolean;
}

const DEFAULT_CONFIG: Required<STTConfig> = {
  minConfidence: 0.7,
  noiseSuppressionLevel: 2,
  autoGainControl: true,
  echoCancellation: true,
  fallbackEnabled: true,
};

export class EnhancedSTTService {
  private recognition: any = null;
  private config: Required<STTConfig>;
  private isActive = false;
  private confidenceHistory: number[] = [];
  private readonly MAX_HISTORY = 10;

  private onTranscript?: (result: STTResult) => void;
  private onError?: (error: Error) => void;
  private onLowConfidence?: (transcript: string, confidence: number) => void;

  constructor(config: STTConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (!this.isBrowserSTTSupported()) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: any) => this.handleResult(event);
    this.recognition.onerror = (event: any) => this.handleError(event);
    this.recognition.onend = () => this.handleEnd();

    console.log('Enhanced STT initialized');
  }

  async start(): Promise<void> {
    if (!this.recognition) {
      await this.initialize();
    }

    try {
      await this.requestMicrophonePermission();
      this.recognition.start();
      this.isActive = true;
      console.log('STT started');
    } catch (error: any) {
      console.error('Failed to start STT:', error);
      if (this.config.fallbackEnabled) {
        this.showManualInputOption();
      }
      throw error;
    }
  }

  stop(): void {
    if (this.recognition && this.isActive) {
      this.recognition.stop();
      this.isActive = false;
      console.log('STT stopped');
    }
  }

  setCallbacks(callbacks: {
    onTranscript?: (result: STTResult) => void;
    onError?: (error: Error) => void;
    onLowConfidence?: (transcript: string, confidence: number) => void;
  }): void {
    this.onTranscript = callbacks.onTranscript;
    this.onError = callbacks.onError;
    this.onLowConfidence = callbacks.onLowConfidence;
  }

  private handleResult(event: any): void {
    let interimTranscript = '';
    let finalTranscript = '';
    let maxConfidence = 0;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence || 0.9;

      if (result.isFinal) {
        finalTranscript += transcript + ' ';
        maxConfidence = Math.max(maxConfidence, confidence);

        this.processTranscript(finalTranscript.trim(), confidence, true);
      } else {
        interimTranscript += transcript;
        this.processTranscript(interimTranscript.trim(), confidence, false);
      }
    }
  }

  private processTranscript(transcript: string, confidence: number, isFinal: boolean): void {
    const cleaned = this.cleanTranscript(transcript);

    if (isFinal) {
      this.confidenceHistory.push(confidence);
      if (this.confidenceHistory.length > this.MAX_HISTORY) {
        this.confidenceHistory.shift();
      }
    }

    const result: STTResult = {
      transcript: cleaned,
      confidence,
      isFinal,
      source: 'browser',
      timestamp: Date.now(),
    };

    if (isFinal && confidence < this.config.minConfidence) {
      console.warn(`Low confidence transcript: ${confidence.toFixed(2)}`);
      this.onLowConfidence?.(cleaned, confidence);
    }

    this.onTranscript?.(result);
  }

  private cleanTranscript(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .replace(/\s([.,!?])/g, '$1');
  }

  private handleError(event: any): void {
    console.error('STT error:', event.error);

    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Please speak clearly into the microphone.',
      'audio-capture': 'Microphone not accessible. Please check permissions.',
      'not-allowed': 'Microphone access denied. Please enable in browser settings.',
      'network': 'Network error. Check your internet connection.',
      'aborted': 'Speech recognition was aborted.',
    };

    const message = errorMessages[event.error] || 'Speech recognition error occurred.';
    const error = new Error(message);

    this.onError?.(error);

    if (event.error === 'no-speech' || event.error === 'audio-capture') {
      if (this.config.fallbackEnabled) {
        this.showManualInputOption();
      }
    }

    if (this.isActive && event.error !== 'aborted') {
      setTimeout(() => {
        try {
          this.recognition.start();
        } catch (e) {
          console.error('Failed to restart STT:', e);
        }
      }, 1000);
    }
  }

  private handleEnd(): void {
    if (this.isActive) {
      console.log('STT ended unexpectedly, restarting...');
      setTimeout(() => {
        try {
          this.recognition.start();
        } catch (e) {
          console.error('Failed to restart STT:', e);
        }
      }, 500);
    }
  }

  private async requestMicrophonePermission(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: true,
          autoGainControl: this.config.autoGainControl,
          sampleRate: 16000,
        },
      });

      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      throw new Error('Microphone permission denied');
    }
  }

  private showManualInputOption(): void {
    console.log('Manual input fallback available');
    const event = new CustomEvent('stt-fallback-needed', {
      detail: { reason: 'STT unavailable' },
    });
    window.dispatchEvent(event);
  }

  getAverageConfidence(): number {
    if (this.confidenceHistory.length === 0) return 0;
    const sum = this.confidenceHistory.reduce((a, b) => a + b, 0);
    return sum / this.confidenceHistory.length;
  }

  getConfidenceHistory(): number[] {
    return [...this.confidenceHistory];
  }

  private isBrowserSTTSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}

export const createEnhancedSTT = (config?: STTConfig): EnhancedSTTService => {
  return new EnhancedSTTService(config);
};

export class ManualTranscriptInput {
  private onSubmit?: (transcript: string) => void;

  setOnSubmit(callback: (transcript: string) => void): void {
    this.onSubmit = callback;
  }

  show(): void {
    const event = new CustomEvent('show-manual-input', {
      detail: {
        onSubmit: (text: string) => this.onSubmit?.(text),
      },
    });
    window.dispatchEvent(event);
  }

  hide(): void {
    const event = new CustomEvent('hide-manual-input');
    window.dispatchEvent(event);
  }
}
