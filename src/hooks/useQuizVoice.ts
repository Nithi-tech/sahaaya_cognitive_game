import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { voiceService, type VoiceState } from '../services/voice/VoiceService';

/**
 * The one door every quiz component uses to reach speech. Wraps the
 * VoiceService singleton with the current patient's voice preferences
 * (falling back to sensible elderly-first defaults) so no component ever
 * calls the Web Speech API — or any future provider — directly.
 */
export function useQuizVoice() {
  const { currentPatient, language } = useApp();
  const prefs = currentPatient?.preferences;

  const voiceEnabled = prefs?.voiceEnabled ?? true;
  const spokenFeedbackEnabled = prefs?.spokenFeedback ?? true;
  const voiceLanguage = prefs?.voiceLanguage ?? language;
  const voiceSpeed = prefs?.voiceSpeed ?? 'slow';
  const voiceVolume = prefs?.voiceVolume ?? 1;

  const [voiceState, setVoiceState] = useState<VoiceState>(voiceService.getState());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => voiceService.subscribe(setVoiceState), []);

  useEffect(() => {
    voiceService.setLanguage(voiceLanguage);
    voiceService.setSpeed(voiceSpeed);
    voiceService.setVolume(voiceVolume);
  }, [voiceLanguage, voiceSpeed, voiceVolume]);

  // Never leave ghost audio behind when the consuming screen goes away.
  useEffect(() => () => voiceService.stop(), []);

  const speak = useCallback((text: string) => {
    setError(null);
    voiceService.speak(text, { onError: setError });
  }, []);

  const speakQuestion = useCallback(
    (text: string, opts: { auto?: boolean } = {}) => {
      if (opts.auto && !voiceEnabled) return;
      speak(text);
    },
    [speak, voiceEnabled],
  );

  const speakFeedback = useCallback(
    (text: string) => {
      if (!spokenFeedbackEnabled) return;
      speak(text);
    },
    [speak, spokenFeedbackEnabled],
  );

  const replayQuestion = useCallback(() => {
    setError(null);
    voiceService.replay();
  }, []);

  const pause = useCallback(() => voiceService.pause(), []);
  const resume = useCallback(() => voiceService.resume(), []);
  const stop = useCallback(() => voiceService.stop(), []);

  return {
    isSupported: voiceService.isSupported(),
    isSpeaking: voiceState === 'speaking',
    isPaused: voiceState === 'paused',
    hasError: voiceState === 'error',
    error,
    voiceEnabled,
    speak,
    speakQuestion,
    speakFeedback,
    replayQuestion,
    pause,
    resume,
    stop,
  };
}
