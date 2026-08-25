import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useQuizVoice } from '../../hooks/useQuizVoice';
import { useTranslation } from '../../i18n/useTranslation';
import { VoiceIndicator } from './VoiceIndicator';
import { VoiceControls } from './VoiceControls';

interface Props {
  /** The sentence to speak — already localized, never raw question data. */
  text: string;
  /** Changes whenever a genuinely new question appears (e.g. question index). */
  speakKey: string | number;
  children: ReactNode;
}

/**
 * Wraps a question's visual content with the full voice lifecycle: a short
 * settling pause, automatic speech (if enabled), a visible "speaking"
 * highlight, and always-available Hear Again / Pause / Stop controls.
 * The single integration point every game uses instead of talking to
 * speech APIs directly.
 */
export function QuestionNarrator({ text, speakKey, children }: Props) {
  const voice = useQuizVoice();
  const { t } = useTranslation();
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    settleTimer.current = setTimeout(() => {
      voice.speakQuestion(text, { auto: true });
    }, 400);
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
    // Re-narrate only when a new question actually appears, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakKey]);

  return (
    <div className={`question-narrator ${voice.isSpeaking ? 'question-narrator--speaking' : ''}`}>
      <VoiceIndicator
        isSpeaking={voice.isSpeaking}
        isPaused={voice.isPaused}
        speakingLabel={t('voice.speaking')}
        pausedLabel={t('voice.pause')}
      />

      {children}

      <div className="question-narrator__controls">
        <VoiceControls
          isSupported={voice.isSupported}
          isSpeaking={voice.isSpeaking}
          isPaused={voice.isPaused}
          // Always speak this narrator's own current text — not whatever the
          // service last happened to say elsewhere (e.g. with auto-speak off,
          // nothing has been spoken here yet, so a generic "replay" would be stale).
          onReplay={() => voice.speak(text)}
          onPauseResume={() => (voice.isPaused ? voice.resume() : voice.pause())}
          onStop={voice.stop}
        />
        {voice.isSupported && voice.error === 'autoplay-blocked' && (
          <p className="voice-controls__fallback">{t('voice.tap_to_hear')}</p>
        )}
      </div>
    </div>
  );
}
