import { Volume2 } from 'lucide-react';
import { voiceService } from '../../services/voice/VoiceService';

interface Props {
  /** What to speak when tapped — kept short (a single object/activity name), never auto-played. */
  text: string;
}

/** A small, optional per-item speaker button — for a user who has trouble reading a label. */
export function SpeakableLabel({ text }: Props) {
  return (
    <button
      type="button"
      className="speakable-label__btn"
      aria-label={`${text}`}
      onClick={(e) => {
        e.stopPropagation();
        voiceService.speak(text);
      }}
    >
      <Volume2 size={16} />
    </button>
  );
}
