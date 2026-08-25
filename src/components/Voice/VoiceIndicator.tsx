interface Props {
  isSpeaking: boolean;
  isPaused: boolean;
  speakingLabel: string;
  pausedLabel: string;
}

/** Gentle, persistent "Sahaaya is speaking" indicator — never a flashy sound-wave animation. */
export function VoiceIndicator({ isSpeaking, isPaused, speakingLabel, pausedLabel }: Props) {
  if (!isSpeaking && !isPaused) return null;

  return (
    <div className="voice-indicator" role="status" aria-live="polite">
      <span className={`voice-indicator__dots ${isSpeaking ? 'voice-indicator__dots--active' : ''}`}>
        <span className="voice-indicator__dot" />
        <span className="voice-indicator__dot" />
        <span className="voice-indicator__dot" />
      </span>
      <span className="voice-indicator__label">{isPaused ? pausedLabel : speakingLabel}</span>
    </div>
  );
}
