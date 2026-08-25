import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Repeat } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import { useAuth } from '../../../store/AuthContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { useQuizVoice } from '../../../hooks/useQuizVoice';
import { narrateSample } from '../../../services/voice/narration';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../../constants/demoAccounts';
import type { VoiceSpeed, Language } from '../../../types';

const SPEEDS: VoiceSpeed[] = ['slow', 'normal', 'fast'];
const VOICE_LANGS: { value: Language; label: string; labelAs: string }[] = [
  { value: 'en', label: 'English', labelAs: 'ইংৰাজী' },
  { value: 'as', label: 'Assamese', labelAs: 'অসমীয়া' },
];

function ToggleRow({
  label, value, onChange, onLabel, offLabel,
}: { label: string; value: boolean; onChange: (v: boolean) => void; onLabel: string; offLabel: string }) {
  return (
    <div className="voice-settings__row">
      <span className="voice-settings__row-label">{label}</span>
      <div className="voice-settings__segmented" role="group" aria-label={label}>
        <button
          type="button"
          className={`voice-settings__segment ${value ? 'voice-settings__segment--active' : ''}`}
          aria-pressed={value}
          onClick={() => onChange(true)}
        >
          {onLabel}
        </button>
        <button
          type="button"
          className={`voice-settings__segment ${!value ? 'voice-settings__segment--active' : ''}`}
          aria-pressed={!value}
          onClick={() => onChange(false)}
        >
          {offLabel}
        </button>
      </div>
    </div>
  );
}

export default function ElderlyVoiceSettings() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const { currentPatient, updatePreferences } = useApp();
  const { user, login, logout } = useAuth();
  const voice = useQuizVoice();
  const prefs = currentPatient?.preferences;
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const handleSwitchRole = async (email: string) => {
    setSwitching(email);
    try {
      await login(email, DEMO_PASSWORD);
      navigate('/');
    } catch {
      setSwitching(null);
    }
  };

  const voiceEnabled = prefs?.voiceEnabled ?? true;
  const spokenFeedback = prefs?.spokenFeedback ?? true;
  const voiceLanguage = prefs?.voiceLanguage;
  const voiceSpeed = prefs?.voiceSpeed ?? 'slow';
  const voiceVolume = prefs?.voiceVolume ?? 1;

  return (
    <div className="elderly-layout" style={{ paddingBottom: 90 }}>
      <div style={{ padding: '20px 20px 0' }}>
        <button className="btn btn--ghost" onClick={() => navigate(-1)} style={{ gap: 6, color: 'var(--text-secondary)', paddingLeft: 0 }}>
          <ArrowLeft size={20} /> {t('general.back')}
        </button>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{t('voice.settings.title')}</h1>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card voice-settings__card">
          <ToggleRow
            label={t('voice.settings.read_aloud')}
            value={voiceEnabled}
            onChange={(v) => updatePreferences({ voiceEnabled: v })}
            onLabel={t('voice.settings.on')}
            offLabel={t('voice.settings.off')}
          />
          <ToggleRow
            label={t('voice.settings.spoken_feedback')}
            value={spokenFeedback}
            onChange={(v) => updatePreferences({ spokenFeedback: v })}
            onLabel={t('voice.settings.on')}
            offLabel={t('voice.settings.off')}
          />
        </div>

        <div className="card voice-settings__card">
          <p className="voice-settings__section-label">{t('voice.settings.language')}</p>
          <div className="voice-settings__chip-row">
            <button
              type="button"
              className={`voice-settings__chip ${!voiceLanguage ? 'voice-settings__chip--active' : ''}`}
              aria-pressed={!voiceLanguage}
              onClick={() => updatePreferences({ voiceLanguage: undefined })}
            >
              {t('voice.settings.language_match')}
            </button>
            {VOICE_LANGS.map((l) => (
              <button
                key={l.value}
                type="button"
                className={`voice-settings__chip ${voiceLanguage === l.value ? 'voice-settings__chip--active' : ''}`}
                aria-pressed={voiceLanguage === l.value}
                onClick={() => updatePreferences({ voiceLanguage: l.value })}
              >
                {lang === 'as' ? l.labelAs : l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card voice-settings__card">
          <p className="voice-settings__section-label">{t('voice.settings.speed')}</p>
          <div className="voice-settings__chip-row">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                className={`voice-settings__chip ${voiceSpeed === s ? 'voice-settings__chip--active' : ''}`}
                aria-pressed={voiceSpeed === s}
                onClick={() => updatePreferences({ voiceSpeed: s })}
              >
                {t(`voice.settings.speed_${s}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="card voice-settings__card">
          <p className="voice-settings__section-label">{t('voice.settings.volume')}</p>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.1}
            value={voiceVolume}
            onChange={(e) => updatePreferences({ voiceVolume: Number(e.target.value) })}
            className="voice-settings__slider"
            aria-label={t('voice.settings.volume')}
          />
        </div>

        <div className="card voice-settings__card">
          <p className="voice-settings__section-label">{t('voice.settings.test')}</p>
          <button
            type="button"
            className="btn btn--primary"
            style={{ width: '100%', height: 56, fontSize: 17, borderRadius: 16, gap: 8 }}
            onClick={() => voice.speak(narrateSample(lang))}
          >
            <Volume2 size={20} />
            {voice.isSpeaking ? t('voice.speaking') : t('voice.settings.play')}
          </button>
          {!voice.isSupported && <p className="voice-controls__fallback" style={{ marginTop: 10 }}>{t('voice.unavailable_msg')}</p>}
        </div>

        {/* Account */}
        <div className="card voice-settings__card">
          <p className="voice-settings__section-label">Account</p>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{currentPatient?.name ?? user?.name}</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {lang === 'as' ? 'অসমীয়া' : 'English'}
          </div>

          {!showRoleSwitch ? (
            <button
              type="button"
              className="btn btn--outline"
              style={{ width: '100%', height: 56, fontSize: 16, borderRadius: 16, gap: 8, marginTop: 4 }}
              onClick={() => setShowRoleSwitch(true)}
            >
              <Repeat size={18} /> Switch Role
            </button>
          ) : (
            <div style={{ marginTop: 4 }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Switch to a different account type:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={switching !== null}
                    onClick={() => handleSwitchRole(acc.email)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 14,
                      border: `2px solid ${acc.email === user?.email ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      background: acc.email === user?.email ? 'rgba(46,125,139,0.06)' : 'white',
                      cursor: switching !== null ? 'default' : 'pointer',
                      opacity: switching !== null && switching !== acc.email ? 0.5 : 1,
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{acc.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{acc.sub}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                        {acc.role}{acc.email === user?.email ? ' · Current' : ''}
                      </div>
                    </div>
                    {switching === acc.email && <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Switching…</span>}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                style={{ width: '100%', marginTop: 10, color: 'var(--text-tertiary)' }}
                onClick={() => setShowRoleSwitch(false)}
                disabled={switching !== null}
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ width: '100%', marginTop: 8, color: 'var(--color-danger)' }}
            onClick={() => { logout(); navigate('/'); }}
          >
            Log Out
          </button>
        </div>
      </div>

      <ElderlyNav />
    </div>
  );
}
