import type { PatientProfile } from '../../types';
import type { VoiceCloneProvider } from './providers/types';
import { ElevenLabsProvider } from './providers/ElevenLabsProvider';
import { XTTSProvider } from './providers/XTTSProvider';
import { MockCloneProvider } from './providers/MockCloneProvider';

const configuredProviderType = (import.meta.env.VITE_VOICE_CLONE_PROVIDER as string | undefined) || 'xtts';

function resolveProvider(): VoiceCloneProvider {
  switch (configuredProviderType.toLowerCase()) {
    case 'elevenlabs':
      return new ElevenLabsProvider();
    case 'xtts':
      return new XTTSProvider();
    case 'simulator':
    default:
      return new MockCloneProvider();
  }
}

export const activeVoiceProvider = resolveProvider();

/** Simple hash generator for client-side audio caching */
function getCacheKey(text: string, voiceRef?: string, lang = 'en'): string {
  const str = `${text}_${voiceRef?.slice(0, 30) || 'none'}_${lang}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `sahaaya_vcache_${Math.abs(hash)}`;
}

/**
 * Synthesizes dynamic text into a cloned family voice clip.
 * - Online-only with a strict timeout (3.5s by default, provider-overridable).
 * - Checks navigator.onLine and client-side cache first.
 * - Returns null silently on offline, timeout, or error (never throws).
 */
export async function generateSpeech(
  text: string,
  voiceRefAudioUrl?: string,
  voiceProfileId?: string,
  lang: 'en' | 'as' = 'en',
): Promise<string | null> {
  // 1. Connectivity Check: If offline, fail immediately in 0ms
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }

  // 2. Cache Check: Instant return if previously generated
  const cacheKey = getCacheKey(text, voiceRefAudioUrl, lang);
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {
    /* ignore storage errors */
  }

  if (!activeVoiceProvider.isConfigured()) {
    return null;
  }

  // 3. Strict timeout via AbortController — providers may override the
  // default 3.5s (e.g. local CPU inference needs much longer, see XTTSProvider).
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), activeVoiceProvider.timeoutMs ?? 180000);

  try {
    const audioDataUrl = await activeVoiceProvider.synthesizeSpeech(
      text,
      voiceRefAudioUrl,
      voiceProfileId,
      lang,
      controller.signal,
    );

    clearTimeout(timeoutId);

    // 4. Cache audio for repeated phrases (e.g. daily medicine reminders)
    if (audioDataUrl) {
      try {
        localStorage.setItem(cacheKey, audioDataUrl);
      } catch {
        /* storage may be full for large audio */
      }
    }

    return audioDataUrl;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

export type VoiceCloneMode = 'active' | 'offline' | 'disabled' | 'unconfigured';

export interface VoiceCloneStatus {
  isActive: boolean;
  mode: VoiceCloneMode;
  providerName: string;
  label: string;
  badgeColor: string;
}

/** Determines the current operational status of AI Voice Cloning for a patient */
export function getVoiceCloneStatus(patient: PatientProfile | null): VoiceCloneStatus {
  const providerName = activeVoiceProvider.name;
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
  const isEnabled = patient?.preferences?.aiVoiceEnabled !== false;

  const people = patient?.preferences?.onboarding?.people?.people ?? [];
  const hasVoicePerson = people.some((p) => p.aiVoiceEnabled !== false && (p.greetingAudioUrl || p.audioClips?.greeting));

  if (!isEnabled || !hasVoicePerson) {
    return {
      isActive: false,
      mode: 'disabled',
      providerName,
      label: 'AI Voice: Disabled',
      badgeColor: '#94A3B8',
    };
  }

  if (!isOnline) {
    return {
      isActive: false,
      mode: 'offline',
      providerName,
      label: 'AI Voice: Offline Mode (Local clips active)',
      badgeColor: '#F59E0B',
    };
  }

  if (!activeVoiceProvider.isConfigured()) {
    return {
      isActive: false,
      mode: 'unconfigured',
      providerName,
      label: 'AI Voice: Ready (Provider key needed)',
      badgeColor: '#64748B',
    };
  }

  return {
    isActive: true,
    mode: 'active',
    providerName,
    label: `AI Voice: Active (${providerName})`,
    badgeColor: '#10B981',
  };
}

/**
 * Automatically triggers background pre-synthesis of the elder's most common phrases
 * so that when the elder taps or speaks on the dashboard, the cloned voice plays in 0.01s!
 */
export async function triggerVoicePrecaching(
  speakerWav?: string,
  lang: 'en' | 'as' = 'en',
): Promise<void> {
  if (!speakerWav || typeof window === 'undefined' || !navigator.onLine) return;
  const endpoint = (import.meta.env.VITE_XTTS_ENDPOINT as string | undefined) || 'http://localhost:8020';

  const defaultPhrases = [
    "Hello! It is wonderful to hear from you. I am right here with you.",
    "You haven't completed any activities yet today.",
    "You've completed everything on today's schedule. Well done!",
    "You've taken all of today's medicine. Great job!",
    "Remember to drink a glass of water.",
    "Let's start your memory game.",
  ];

  try {
    fetch(`${endpoint.replace(/\/$/, '')}/precache_voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        speaker_wav: speakerWav,
        language: lang === 'as' ? 'hi' : 'en',
        phrases: defaultPhrases,
      }),
    }).catch(() => {
      /* ignore background precache errors */
    });
  } catch {
    /* ignore */
  }
}
