export interface StreamConfig {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface StreamCallbacks {
  onConnect?: () => void;
  onAudioChunk?: (audioChunk: ArrayBuffer) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah - Professional female voice
const DEFAULT_MODEL = 'eleven_turbo_v2_5'; // Fastest model for real-time

export class ElevenLabsStreamService {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private nextStartTime = 0;
  private config: StreamConfig;
  private callbacks: StreamCallbacks = {};

  constructor(config: StreamConfig) {
    this.config = {
      voiceId: DEFAULT_VOICE_ID,
      modelId: DEFAULT_MODEL,
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.5,
      useSpeakerBoost: true,
      ...config,
    };
  }

  async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async connect(): Promise<void> {
    await this.initAudioContext();

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${this.config.voiceId}/stream-input?model_id=${this.config.modelId}`;

        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('Eleven Labs WebSocket connected');

          const configMessage = {
            text: ' ',
            voice_settings: {
              stability: this.config.stability,
              similarity_boost: this.config.similarityBoost,
              style: this.config.style,
              use_speaker_boost: this.config.useSpeakerBoost,
            },
            xi_api_key: this.config.apiKey,
          };

          this.ws?.send(JSON.stringify(configMessage));
          this.callbacks.onConnect?.();
          resolve();
        };

        this.ws.onmessage = async (event) => {
          if (typeof event.data === 'string') {
            const message = JSON.parse(event.data);
            if (message.error) {
              console.error('Stream error:', message.error);
              this.callbacks.onError?.(new Error(message.error));
            }
            if (message.audio) {
              const audioData = this.base64ToArrayBuffer(message.audio);
              await this.playAudioChunk(audioData);
              this.callbacks.onAudioChunk?.(audioData);
            }
            if (message.isFinal) {
              this.callbacks.onComplete?.();
            }
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.callbacks.onError?.(new Error('WebSocket connection failed'));
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.callbacks.onClose?.();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async streamText(text: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const chunks = this.chunkText(text, 200);

    for (const chunk of chunks) {
      const message = {
        text: chunk,
        try_trigger_generation: true,
      };
      this.ws.send(JSON.stringify(message));
      await this.delay(50);
    }

    const endMessage = {
      text: '',
    };
    this.ws.send(JSON.stringify(endMessage));
  }

  private chunkText(text: string, maxLength: number): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async playAudioChunk(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      await this.initAudioContext();
    }

    try {
      const audioBuffer = await this.audioContext!.decodeAudioData(audioData.slice(0));
      this.audioQueue.push(audioBuffer);

      if (!this.isPlaying) {
        this.playNextInQueue();
      }
    } catch (error) {
      console.error('Error decoding audio:', error);
    }
  }

  private playNextInQueue(): void {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioBuffer = this.audioQueue.shift()!;
    const source = this.audioContext!.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext!.destination);

    const currentTime = this.audioContext!.currentTime;
    const startTime = Math.max(currentTime, this.nextStartTime);

    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;

    source.onended = () => {
      this.playNextInQueue();
    };
  }

  setCallbacks(callbacks: StreamCallbacks): void {
    this.callbacks = callbacks;
  }

  stop(): void {
    this.audioQueue = [];
    this.isPlaying = false;
    this.nextStartTime = 0;
  }

  disconnect(): void {
    this.stop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class ElevenLabsSTTService {
  private apiKey: string;
  private recognition: any = null;
  private isListening = false;
  private onTranscript?: (text: string, isFinal: boolean) => void;
  private onError?: (error: Error) => void;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.initRecognition();
  }

  private initRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.onTranscript?.(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        this.onTranscript?.(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.onError?.(new Error(event.error));
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this.recognition.start();
      }
    };
  }

  startListening(
    onTranscript: (text: string, isFinal: boolean) => void,
    onError?: (error: Error) => void
  ): void {
    if (!this.recognition) {
      onError?.(new Error('Speech recognition not available'));
      return;
    }

    this.onTranscript = onTranscript;
    this.onError = onError;
    this.isListening = true;

    try {
      this.recognition.start();
    } catch (error: any) {
      if (error.name !== 'InvalidStateError') {
        console.error('Error starting recognition:', error);
        onError?.(error);
      }
    }
  }

  stopListening(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }

  isActive(): boolean {
    return this.isListening;
  }
}

export const createStreamService = (apiKey: string, config?: Partial<StreamConfig>): ElevenLabsStreamService => {
  return new ElevenLabsStreamService({
    apiKey,
    ...config,
  });
};

export const createSTTService = (apiKey: string): ElevenLabsSTTService => {
  return new ElevenLabsSTTService(apiKey);
};
