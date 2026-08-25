import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useApp } from '../../store/AppContext';
import { useTranslation } from '../../i18n/useTranslation';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../constants/demoAccounts';
import type { Language } from '../../types';

const HOW_IT_WORKS = [
  { step: '1', icon: '🙋', title: 'Pick who you are', body: 'Elderly, caregiver, or healthcare worker — each gets a purpose-built experience.' },
  { step: '2', icon: '🗣️', title: 'Sahaaya guides gently', body: 'Voice-narrated memory, attention & pattern games at a comfortable, unhurried pace.' },
  { step: '3', icon: '📈', title: 'Progress stays visible', body: 'Caregivers and clinicians see real engagement trends — never a diagnosis, always a signal.' },
];

const STATS = [
  { value: '6', label: 'Cognitive activities' },
  { value: '2', label: 'Languages (EN · অসমীয়া)' },
  { value: '100%', label: 'Works offline-first' },
];

export default function LandingPage() {
  const { login, authError } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'closed' | 'login'>('closed');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleDemoLogin = async (demoEmail: string) => {
    setSubmitting(true);
    try {
      await login(demoEmail, DEMO_PASSWORD);
    } catch {
      /* authError is shown */
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      /* authError is shown */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing">
      {/* Hero Section */}
      <div className="landing-hero animate-fade-in">
        <div className="landing-logo">🧠</div>
        <h1 className="landing-brand">Sahaaya</h1>
        <div className="landing-badge">✨ Free live demo &mdash; no signup required</div>
        <h2 className="landing-headline">{t('landing.headline')}</h2>
        <p className="landing-subheadline">{t('landing.subheadline')}</p>

        {/* Language Selector */}
        <div className="landing-lang-toggle">
          <LanguageToggle />
        </div>

        {mode === 'closed' ? (
          <>
            {/* Quick Demo Role Buttons */}
            <div className="landing-role-buttons">
              {DEMO_ACCOUNTS.map((acc, i) => (
                <button
                  key={acc.role}
                  className={`landing-role-btn ${i === 0 ? 'landing-role-btn--primary' : ''}`}
                  onClick={() => handleDemoLogin(acc.email)}
                  disabled={submitting}
                >
                  <span style={{ fontSize: 28 }}>{acc.emoji}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>{t(acc.label)}</div>
                    <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 400, marginTop: 2 }}>{acc.sub}</div>
                  </div>
                </button>
              ))}
            </div>

            {authError && <p className="landing-error">{authError}</p>}

            <button className="landing-link-btn" onClick={() => setMode('login')}>
              Sign in with your own account
            </button>

            <p className="landing-fineprint">
              🔒 Each button above signs in as a real seeded account (password: demo1234) through the live backend —
              every activity, score, and reminder you see is genuinely stored and computed, nothing is faked.
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="landing-login-form">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="landing-input"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="landing-input"
            />
            {authError && <p className="landing-error">{authError}</p>}
            <button type="submit" className="btn btn--primary" disabled={submitting} style={{ height: 52, fontSize: 16, borderRadius: 14 }}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
            <button type="button" className="landing-link-btn" onClick={() => setMode('closed')}>
              ← Back to demo accounts
            </button>
          </form>
        )}
      </div>

      {/* How it works */}
      <div className="landing-how">
        <h3 className="landing-section-title">How Sahaaya works</h3>
        <div className="landing-how-grid">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.step} className="landing-how-card">
              <div className="landing-how-card__step">{s.step}</div>
              <div className="landing-how-card__icon">{s.icon}</div>
              <div className="landing-how-card__title">{s.title}</div>
              <div className="landing-how-card__body">{s.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Sahaaya */}
      <div className="landing-features">
        <h3 className="landing-section-title">{t('landing.why')}</h3>
        <p className="landing-section-subtitle">Built for North-East India · Assam Pilot Content</p>
        <div className="features-grid">
          {[
            { icon: '🧠', label: t('landing.feature1') },
            { icon: '🗣️', label: t('landing.feature2') },
            { icon: '❤️', label: t('landing.feature3') },
            { icon: '📶', label: t('landing.feature4') },
            { icon: '👨‍👩‍👧', label: t('landing.feature5') },
            { icon: '🌏', label: t('landing.feature6') },
          ].map((f) => (
            <div key={f.label} className="feature-item">
              <div className="feature-item__icon">{f.icon}</div>
              <div className="feature-item__label">{f.label}</div>
            </div>
          ))}
        </div>

        <div className="landing-stats">
          {STATS.map((s) => (
            <div key={s.label} className="landing-stat">
              <div className="landing-stat__value">{s.value}</div>
              <div className="landing-stat__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="landing-disclaimer">
          ⚠️ <strong>Important:</strong> Sahaaya is a cognitive engagement and activity platform.
          It does not diagnose, treat, or predict any medical condition including dementia or Alzheimer's disease.
        </div>

        <p className="landing-footer-note">Made with care for elderly wellbeing · Sahaaya</p>
      </div>
    </div>
  );
}

function LanguageToggle() {
  const { lang } = useTranslation();
  const { setLanguage } = useApp();

  return (
    <>
      {([['en', 'English'], ['as', 'অসমীয়া']] as [string, string][]).map(([code, label]) => (
        <button
          key={code}
          onClick={() => setLanguage(code as Language)}
          className={`landing-lang-btn ${lang === code ? 'landing-lang-btn--active' : ''}`}
        >
          {label}
        </button>
      ))}
    </>
  );
}
