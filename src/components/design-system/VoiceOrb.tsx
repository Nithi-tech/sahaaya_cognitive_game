import { Mic, MicOff, AlertCircle } from 'lucide-react';

export type VoiceOrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

interface VoiceOrbProps {
  state: VoiceOrbState;
  onTap?: () => void;
  size?: number;
  label?: string;
}

/**
 * The one voice control every voice-driven screen should use — replaces a
 * plain static microphone icon with a control that actually shows what
 * Sahaaya is doing (idle / listening / thinking / speaking / error), since a
 * user can't otherwise tell whether they were heard, whether it's still
 * processing, or whether it's about to answer.
 */
export function VoiceOrb({ state, onTap, size = 120, label }: VoiceOrbProps) {
  const isInteractive = state === 'idle' || state === 'error';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <button
        onClick={isInteractive ? onTap : undefined}
        disabled={!isInteractive}
        aria-label={label ?? 'Talk to Sahaaya'}
        className={`voice-orb voice-orb--${state}`}
        style={{ width: size, height: size }}
      >
        <span className="voice-orb__ring voice-orb__ring--1" />
        <span className="voice-orb__ring voice-orb__ring--2" />
        <span className="voice-orb__core">
          {state === 'error' ? (
            <AlertCircle size={size * 0.4} />
          ) : state === 'thinking' ? (
            <span className="voice-orb__dots">
              <span /><span /><span />
            </span>
          ) : state === 'speaking' ? (
            <span className="voice-orb__wave">
              <span /><span /><span /><span /><span />
            </span>
          ) : state === 'listening' ? (
            <MicOff size={size * 0.42} />
          ) : (
            <Mic size={size * 0.42} />
          )}
        </span>
      </button>
    </div>
  );
}
