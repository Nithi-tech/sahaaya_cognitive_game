import type { VoiceCloneProvider } from './types';

export class XTTSProvider implements VoiceCloneProvider {
  name = 'Coqui XTTS-v2';

  // Local CPU inference (no GPU) commonly takes 10-30s+ per line — far past
  // the 3.5s default used for hosted APIs like ElevenLabs.
  timeoutMs = Number(import.meta.env.VITE_XTTS_TIMEOUT_MS as string | undefined) || 180000;

  private endpoint = (import.meta.env.VITE_XTTS_ENDPOINT as string | undefined) || 'http://localhost:8020';

  isConfigured(): boolean {
    return !!this.endpoint && this.endpoint.trim().length > 0;
  }

  async synthesizeSpeech(
    text: string,
    voiceRefAudioUrl?: string,
    _voiceProfileId?: string,
    lang: 'en' | 'as' = 'en',
    signal?: AbortSignal,
  ): Promise<string | null> {
    if (!this.isConfigured() || !voiceRefAudioUrl) {
      console.warn('[XTTSProvider] Not configured or voiceRefAudioUrl missing');
      return null;
    }

    try {
      console.log(`[XTTSProvider] Synthesizing speech via ${this.endpoint}: "${text.slice(0, 40)}..."`);
      const response = await fetch(`${this.endpoint.replace(/\/$/, '')}/tts_stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'audio/wav',
        },
        body: JSON.stringify({
          text,
          language: lang === 'as' ? 'hi' : 'en', // XTTS closest Indic mapping
          speaker_wav: voiceRefAudioUrl,
        }),
        signal,
      });

      if (!response.ok) {
        console.error('[XTTSProvider] Server returned error:', response.status, response.statusText);
        return null;
      }

      const blob = await response.blob();
      console.log(`[XTTSProvider] Received audio blob (${blob.size} bytes)`);
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('[XTTSProvider] Synthesis failed or timed out:', err);
      return null;
    }
  }
}
