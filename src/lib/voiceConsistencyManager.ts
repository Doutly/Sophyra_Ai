export interface VoiceConfig {
  voiceId: string;
  voiceName: string;
  modelId: string;
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
}

export interface VoicePreferences {
  experienceLevel: 'fresher' | 'experienced' | 'expert';
  voiceGender: 'male' | 'female';
  voiceTone: 'professional' | 'conversational' | 'mentor';
}

const VOICE_PRESETS: Record<string, VoiceConfig> = {
  professional_female: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    voiceName: 'Sarah',
    modelId: 'eleven_turbo_v2_5',
    stability: 0.75,
    similarityBoost: 0.75,
    style: 0.4,
    useSpeakerBoost: true,
  },
  conversational_female: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    voiceName: 'Sarah',
    modelId: 'eleven_turbo_v2_5',
    stability: 0.6,
    similarityBoost: 0.75,
    style: 0.7,
    useSpeakerBoost: true,
  },
  professional_male: {
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    voiceName: 'Adam',
    modelId: 'eleven_turbo_v2_5',
    stability: 0.75,
    similarityBoost: 0.75,
    style: 0.4,
    useSpeakerBoost: true,
  },
};

export class VoiceConsistencyManager {
  private lockedVoice: VoiceConfig | null = null;
  private sessionId: string;
  private readonly STORAGE_KEY = 'interview_voice_config_';

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async initialize(preferences: VoicePreferences): Promise<VoiceConfig> {
    const saved = await this.loadSavedVoice();
    if (saved) {
      this.lockedVoice = saved;
      console.log('Loaded saved voice configuration:', saved.voiceName);
      return saved;
    }

    const selected = this.selectVoiceForPreferences(preferences);
    this.lockVoice(selected);

    console.log('Initialized voice configuration:', selected.voiceName);
    return selected;
  }

  private selectVoiceForPreferences(prefs: VoicePreferences): VoiceConfig {
    let key: string;

    if (prefs.experienceLevel === 'fresher') {
      key = 'conversational_female';
    } else if (prefs.voiceGender === 'female') {
      key = 'professional_female';
    } else {
      key = 'professional_male';
    }

    return { ...VOICE_PRESETS[key] };
  }

  lockVoice(config: VoiceConfig): void {
    this.lockedVoice = { ...config };
    this.saveVoiceConfig();
    console.log('Voice locked:', config.voiceName);
  }

  getLockedVoice(): VoiceConfig {
    if (!this.lockedVoice) {
      console.warn('No voice locked, using default');
      this.lockedVoice = { ...VOICE_PRESETS.professional_female };
      this.saveVoiceConfig();
    }

    return { ...this.lockedVoice };
  }

  isVoiceLocked(): boolean {
    return this.lockedVoice !== null;
  }

  validateVoiceConsistency(currentVoice: VoiceConfig): boolean {
    if (!this.lockedVoice) {
      console.warn('No locked voice to validate against');
      return false;
    }

    const isConsistent =
      currentVoice.voiceId === this.lockedVoice.voiceId &&
      currentVoice.modelId === this.lockedVoice.modelId;

    if (!isConsistent) {
      console.error('Voice inconsistency detected!', {
        locked: this.lockedVoice,
        current: currentVoice,
      });
    }

    return isConsistent;
  }

  resetIfInconsistent(currentVoice: VoiceConfig): VoiceConfig {
    if (!this.validateVoiceConsistency(currentVoice)) {
      console.warn('Resetting to locked voice due to inconsistency');
      return this.getLockedVoice();
    }
    return currentVoice;
  }

  private async saveVoiceConfig(): Promise<void> {
    if (!this.lockedVoice) return;

    try {
      const key = this.STORAGE_KEY + this.sessionId;
      localStorage.setItem(key, JSON.stringify(this.lockedVoice));

      await fetch('/api/voice-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          voiceConfig: this.lockedVoice,
        }),
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to save voice config:', err);
    }
  }

  private async loadSavedVoice(): Promise<VoiceConfig | null> {
    try {
      const key = this.STORAGE_KEY + this.sessionId;
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to load saved voice:', err);
    }
    return null;
  }

  getVoiceDescription(): string {
    const voice = this.getLockedVoice();
    const tone = voice.style > 0.5 ? 'conversational' : 'professional';
    return `${voice.voiceName} (${tone})`;
  }

  exportConfig(): string {
    return JSON.stringify(this.lockedVoice, null, 2);
  }
}

export const createVoiceManager = (sessionId: string): VoiceConsistencyManager => {
  return new VoiceConsistencyManager(sessionId);
};
