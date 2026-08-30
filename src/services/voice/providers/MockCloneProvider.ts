import type { VoiceCloneProvider } from './types';

export class MockCloneProvider implements VoiceCloneProvider {
  name = 'Demo AI Voice Simulator';

  isConfigured(): boolean {
    return true;
  }

  async synthesizeSpeech(
    _text: string,
    _voiceRefAudioUrl?: string,
    _voiceProfileId?: string,
    _lang: 'en' | 'as' = 'en',
    _signal?: AbortSignal,
  ): Promise<string | null> {
    // Simulator delegates to Web Speech AI synthesis with personalized persona pitch/tone
    // so that the ACTUAL words/text are spoken, rather than looping a static clip!
    return null;
  }
}
