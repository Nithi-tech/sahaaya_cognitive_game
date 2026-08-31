import { useState } from 'react';
import { CheckCircle, Volume2, Sparkles, Bell, Sun } from 'lucide-react';
import type { PersonAudioClips } from '../../types';
import { VoiceRecorder } from './VoiceRecorder';
import { triggerVoicePrecaching } from '../../services/voice/voiceCloneService';

interface Props {
  personName: string;
  clips?: PersonAudioClips;
  aiVoiceEnabled?: boolean;
  onToggleAiVoice?: (enabled: boolean) => void;
  onChange: (clips: PersonAudioClips) => void;
}

type ClipType = 'greeting' | 'reminder' | 'reward';

const CLIP_CONFIGS: {
  type: ClipType;
  label: string;
  emoji: string;
  hint: string;
  icon: typeof Sun;
}[] = [
  {
    type: 'greeting',
    label: 'Morning Greeting',
    emoji: '🌅',
    hint: 'e.g. "Good morning Ma! Wishing you a peaceful, happy day."',
    icon: Sun,
  },
  {
    type: 'reminder',
    label: 'Medicine & Routine',
    emoji: '💊',
    hint: 'e.g. "Ma, it\'s time for your medicine and a glass of water."',
    icon: Bell,
  },
  {
    type: 'reward',
    label: 'Joy & Encouragement',
    emoji: '🌟',
    hint: 'e.g. "Shabash Ma! You did so well, I\'m so proud of you!"',
    icon: Sparkles,
  },
];

export function MultiClipRecorder({
  personName,
  clips = {},
  aiVoiceEnabled = true,
  onToggleAiVoice,
  onChange,
}: Props) {
  const [activeTab, setActiveTab] = useState<ClipType>('greeting');

  const handleClipChange = (type: ClipType, dataUri: string | undefined) => {
    const updated = { ...clips, [type]: dataUri };
    if (!dataUri) delete updated[type];
    onChange(updated);
    if (dataUri) {
      triggerVoicePrecaching(dataUri);
    }
  };

  const recordedCount = [clips.greeting, clips.reminder, clips.reward].filter(Boolean).length;

  return (
    <div style={{
      background: '#F8FAFC',
      border: '1.5px solid #E2E8F0',
      borderRadius: 16,
      padding: '14px',
      marginTop: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Volume2 size={15} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
            Add {personName ? `${personName}'s` : "Loved One's"} Voice Prompts
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700,
          background: recordedCount > 0 ? '#DCFCE7' : '#F1F5F9',
          color: recordedCount > 0 ? '#15803D' : '#64748B',
          padding: '2px 8px', borderRadius: 99,
        }}>
          {recordedCount}/3 clips added
        </span>
      </div>

      {/* Clip Type Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {CLIP_CONFIGS.map((cfg) => {
          const isSelected = activeTab === cfg.type;
          const isRecorded = !!clips[cfg.type];
          return (
            <button
              key={cfg.type}
              type="button"
              onClick={() => setActiveTab(cfg.type)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 10,
                border: isSelected ? '2px solid var(--color-primary)' : '1px solid #CBD5E1',
                background: isSelected ? 'white' : '#F1F5F9',
                color: isSelected ? 'var(--color-primary)' : '#475569',
                fontWeight: isSelected ? 800 : 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                transition: 'all 0.15s',
              }}
            >
              <span>{cfg.emoji}</span>
              <span>{cfg.label.split(' ')[0]}</span>
              {isRecorded && <CheckCircle size={12} style={{ color: '#16A34A' }} />}
            </button>
          );
        })}
      </div>

      {/* Active Tab Recorder Pane */}
      {CLIP_CONFIGS.filter(c => c.type === activeTab).map((cfg) => (
        <div
          key={cfg.type}
          style={{
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '12px 14px',
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              {cfg.emoji} {cfg.label}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontStyle: 'italic' }}>
              Prompt: {cfg.hint}
            </div>
          </div>

          <VoiceRecorder
            value={clips[cfg.type]}
            onChange={(dataUri) => handleClipChange(cfg.type, dataUri)}
            label={`${personName || 'loved one'} ${cfg.label.toLowerCase()}`}
          />
        </div>
      ))}

      {/* Optional AI Voice Enhancement Toggle */}
      {recordedCount > 0 && (
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
              ✨ Enable AI Voice for {personName || 'this person'}?
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
              Online-only enhancement: synthesizes dynamic reminders and praises in their voice when connected.
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={aiVoiceEnabled !== false}
              onChange={(e) => onToggleAiVoice?.(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
