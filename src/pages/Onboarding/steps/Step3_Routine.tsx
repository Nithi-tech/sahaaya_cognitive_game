import { useState } from 'react';
import type { OnboardingRoutineSection } from '../../../types';

interface Props {
  saved: OnboardingRoutineSection | null;
  onSave: (data: OnboardingRoutineSection) => void;
  onSkip: () => void;
  saving: boolean;
}

export default function Step3_Routine({ saved, onSave, onSkip, saving }: Props) {
  const [form, setForm] = useState<OnboardingRoutineSection>({
    wakeTime: saved?.wakeTime ?? '06:30',
    breakfastTime: saved?.breakfastTime ?? '07:30',
    lunchTime: saved?.lunchTime ?? '12:30',
    dinnerTime: saved?.dinnerTime ?? '19:30',
    sleepTime: saved?.sleepTime ?? '21:00',
    rituals: saved?.rituals ?? '',
    activityPhrase: saved?.activityPhrase ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const timeFields: Array<{ key: keyof OnboardingRoutineSection; label: string; emoji: string }> = [
    { key: 'wakeTime', label: 'Wake up time', emoji: '🌅' },
    { key: 'breakfastTime', label: 'Breakfast', emoji: '🍳' },
    { key: 'lunchTime', label: 'Lunch', emoji: '🍛' },
    { key: 'dinnerTime', label: 'Dinner', emoji: '🍽️' },
    { key: 'sleepTime', label: 'Bedtime', emoji: '🌙' },
  ];

  const timeInputStyle: React.CSSProperties = {
    padding: '12px 14px', borderRadius: 10, border: '2px solid #E0E0E0',
    fontSize: 20, fontWeight: 700, width: '100%', boxSizing: 'border-box',
    textAlign: 'center', fontFamily: 'monospace',
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🌅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Routine & Daily Life</h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 6 }}>
          Set the elder's daily schedule so reminders and activities feel natural and timely.
        </p>
      </div>

      {/* Time grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {timeFields.map(({ key, label, emoji }) => (
          <div key={key} style={{
            background: '#F8FAFB', borderRadius: 14, padding: '12px 14px',
            border: '1.5px solid #E8EEF2',
          }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>
              {emoji} {label}
            </label>
            <input
              type="time"
              style={timeInputStyle}
              value={form[key] as string ?? ''}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      {/* Rituals */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
          🙏 Morning rituals or habits
        </label>
        <textarea
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 12,
            border: '2px solid #E0E0E0', fontSize: 14, resize: 'vertical',
            minHeight: 80, fontFamily: 'inherit', boxSizing: 'border-box',
          }}
          value={form.rituals}
          onChange={e => setForm(f => ({ ...f, rituals: e.target.value }))}
          placeholder="e.g. Morning prayer at 6:45, listening to devotional music, watering plants…"
        />
      </div>

      {/* Activity phrase */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
          🧠 What phrase should Sahaaya use when it's brain activity time?
        </label>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          This is the sentence spoken aloud when nudging the elder to play a game.
        </p>
        <input
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 12,
            border: '2px solid #E0E0E0', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit',
          }}
          value={form.activityPhrase}
          onChange={e => setForm(f => ({ ...f, activityPhrase: e.target.value }))}
          placeholder="e.g. 'Time for your mind game, Ma' or 'Let's play a little'"
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={saving}
          style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: saving ? '#B0BEC5' : 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)',
            color: 'white', fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
          }}>
          {saving ? 'Saving…' : 'Save & Continue →'}
        </button>
        <button type="button" onClick={onSkip} disabled={saving}
          style={{ padding: '14px 20px', borderRadius: 12, border: '2px solid #E0E0E0', background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#888' }}>
          Skip
        </button>
      </div>
    </form>
  );
}
