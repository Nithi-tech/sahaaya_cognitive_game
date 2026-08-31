import type { PatientProfile, OnboardingPerson } from '../../types';
import { speak, playAudioClip, getActivePatientVoiceClip } from '../voiceService';
import { generateSpeech } from './voiceCloneService';
import { getPersonaPitch } from '../personalization';

export type PromptTrigger = 'greeting' | 'reminder' | 'reward';

export interface PromptOptions {
  patient: PatientProfile | null;
  trigger: PromptTrigger;
  fallbackText: string;
  lang?: 'en' | 'as';
  onStart?: (info: { person?: OnboardingPerson; isCustomAudio: boolean; isAiCloned?: boolean }) => void;
  onEnd?: () => void;
}

/**
 * Finds if the patient has a recorded family audio clip for the given trigger.
 * Prioritizes person marked askedForOften, then any family member with the clip.
 */
export function getPatientAudioClip(
  patient: PatientProfile | null,
  trigger: PromptTrigger,
): { person: OnboardingPerson; clipUrl: string } | null {
  const people = patient?.preferences?.onboarding?.people?.people ?? [];
  if (people.length === 0) return null;

  // 1. Exact match on person marked askedForOften
  const preferred = people.find((p) => p.askedForOften && p.audioClips?.[trigger]);
  if (preferred?.audioClips?.[trigger]) {
    return { person: preferred, clipUrl: preferred.audioClips[trigger]! };
  }

  // 2. Exact match on any person with the specific clip
  const personWithClip = people.find((p) => p.audioClips?.[trigger]);
  if (personWithClip?.audioClips?.[trigger]) {
    return { person: personWithClip, clipUrl: personWithClip.audioClips[trigger]! };
  }

  // 3. Backwards compatibility for greetingAudioUrl on greeting trigger
  if (trigger === 'greeting') {
    const personWithGreeting = people.find((p) => p.greetingAudioUrl);
    if (personWithGreeting?.greetingAudioUrl) {
      return { person: personWithGreeting, clipUrl: personWithGreeting.greetingAudioUrl };
    }
  }

  // 4. Fallback: If ANY clip was recorded for the preferred person, use it for greeting
  if (trigger === 'greeting') {
    const preferredWithAny = people.find((p) => p.askedForOften && (
      p.audioClips?.greeting || p.audioClips?.reminder || p.audioClips?.reward || p.greetingAudioUrl
    ));
    if (preferredWithAny) {
      const clip = preferredWithAny.audioClips?.greeting
        || preferredWithAny.greetingAudioUrl
        || preferredWithAny.audioClips?.reminder
        || preferredWithAny.audioClips?.reward;
      if (clip) return { person: preferredWithAny, clipUrl: clip };
    }

    const anyPersonWithAny = people.find((p) => (
      p.audioClips?.greeting || p.audioClips?.reminder || p.audioClips?.reward || p.greetingAudioUrl
    ));
    if (anyPersonWithAny) {
      const clip = anyPersonWithAny.audioClips?.greeting
        || anyPersonWithAny.greetingAudioUrl
        || anyPersonWithAny.audioClips?.reminder
        || anyPersonWithAny.audioClips?.reward;
      if (clip) return { person: anyPersonWithAny, clipUrl: clip };
    }
  }

  return null;
}

/**
 * Gets a voice reference sample for online cloning (e.g. greeting clip or sample audio).
 */
export function getPatientVoiceReference(patient: PatientProfile | null): { person: OnboardingPerson; sampleUrl: string } | null {
  const people = patient?.preferences?.onboarding?.people?.people ?? [];
  if (people.length === 0) return null;

  const preferred = people.find((p) => p.askedForOften && (p.audioClips?.greeting || p.greetingAudioUrl));
  if (preferred) {
    const sampleUrl = preferred.audioClips?.greeting || preferred.greetingAudioUrl;
    if (sampleUrl) return { person: preferred, sampleUrl };
  }

  const anyPerson = people.find((p) => p.audioClips?.greeting || p.greetingAudioUrl);
  if (anyPerson) {
    const sampleUrl = anyPerson.audioClips?.greeting || anyPerson.greetingAudioUrl;
    if (sampleUrl) return { person: anyPerson, sampleUrl };
  }

  return null;
}

/**
 * Personalized audio playback:
 * 1. If online and a voice reference sample is available (from onboarding,
 *    or the globally-synced active clip): synthesizes the actual text in
 *    that family member's voice clone.
 * 2. Otherwise (offline, no sample, or synthesis fails): speaks the actual
 *    text with the persona's vocal pitch via browser TTS.
 */
export function playPersonalizedPrompt({
  patient,
  fallbackText,
  lang = 'en',
  onStart,
  onEnd,
}: PromptOptions): { isCustomAudio: boolean; stop: () => void } {
  let voiceRef = getPatientVoiceReference(patient);
  if (!voiceRef) {
    const globalClip = getActivePatientVoiceClip();
    if (globalClip) {
      voiceRef = {
        person: {
          name: 'Loved One',
          relationship: 'Family',
          callsBy: 'Family',
          greetingAudioUrl: globalClip,
        },
        sampleUrl: globalClip,
      };
    }
  }
  const personaPitch = getPersonaPitch(voiceRef?.person);

  let activeAudio: HTMLAudioElement | null = null;
  let cancelled = false;

  // For all prompts: ALWAYS synthesize the spoken words in the added loved one's cloned voice!
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

  if (isOnline && voiceRef && voiceRef.sampleUrl) {
    console.log(`[personalizedAudio] Triggering AI Voice Cloning for "${fallbackText.slice(0, 30)}..." using sample from ${voiceRef.person.name}`);
    generateSpeech(fallbackText, voiceRef.sampleUrl, voiceRef.person.voiceProfileId, lang)
      .then((generatedAudioUrl) => {
        if (cancelled) return;
        if (generatedAudioUrl) {
          console.log(`[personalizedAudio] Cloned audio generated successfully! Playing now.`);
          onStart?.({ person: voiceRef.person, isCustomAudio: true, isAiCloned: true });
          activeAudio = playAudioClip(generatedAudioUrl, onEnd);
        } else {
          console.warn('[personalizedAudio] Cloned audio generation returned null, falling back to browser TTS');
          // Speak the ACTUAL fallbackText with the companion's personalized pitch/tone!
          onStart?.({ isCustomAudio: false, isAiCloned: false });
          speak(fallbackText, lang, { pitch: personaPitch, onEnd });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[personalizedAudio] Error in generateSpeech:', err);
        onStart?.({ isCustomAudio: false, isAiCloned: false });
        speak(fallbackText, lang, { pitch: personaPitch, onEnd });
      });

    return {
      isCustomAudio: true,
      stop: () => {
        cancelled = true;
        if (activeAudio) {
          try {
            activeAudio.pause();
            activeAudio.currentTime = 0;
          } catch {
            /* ignore */
          }
        }
      },
    };
  }

  console.log(`[personalizedAudio] Not using cloning: isOnline=${isOnline}, hasVoiceRef=${!!voiceRef}`);

  // 3. Fallback when offline or AI voice disabled:
  // Speak the ACTUAL words using the companion's personalized pitch!
  onStart?.({ isCustomAudio: false, isAiCloned: false });
  speak(fallbackText, lang, { pitch: personaPitch, onEnd });

  return {
    isCustomAudio: false,
    stop: () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    },
  };
}
