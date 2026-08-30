import type { VoiceCloneProvider } from './types';

export class ElevenLabsProvider implements VoiceCloneProvider {
  name = 'ElevenLabs';

  private apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  async synthesizeSpeech(
    text: string,
    _voiceRefAudioUrl?: string,
    voiceProfileId?: string,
    _lang: 'en' | 'as' = 'en',
    signal?: AbortSignal,
  ): Promise<string | null> {
    if (!this.isConfigured()) return null;

    // Use specific voice profile ID if configured, or ElevenLabs default voice
    const voiceId = voiceProfileId || '21m00Tcm4TlvDq8ikWAM'; // Rachel (Warm, natural)

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey!,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
          },
        }),
        signal,
      });

      if (!response.ok) return null;

      const blob = await response.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
}
