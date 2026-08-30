import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../store/AppContext';
import { useAuth } from '../../../store/AuthContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';
import { Settings as SettingsIcon, X, Volume2 } from 'lucide-react';
import { NetworkToggle } from '../../../components/OfflineIndicator/OfflineIndicator';
import { VoiceOrb } from '../../../components/design-system/VoiceOrb';
import { getPersonalization } from '../../../services/personalization';
import { resolvePatientTheme, CATEGORY_METADATA } from '../../../services/themeRegistry';
import { playPersonalizedPrompt } from '../../../services/voice/personalizedAudio';
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
  const { mood, setMood, reminders, sessions, currentPatient } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(mood);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  const personalization = getPersonalization(currentPatient);
  const themeAsset = resolvePatientTheme(currentPatient?.preferences?.onboarding?.favorites?.themePreference);
  const primaryColor = themeAsset.id !== 'default' ? themeAsset.primaryColor : personalization.primaryColor;
  const headerGradient = themeAsset.id !== 'default' ? themeAsset.headerGradient : personalization.headerGradient;

  const elderName = currentPatient?.name?.split(' ')[0] || user?.name?.split(' ')[0] || (lang === 'as' ? 'আইতা' : 'Friend');

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

  const handlePlayVoice = () => {
    if (isPlayingVoice) return;
    setIsPlayingVoice(true);

    const person = personalization.favoritePerson;
    const fallbackText = lang === 'as'
      ? `নমস্কাৰ ${elderName}! মই ${person?.name || 'সহায়া'}। আজিৰ দিনটো আনন্দৰে পাৰ হওক।`
      : `Hello ${elderName}! This is ${person?.name || 'Sahaaya'}. Wishing you a peaceful and wonderful day.`;

    playPersonalizedPrompt({
      patient: currentPatient,
      trigger: 'greeting',
      fallbackText,
      lang,
      onStart: () => setIsPlayingVoice(true),
      onEnd: () => setIsPlayingVoice(false),
    });
  };

  const todayReminders = reminders.slice(0, 4);
  const completedToday = reminders.filter(r => r.status === 'completed').length;

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => s.timestamp.startsWith(today));
  const gamesCompletedToday = new Set(todaySessions.map((s) => s.gameType)).size;
  const latestDifficulty = sessions[0]?.difficulty ?? 'easy';
  const streak = computeStreak(new Set(sessions.map((s) => s.timestamp.split('T')[0])));

  return (
    <div
      className="elderly-layout"
      style={{
        paddingBottom: 90,
        ['--color-primary' as string]: primaryColor,
      }}
    >
      {/* Header with dynamic personalized gradient */}
      <div
        className="elderly-header"
        style={{ background: headerGradient }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="mascot-avatar">🧠</div>
          <div>
            <p style={{ opacity: 0.85, fontSize: 16, marginBottom: 4 }}>
              {lang === 'as' ? greetingAs : greeting},
            </p>
            <h1 className="elderly-greeting">{elderName} 👋</h1>
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

        {/* Dynamic Family Voice Companion Banner */}
        {personalization.favoritePerson && (
          <div style={{
            background: 'white', borderRadius: 22, padding: '16px 20px',
            marginBottom: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            border: `2px solid ${personalization.primaryColor}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {personalization.favoritePerson.photoUrl ? (
                <img
                  src={personalization.favoritePerson.photoUrl}
                  alt={personalization.favoritePerson.name}
                  style={{ width: 54, height: 54, borderRadius: 50, objectFit: 'cover', border: `2px solid ${personalization.primaryColor}` }}
                />
              ) : (
                <div style={{
                  width: 54, height: 54, borderRadius: 50,
                  background: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                }}>
                  ❤️
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: personalization.primaryColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Voice Companion · {personalization.favoritePerson.relationship}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1E293B' }}>
                  {personalization.favoritePerson.name}
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 1 }}>
                  {isPlayingVoice ? 'Speaking to you now…' : 'Tap to hear loving greetings'}
                </div>
              </div>
            </div>

            <button
              onClick={handlePlayVoice}
              style={{
                background: isPlayingVoice ? '#10B981' : `linear-gradient(135deg, ${personalization.primaryColor}, #1565C0)`,
                color: 'white', border: 'none', borderRadius: 99,
                padding: '12px 20px', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: `0 4px 14px ${personalization.primaryColor}44`,
                transition: 'all 0.2s',
              }}
            >
              <Volume2 size={18} /> {isPlayingVoice ? 'Listening…' : 'Hear Voice'}
            </button>
          </div>
        )}

        {/* Tagged-Category UI Theme Card */}
        {themeAsset.id !== 'default' ? (
          <div style={{
            background: themeAsset.cardGradient,
            border: `2px solid ${themeAsset.borderColor}`,
            borderRadius: 22, padding: '18px 22px', marginBottom: 20,
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                fontSize: 40, width: 64, height: 64, borderRadius: 18,
                background: 'rgba(255,255,255,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)', flexShrink: 0,
              }}>
                {themeAsset.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: 1, color: themeAsset.accentColor,
                }}>
                  {CATEGORY_METADATA[themeAsset.category].label} · {themeAsset.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#1E293B', marginTop: 2 }}>
                  {themeAsset.tagline}
                </div>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0', lineHeight: 1.4 }}>
                  ✨ {themeAsset.ambientNote}
                </p>
              </div>
            </div>
          </div>
        ) : personalization.food ? (
          <div style={{
            background: personalization.food.bgGradient,
            border: `2px solid ${personalization.food.accentColor}44`,
            borderRadius: 22, padding: '18px 22px', marginBottom: 20,
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                fontSize: 40, width: 64, height: 64, borderRadius: 18,
                background: 'rgba(255,255,255,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)', flexShrink: 0,
              }}>
                {personalization.food.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: 1, color: personalization.food.accentColor,
                }}>
                  {personalization.food.category}
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#1E293B', marginTop: 2 }}>
                  Favourite: {personalization.food.name}
                </div>
                <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0', lineHeight: 1.4 }}>
                  {personalization.food.tagline}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Dynamic Favorite Place / Nostalgia Card */}
        {personalization.place && (
          <div style={{
            background: personalization.place.bgGradient,
            border: '2px solid rgba(0,0,0,0.06)',
            borderRadius: 22, padding: '16px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 36 }}>{personalization.place.emoji}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  Cherished Memory Spot
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>
                  {personalization.place.name}
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  Relax with gentle ambiance of {personalization.place.ambientSoundName}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/relax')}
              style={{
                background: 'white', border: '1.5px solid #CBD5E1', borderRadius: 12,
                padding: '8px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                color: '#1E293B',
              }}
            >
              Visit & Relax →
            </button>
          </div>
        )}

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

          {/* Today isn't a fixed curriculum with a total to complete (see
              GAME_ENGINE.md) — dots show real progress made without implying
              a required count, capped visually rather than ever claiming
              "out of" a number that doesn't exist. */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, background: '#F0F8F5', borderRadius: 12, padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today</span>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {Array.from({ length: Math.min(gamesCompletedToday, 5) }).map((_, i) => (
                  <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--color-primary)' }} />
                ))}
                {gamesCompletedToday === 0 && (
                  <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Not started yet</span>
                )}
                {gamesCompletedToday > 5 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>+{gamesCompletedToday - 5}</span>
                )}
              </div>
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
            <VoiceOrb state="idle" onTap={() => navigate('/voice')} size={100} />
          </div>
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: 'var(--text-tertiary)' }}>
            Tap to speak
          </p>
        </div>

        {/* Memory + Relax — side by side rather than two full-width stacked
            cards, so the screen doesn't keep growing every time a new
            secondary feature is added. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            onClick={() => navigate('/memory')}
            className="card"
            style={{
              borderRadius: 20, textAlign: 'left', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 10,
              padding: '18px 16px', border: '2px solid var(--border-color)',
            }}
          >
            <span style={{ fontSize: 30 }}>❤️</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>My Memories</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Family &amp; favourites</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/relax')}
            className="card"
            style={{
              borderRadius: 20, textAlign: 'left', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 10,
              padding: '18px 16px', border: '2px solid var(--border-color)',
            }}
          >
            <span style={{ fontSize: 30 }}>🌬️</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{lang === 'as' ? t('home.relax_card') : 'Relax'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{lang === 'as' ? t('home.relax_prompt') : 'A few calm breaths'}</div>
            </div>
          </button>
        </div>
      </div>

      <ElderlyNav />
    </div>
  );
}
