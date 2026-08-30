import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useApp } from '../../store/AppContext';
import { useTranslation } from '../../i18n/useTranslation';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../constants/demoAccounts';
import type { Language } from '../../types';

/**
 * A single focused mobile login screen — not a marketing site. Picking a
 * role signs straight into that role's app experience through the same
 * real backend login every account uses (see AuthContext.login).
 */
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
      <div className="landing-card animate-scale-in">
        <div className="landing-logo">🧠</div>
        <h1 className="landing-brand">Sahaaya</h1>
        <p className="landing-tagline">{t('landing.headline')}</p>

        <div className="landing-lang-toggle">
          <LanguageToggle />
        </div>

        {mode === 'closed' ? (
          <>
            <div className="landing-role-buttons">
              {DEMO_ACCOUNTS.map((acc, i) => (
                <button
                  key={acc.role}
                  className={`landing-role-btn ${i === 0 ? 'landing-role-btn--primary' : `landing-role-btn--${acc.role}`}`}
                  onClick={() => handleDemoLogin(acc.email)}
                  disabled={submitting}
                >
                  <span className="landing-role-btn__emoji">{acc.emoji}</span>
                  <span className="landing-role-btn__text">
                    <span className="landing-role-btn__label">{t(acc.label)}</span>
                    <span className="landing-role-btn__sub">{acc.sub}</span>
                  </span>
                  <span className="landing-role-btn__arrow">→</span>
                </button>
              ))}
            </div>

            {authError && <p className="landing-error">{authError}</p>}

            <button className="landing-link-btn" onClick={() => setMode('login')}>
              Sign in with your own account
            </button>
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
            <button type="submit" className="btn btn--primary" disabled={submitting} style={{ height: 60, fontSize: 18, borderRadius: 18 }}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
            <button type="button" className="landing-link-btn" onClick={() => setMode('closed')}>
              ← Back
            </button>
          </form>
        )}
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
