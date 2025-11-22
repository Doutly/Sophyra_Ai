export interface VADConfig {
  sampleRate?: number;
  fftSize?: number;
  smoothingTimeConstant?: number;
  energyThreshold?: number;
  silenceThreshold?: number;
  silenceDuration?: number;
  speechStartDelay?: number;
  minSpeechDuration?: number;
}

export interface VADCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onVolumeChange?: (volume: number) => void;
  onSilenceDetected?: (duration: number) => void;
  onSpeaking?: () => void;
}

const DEFAULT_CONFIG: Required<VADConfig> = {
  sampleRate: 16000,
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  energyThreshold: -50,
  silenceThreshold: -60,
  silenceDuration: 2000,
  speechStartDelay: 300,
  minSpeechDuration: 500,
};

export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;

  private config: Required<VADConfig>;
  private callbacks: VADCallbacks = {};

  private isSpeaking = false;
  private speechStartTime = 0;
  private lastSpeechTime = 0;
  private silenceStartTime = 0;
  private speechStartTimer: NodeJS.Timeout | null = null;

  private volumeHistory: number[] = [];
  private readonly VOLUME_HISTORY_SIZE = 10;

  private isRunning = false;
  private animationFrameId: number | null = null;

  constructor(config: VADConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.config.sampleRate,
        },
      });

      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.config.fftSize;
      this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;

      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      console.log('VAD initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VAD:', error);
      throw error;
    }
  }

  start(): void {
    if (!this.analyser || this.isRunning) return;

    this.isRunning = true;
    this.detectVoiceActivity();
    console.log('VAD started');
  }

  stop(): void {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.speechStartTimer) {
      clearTimeout(this.speechStartTimer);
      this.speechStartTimer = null;
    }

    console.log('VAD stopped');
  }

  destroy(): void {
    this.stop();

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log('VAD destroyed');
  }

  setCallbacks(callbacks: VADCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  getVolume(): number {
    return this.volumeHistory.length > 0
      ? this.volumeHistory[this.volumeHistory.length - 1]
      : 0;
  }

  private detectVoiceActivity(): void {
    if (!this.isRunning || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatFrequencyData(dataArray);

    const energy = this.calculateEnergy(dataArray);
    const volume = this.energyToVolume(energy);

    this.volumeHistory.push(volume);
    if (this.volumeHistory.length > this.VOLUME_HISTORY_SIZE) {
      this.volumeHistory.shift();
    }

    this.callbacks.onVolumeChange?.(volume);

    const avgEnergy = this.getAverageEnergy();
    const currentTime = Date.now();

    if (avgEnergy > this.config.energyThreshold) {
      this.lastSpeechTime = currentTime;

      if (!this.isSpeaking) {
        if (!this.speechStartTimer) {
          this.speechStartTimer = setTimeout(() => {
            this.handleSpeechStart();
          }, this.config.speechStartDelay);
        }
      } else {
        this.callbacks.onSpeaking?.();
      }

      this.silenceStartTime = 0;
    } else {
      if (this.speechStartTimer) {
        clearTimeout(this.speechStartTimer);
        this.speechStartTimer = null;
      }

      if (this.isSpeaking) {
        const timeSinceSpeech = currentTime - this.lastSpeechTime;

        if (timeSinceSpeech > this.config.silenceDuration) {
          this.handleSpeechEnd();
        } else {
          if (this.silenceStartTime === 0) {
            this.silenceStartTime = currentTime;
          }

          const silenceDuration = currentTime - this.silenceStartTime;
          if (silenceDuration > 0 && silenceDuration % 500 < 50) {
            this.callbacks.onSilenceDetected?.(silenceDuration);
          }
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.detectVoiceActivity());
  }

  private handleSpeechStart(): void {
    this.isSpeaking = true;
    this.speechStartTime = Date.now();
    this.silenceStartTime = 0;
    this.callbacks.onSpeechStart?.();
    console.log('Speech started');
  }

  private handleSpeechEnd(): void {
    const speechDuration = Date.now() - this.speechStartTime;

    if (speechDuration >= this.config.minSpeechDuration) {
      this.isSpeaking = false;
      this.silenceStartTime = 0;
      this.callbacks.onSpeechEnd?.();
      console.log('Speech ended, duration:', speechDuration, 'ms');
    }
  }

  private calculateEnergy(dataArray: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length;
  }

  private getAverageEnergy(): number {
    if (this.volumeHistory.length === 0) return -100;

    const avgVolume = this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length;
    return this.volumeToEnergy(avgVolume);
  }

  private energyToVolume(energy: number): number {
    const normalized = Math.max(0, Math.min(1, (energy + 100) / 100));
    return normalized * 100;
  }

  private volumeToEnergy(volume: number): number {
    return (volume / 100) * 100 - 100;
  }

  updateConfig(config: Partial<VADConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getSilenceDuration(): number {
    if (this.silenceStartTime === 0) return 0;
    return Date.now() - this.silenceStartTime;
  }

  getSpeechDuration(): number {
    if (!this.isSpeaking || this.speechStartTime === 0) return 0;
    return Date.now() - this.speechStartTime;
  }
}

export const createVAD = (config?: VADConfig): VoiceActivityDetector => {
  return new VoiceActivityDetector(config);
};

export class InterruptionDetector {
  private vad: VoiceActivityDetector;
  private onInterrupt?: () => void;
  private onResumeAvailable?: () => void;
  private isAISpeaking = false;
  private interruptionCount = 0;

  constructor(config?: VADConfig) {
    this.vad = createVAD(config);
  }

  async initialize(): Promise<void> {
    await this.vad.initialize();

    this.vad.setCallbacks({
      onSpeechStart: () => {
        if (this.isAISpeaking) {
          this.interruptionCount++;
          console.log('User interrupted AI speech');
          this.onInterrupt?.();
        }
      },
      onSpeechEnd: () => {
        if (!this.isAISpeaking) {
          console.log('User finished speaking');
          this.onResumeAvailable?.();
        }
      },
    });
  }

  start(): void {
    this.vad.start();
  }

  stop(): void {
    this.vad.stop();
  }

  destroy(): void {
    this.vad.destroy();
  }

  setAISpeaking(speaking: boolean): void {
    this.isAISpeaking = speaking;
  }

  setOnInterrupt(callback: () => void): void {
    this.onInterrupt = callback;
  }

  setOnResumeAvailable(callback: () => void): void {
    this.onResumeAvailable = callback;
  }

  getVAD(): VoiceActivityDetector {
    return this.vad;
  }

  getInterruptionCount(): number {
    return this.interruptionCount;
  }

  resetInterruptionCount(): void {
    this.interruptionCount = 0;
  }
}

export const createInterruptionDetector = (config?: VADConfig): InterruptionDetector => {
  return new InterruptionDetector(config);
};
