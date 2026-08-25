import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../store/AppContext';
import { useAuth } from '../../../store/AuthContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';
import { Mic, ChevronRight, Settings as SettingsIcon, X } from 'lucide-react';
import { NetworkToggle } from '../../../components/OfflineIndicator/OfflineIndicator';
import type { MoodType } from '../../../types';

const MOODS: { type: MoodType; emoji: string; label: string }[] = [
  { type: 'good', emoji: '😊', label: 'Good' },
  { type: 'okay', emoji: '😐', label: 'Okay' },
  { type: 'notgood', emoji: '😔', label: 'Not good' },
];

const REMINDER_EMOJIS = { medicine: '💊', hydration: '💧', activity: '🏃', appointment: '🏥' };

function computeStreak(sessionDates: Set<string>): number {
  let streak = 0;
  const d = new Date();
  while (sessionDates.has(d.toISOString().split('T')[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function ElderlyHome() {
  const { t, lang } = useTranslation();
  const { mood, setMood, reminders, cognitiveProfile, sessions, memories } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(mood);

  const welcomeKey = user ? `sahaaya_welcomed_${user.id}` : null;
  const [showWelcome, setShowWelcome] = useState(() => !!welcomeKey && !localStorage.getItem(welcomeKey));
  const dismissWelcome = () => {
    if (welcomeKey) localStorage.setItem(welcomeKey, '1');
    setShowWelcome(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetingAs = hour < 12 ? 'শুভ প্ৰভাত' : hour < 17 ? 'শুভ অপৰাহ্ন' : 'শুভ সন্ধিয়া';

  const handleMood = (m: MoodType) => {
    setSelectedMood(m);
    setMood(m);
  };

  const todayReminders = reminders.slice(0, 4);
  const completedToday = reminders.filter(r => r.status === 'completed').length;

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => s.timestamp.startsWith(today));
  const familyMemoryCount = memories.filter((m) => m.category === 'family' && m.relationship).length;
  const totalGamesToday = familyMemoryCount >= 2 ? 6 : 5;
  const gamesCompletedToday = new Set(todaySessions.map((s) => s.gameType)).size;
  const latestDifficulty = sessions[0]?.difficulty ?? 'easy';
  const streak = computeStreak(new Set(sessions.map((s) => s.timestamp.split('T')[0])));

  return (
    <div className="elderly-layout" style={{ paddingBottom: 90 }}>
      {/* Header */}
      <div className="elderly-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="mascot-avatar">🧠</div>
            <div>
              <p style={{ opacity: 0.85, fontSize: 16, marginBottom: 4 }}>
                {lang === 'as' ? greetingAs : greeting},
              </p>
              <h1 className="elderly-greeting">Aita 👋</h1>
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 12, padding: '8px 12px',
            fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)', flexShrink: 0, textAlign: 'center',
          }}>
            <div>{cognitiveProfile.overallEngagement}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Engagement</div>
          </div>
        </div>

        {streak >= 2 && (
          <div style={{ marginTop: 16 }}>
            <span className="streak-badge">🔥 {streak}-day streak</span>
          </div>
        )}

        <p style={{ fontSize: 18, opacity: 0.9, marginTop: 12, marginBottom: 20 }}>
          {lang === 'as' ? t('home.feeling') : 'How are you feeling today?'}
        </p>

        {/* Mood */}
        <div className="mood-options">
          {MOODS.map((m) => (
            <button
              key={m.type}
              className={`mood-btn ${selectedMood === m.type ? 'mood-btn--selected' : ''}`}
              onClick={() => handleMood(m.type)}
            >
              <span className="mood-emoji">{m.emoji}</span>
              <span>{lang === 'as' ? t(`home.mood.${m.type}`) : m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="elderly-content">
        {/* Network toggle for demo */}
        <NetworkToggle />

        {showWelcome && (
          <div className="welcome-card animate-slide-up">
            <button className="welcome-card__close" onClick={dismissWelcome} aria-label="Close welcome message">
              <X size={16} />
            </button>
            <div className="welcome-card__title">👋 Welcome to Sahaaya!</div>
            <ul className="welcome-card__list">
              <li>🎮 Tap <strong>START</strong> below for today's brain activities</li>
              <li>🔊 Sahaaya reads every question aloud — tap "Hear Again" any time</li>
              <li>🗣️ Tap <strong>Talk</strong> in the bottom bar to ask about your day</li>
            </ul>
            <button className="btn btn--outline btn--sm" onClick={dismissWelcome} style={{ marginTop: 4 }}>
              Got it
            </button>
          </div>
        )}

        {/* Today's Activity Card */}
        <div className="activity-card animate-slide-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 36 }}>🧠</span>
            <div>
              <div className="activity-card__title">
                {lang === 'as' ? t('home.today_activity') : "Today's Brain Activity"}
              </div>
              <div className="activity-card__subtitle">
                {lang === 'as' ? t('home.activity_prompt') : "Let's spend 5 minutes together."}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, background: '#F0F8F5', borderRadius: 12, padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progress</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{gamesCompletedToday} of {totalGamesToday}</span>
            </div>
            <div style={{
              flex: 1, background: '#FFF8F0', borderRadius: 12, padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Difficulty</span>
              <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{latestDifficulty.charAt(0).toUpperCase() + latestDifficulty.slice(1)}</span>
            </div>
          </div>

          <button
            className="btn btn--primary btn--xl"
            onClick={() => navigate('/activities')}
            style={{ fontSize: 22, height: 72, borderRadius: 20, fontWeight: 800 }}
          >
            {lang === 'as' ? t('home.start') : 'START'}
          </button>
        </div>

        {/* Today's Reminders */}
        <div className="card" style={{ borderRadius: 24 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 16
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>
              {lang === 'as' ? t('home.reminders') : "Today's Reminders"}
            </h2>
            <span style={{
              background: completedToday > 0 ? 'var(--color-success-light)' : '#F5F5F5',
              color: completedToday > 0 ? 'var(--color-success)' : 'var(--text-tertiary)',
              padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
            }}>
              {completedToday}/{reminders.length} done
            </span>
          </div>
          <div className="reminder-chips">
            {todayReminders.map((r) => (
              <div
                key={r.id}
                className={`reminder-chip ${r.status === 'completed' ? 'reminder-chip--completed' : 'reminder-chip--pending'}`}
                onClick={() => navigate('/reminders')}
              >
                <span className="reminder-chip__emoji">
                  {REMINDER_EMOJIS[r.type as keyof typeof REMINDER_EMOJIS] || '📌'}
                </span>
                <span style={{ fontSize: 14 }}>{r.title}</span>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {r.status === 'completed' ? '✓ Done' : r.time}
                </span>
              </div>
            ))}
          </div>
          <button
            className="btn btn--outline"
            onClick={() => navigate('/reminders')}
            style={{ width: '100%', marginTop: 12, fontSize: 16 }}
          >
            View All Reminders
          </button>
        </div>

        {/* Talk to Sahaaya */}
        <div className="card" style={{
          borderRadius: 24,
          background: 'linear-gradient(135deg, #F0F8FA 0%, #FFF8F0 100%)',
          border: '1px solid #D4EDF2',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
              {lang === 'as' ? t('home.voice') : 'Talk to Sahaaya'}
            </h2>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => navigate('/voice-settings')}
              aria-label="Voice Settings"
              style={{ color: 'var(--text-tertiary)', padding: 6, flexShrink: 0 }}
            >
              <SettingsIcon size={18} />
            </button>
          </div>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 20 }}>
            {lang === 'as' ? t('home.voice_prompt') : 'Ask me anything about your day.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              className="voice-button"
              onClick={() => navigate('/voice')}
              style={{ width: 100, height: 100 }}
            >
              <Mic size={44} />
            </button>
          </div>
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: 'var(--text-tertiary)' }}>
            Tap to speak
          </p>
        </div>

        {/* Memory companion shortcut */}
        <button
          onClick={() => navigate('/memory')}
          className="card"
          style={{
            borderRadius: 24, width: '100%', textAlign: 'left', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', border: '2px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 36 }}>❤️</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>My Memories</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Family, places & favourites</div>
            </div>
          </div>
          <ChevronRight size={24} color="var(--text-tertiary)" />
        </button>
      </div>

      <ElderlyNav />
    </div>
  );
}
