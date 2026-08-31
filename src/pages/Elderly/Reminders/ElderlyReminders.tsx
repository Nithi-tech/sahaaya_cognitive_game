import { useState } from 'react';
import { useApp } from '../../../store/AppContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Volume2 } from 'lucide-react';
import { playPersonalizedPrompt } from '../../../services/voice/personalizedAudio';
import { ElderlyReminderModal } from '../../../components/Elderly/ElderlyReminderModal';
import type { Reminder } from '../../../types';

const REMINDER_CONFIG = {
  medicine: { emoji: '💊', color: '#E91E63', bg: '#FCE4EC', title: 'Medicine' },
  hydration: { emoji: '💧', color: '#2196F3', bg: '#E3F2FD', title: 'Drink Water' },
  activity: { emoji: '🏃', color: '#4CAF50', bg: '#E8F5E9', title: 'Daily Activity' },
  appointment: { emoji: '🏥', color: '#9C27B0', bg: '#F3E5F5', title: 'Appointment' },
};

export default function ElderlyReminders() {
  const { reminders, updateReminderStatus, currentPatient } = useApp();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [justDone, setJustDone] = useState<string | null>(null);
  const [activeModalReminder, setActiveModalReminder] = useState<Reminder | null>(null);

  const handleDone = (id: string) => {
    updateReminderStatus(id, 'completed');
    setJustDone(id);

    // Play reward clip
    playPersonalizedPrompt({
      patient: currentPatient,
      trigger: 'reward',
      fallbackText: lang === 'as' ? 'বৰ ভাল কাম! আপুনি সম্পূৰ্ণ কৰিলে।' : 'Wonderful job! Marked done.',
      lang,
    });

    setTimeout(() => setJustDone(null), 2000);
  };

  const handleHearReminder = (reminder: Reminder) => {
    setActiveModalReminder(reminder);
  };

  const handleLater = (id: string) => {
    updateReminderStatus(id, 'delayed');
  };

  const byType = (type: string) => reminders.filter(r => r.type === type);

  return (
    <div className="elderly-layout" style={{ paddingBottom: 90 }}>
      <div style={{
        background: 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)',
        padding: '20px 20px 32px', color: 'white',
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 99, padding: '8px 12px', color: 'white', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          {lang === 'as' ? t('home.reminders') : "Today's Reminders"}
        </h1>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
            ✓ {reminders.filter(r => r.status === 'completed').length} done
          </span>
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
            {reminders.filter(r => r.status === 'scheduled' || r.status === 'delayed').length} upcoming
          </span>
        </div>
      </div>

      <div style={{ padding: '20px', marginTop: -16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {reminders.length === 0 && (
          <div className="card" style={{ borderRadius: 20, textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
              You don't have any reminders for today.
            </p>
          </div>
        )}
        {(Object.keys(REMINDER_CONFIG) as (keyof typeof REMINDER_CONFIG)[]).map((type) => {
          const conf = REMINDER_CONFIG[type];
          const list = byType(type);
          if (!list.length) return null;
          return (
            <div key={type}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{conf.emoji}</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{conf.title}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {list.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    config={conf}
                    justDone={justDone === r.id}
                    isPlaying={activeModalReminder?.id === r.id}
                    onHear={() => handleHearReminder(r)}
                    onDone={() => handleDone(r.id)}
                    onLater={() => handleLater(r.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <ElderlyReminderModal
        reminder={activeModalReminder}
        onClose={() => setActiveModalReminder(null)}
      />

      <ElderlyNav />
    </div>
  );
}

function ReminderCard({ reminder, config, justDone, isPlaying, onHear, onDone, onLater }: {
  reminder: Reminder;
  config: { emoji: string; color: string; bg: string; title: string };
  justDone: boolean;
  isPlaying: boolean;
  onHear: () => void;
  onDone: () => void;
  onLater: () => void;
}) {
  const isCompleted = reminder.status === 'completed';
  const isSkipped = reminder.status === 'skipped';
  const isDelayed = reminder.status === 'delayed';

  return (
    <div style={{
      background: isCompleted ? 'var(--color-success-light)' : config.bg,
      borderRadius: 20, padding: '20px',
      border: `2px solid ${isCompleted ? 'var(--color-success)' : config.color}30`,
      transition: 'all 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: isCompleted ? 0 : 16 }}>
        <span style={{ fontSize: 36 }}>{config.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{reminder.title}</div>
            {!isCompleted && (
              <button
                onClick={onHear}
                title="Hear voice reminder"
                style={{
                  background: isPlaying ? '#10B981' : 'white',
                  color: isPlaying ? 'white' : config.color,
                  border: `1px solid ${config.color}40`,
                  borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Volume2 size={13} /> {isPlaying ? 'Playing…' : 'Hear'}
              </button>
            )}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>{reminder.description}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: config.color, marginTop: 4 }}>
            🕐 {reminder.time}
          </div>
        </div>
        {isCompleted && (
          <div style={{ background: 'var(--color-success)', color: 'white', borderRadius: 99, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={20} />
          </div>
        )}
      </div>

      {!isCompleted && !isSkipped && (
        <>
        {isDelayed && (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 8 }}>
            ⏰ Delayed — you can still mark this done
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onDone}
            style={{
              flex: 2, height: 52, background: config.color, color: 'white',
              border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: `0 4px 12px ${config.color}44`,
            }}
          >
            {justDone ? '✓ Done!' : '✓ Done'}
          </button>
          <button
            onClick={onLater}
            style={{
              flex: 1, height: 52, background: 'white', border: `2px solid ${config.color}40`,
              color: 'var(--text-secondary)', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Later
          </button>
        </div>
        </>
      )}

      {isSkipped && (
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600 }}>Delayed to later</div>
      )}
    </div>
  );
}
