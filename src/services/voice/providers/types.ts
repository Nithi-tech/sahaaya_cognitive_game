export interface VoiceCloneProvider {
  name: string;
  isConfigured: () => boolean;
  synthesizeSpeech: (
    text: string,
    voiceRefAudioUrl?: string,
    voiceProfileId?: string,
    lang?: 'en' | 'as',
    signal?: AbortSignal,
  ) => Promise<string | null>;
}
