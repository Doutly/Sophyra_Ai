const ELEVEN_LABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '3962ab55c2cce53b25a1777ffb58e2dc8ea7eb3cd7a6f2c18e94dcd3c384e5e2';
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

export interface VoiceConfig {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export class ElevenLabsService {
  private apiKey: string;
  private voiceId: string;
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  constructor(apiKey: string = ELEVEN_LABS_API_KEY, voiceId: string = VOICE_ID) {
    this.apiKey = apiKey;
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

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: defaultConfig,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Eleven Labs API error: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      this.currentAudio = new Audio(audioUrl);

      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        onEnd?.();
      };

      this.currentAudio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        onError?.(new Error('Audio playback failed'));
      };

      await this.currentAudio.play();
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }

  stopSpeaking(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  isSpeaking(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  async speechToText(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');

      const response = await fetch(
        'https://api.elevenlabs.io/v1/speech-to-text',
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`STT API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.text || '';
    } catch (error) {
      console.error('Speech-to-text error:', error);
      throw error;
    }
  }

  async getAvailableVoices(): Promise<any[]> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }
}

export const elevenLabs = new ElevenLabsService();

export const conversationalVoiceConfig: VoiceConfig = {
  stability: 0.6,
  similarity_boost: 0.8,
  style: 0.7,
  use_speaker_boost: true,
};

export const professionalVoiceConfig: VoiceConfig = {
  stability: 0.75,
  similarity_boost: 0.75,
  style: 0.4,
  use_speaker_boost: true,
};

export const friendlyVoiceConfig: VoiceConfig = {
  stability: 0.5,
  similarity_boost: 0.85,
  style: 0.8,
  use_speaker_boost: true,
};
