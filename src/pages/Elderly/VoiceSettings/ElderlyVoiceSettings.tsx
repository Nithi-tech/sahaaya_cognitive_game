import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { useApp } from '../../../store/AppContext';
import { useAuth } from '../../../store/AuthContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { useQuizVoice } from '../../../hooks/useQuizVoice';
import { narrateSample } from '../../../services/voice/narration';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';
import { getPersonalization } from '../../../services/personalization';
import { getVoiceCloneStatus } from '../../../services/voice/voiceCloneService';
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
  const personalization = getPersonalization(currentPatient);
  const cloneStatus = getVoiceCloneStatus(currentPatient);
  const { user, logout } = useAuth();
  const voice = useQuizVoice();
  const prefs = currentPatient?.preferences;

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
        {/* Family Voice Persona Card */}
        {personalization.favoritePerson && (
          <div
            className="card"
            style={{
              borderRadius: 20, padding: '18px 20px',
              border: '2px solid rgba(46,125,139,0.2)',
              background: 'linear-gradient(135deg, #F0FDF4 0%, #E0F2FE 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {personalization.favoritePerson.photoUrl ? (
                  <img
                    src={personalization.favoritePerson.photoUrl}
                    alt={personalization.favoritePerson.name}
                    style={{ width: 48, height: 48, borderRadius: 50, objectFit: 'cover', border: '2px solid var(--color-primary)' }}
                  />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 50, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    ❤️
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                    Active Voice Persona
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#1E293B' }}>
                    {personalization.favoritePerson.name} ({personalization.favoritePerson.relationship})
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Sahaaya reads aloud with your loved one's familiar voice &amp; tone
                  </div>
                  <div style={{
                    marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#475569',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: cloneStatus.badgeColor }} />
                    <span>{cloneStatus.label}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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

          <button
            type="button"
            className="btn btn--outline"
            style={{ width: '100%', height: 52, fontSize: 16, borderRadius: 16, marginTop: 12, color: 'var(--color-danger)' }}
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
