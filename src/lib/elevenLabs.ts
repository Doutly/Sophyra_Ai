const FUNCTIONS_BASE_URL = 'https://us-central1-sophyraai.cloudfunctions.net';
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

export interface VoiceConfig {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export class ElevenLabsService {
  private voiceId: string;
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  constructor(_apiKey?: string, voiceId: string = VOICE_ID) {
    this.voiceId = voiceId;
  }

  async textToSpeech(
    text: string,
    config: VoiceConfig = {},
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      const defaultConfig = {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true,
        ...config
      };

      onStart?.();

      // Route through server-side proxy — API key never reaches client
      const response = await fetch(`${FUNCTIONS_BASE_URL}/elevenLabsTTSProxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: this.voiceId,
          voiceSettings: defaultConfig,
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS error: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      this.currentAudio = new Audio(audioUrl);

      this.currentAudio.onended = () => {
        onEnd?.();
        if (this.currentAudio) {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
        }
      };

      this.currentAudio.onerror = () => {
        const error = new Error('Audio playback failed');
        onError?.(error);
        if (this.currentAudio) {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
        }
      };

      await this.currentAudio.play();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Text to speech failed');
      onError?.(err);
      throw err;
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  async speechToText(audioBlob: Blob): Promise<string> {
    try {
      console.log('Speech-to-text: processing audio blob of size', audioBlob.size);
      return '';
    } catch (error) {
      console.error('Speech to text error:', error);
      return '';
    }
  }

  async getVoices(): Promise<any[]> {
    try {
      // Route through server-side proxy
      const response = await fetch(`${FUNCTIONS_BASE_URL}/elevenLabsVoicesProxy`);

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}

export const defaultVoiceConfigs = {
  conversational: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true,
  } as VoiceConfig,
  professional: {
    stability: 0.7,
    similarity_boost: 0.8,
    style: 0.3,
    use_speaker_boost: true,
  } as VoiceConfig,
  friendly: {
    stability: 0.4,
    similarity_boost: 0.7,
    style: 0.7,
    use_speaker_boost: true,
  } as VoiceConfig,
};
