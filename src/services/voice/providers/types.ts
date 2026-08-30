export interface VoiceCloneProvider {
  name: string;
  isConfigured: () => boolean;
  /** Overrides the default 3.5s synthesis timeout — e.g. local CPU inference needs much longer. */
  timeoutMs?: number;
  synthesizeSpeech: (
    text: string,
    voiceRefAudioUrl?: string,
    voiceProfileId?: string,
    lang?: 'en' | 'as',
    signal?: AbortSignal,
  ) => Promise<string | null>;
}
