import { Mic, Square, Trash2 } from 'lucide-react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';

interface Props {
  /** Existing base64 data-URI recording, if any (e.g. saved greetingAudioUrl). */
  value?: string;
  onChange: (dataUri: string | undefined) => void;
  /** Short label describing what's being recorded, e.g. a person's name. */
  label?: string;
}

/** A small record/stop/preview/re-record control for a short voice greeting clip. */
export function VoiceRecorder({ value, onChange, label }: Props) {
  const recorder = useVoiceRecorder();

  if (!recorder.isSupported) {
    return (
      <div style={{ fontSize: 12, color: '#999' }}>
        🎙️ Voice recording isn't supported on this device/browser.
      </div>
    );
  }

  const handleToggle = async () => {
    if (recorder.state === 'recording') {
      const dataUri = await recorder.stop();
      onChange(dataUri ?? undefined);
    } else {
      onChange(undefined);
      await recorder.start();
    }
  };

  const handleRemove = () => {
    recorder.reset();
    onChange(undefined);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={recorder.state === 'recording' ? 'Stop recording' : `Record greeting${label ? ` for ${label}` : ''}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 700,
          background: recorder.state === 'recording' ? '#FFEBEE' : '#E8EEF2',
          color: recorder.state === 'recording' ? '#C62828' : '#555',
        }}
      >
        {recorder.state === 'recording' ? <Square size={14} /> : <Mic size={14} />}
        {recorder.state === 'recording' ? 'Stop' : value ? 'Re-record' : 'Record greeting'}
      </button>

      {value && recorder.state !== 'recording' && (
        <>
          <audio src={value} controls style={{ height: 32, maxWidth: 140 }} />
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove recording"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E53935', padding: 4 }}
          >
            <Trash2 size={14} />
          </button>
        </>
      )}

      {recorder.error && (
        <span style={{ fontSize: 11, color: '#C62828' }}>{recorder.error}</span>
      )}
    </div>
  );
}
