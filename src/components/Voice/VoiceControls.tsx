import { Volume2, Pause, Play, Square } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  onReplay: () => void;
  onPauseResume: () => void;
  onStop: () => void;
}

/** Large, obvious audio controls. Always visible — never hidden behind a tiny icon. */
export function VoiceControls({ isSupported, isSpeaking, isPaused, onReplay, onPauseResume, onStop }: Props) {
  const { t } = useTranslation();

  return (
    <div className="voice-controls">
      <button
        type="button"
        className="voice-controls__btn voice-controls__btn--primary"
        onClick={onReplay}
        disabled={!isSupported}
        aria-label={t('voice.hear_again')}
      >
        <Volume2 size={22} />
        <span>{t('voice.hear_again')}</span>
      </button>

      {isSupported && (isSpeaking || isPaused) && (
        <>
          <button
            type="button"
            className="voice-controls__btn"
            onClick={onPauseResume}
            aria-label={isPaused ? t('voice.continue_speech') : t('voice.pause')}
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
            <span>{isPaused ? t('voice.continue_speech') : t('voice.pause')}</span>
          </button>
          <button
            type="button"
            className="voice-controls__btn voice-controls__btn--muted"
            onClick={onStop}
            aria-label={t('voice.stop')}
          >
            <Square size={18} />
            <span>{t('voice.stop')}</span>
          </button>
        </>
      )}

      {!isSupported && <p className="voice-controls__fallback">{t('voice.unavailable_msg')}</p>}
    </div>
  );
}
