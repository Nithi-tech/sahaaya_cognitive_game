import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useApp } from '../../store/AppContext';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../types';

export default function LandingPage() {
  const { login, register, authError } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'closed' | 'login' | 'register'>('closed');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register({ email: regEmail, password: regPassword, name: regName, role: 'caregiver' });
      // After registration, the AppRoutes will auto-redirect to /onboarding
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
        <div className="landing-badge">🌿 Cognitive Engagement & Daily Care for Elders</div>
        <h2 className="landing-headline">{t('landing.headline')}</h2>
        <p className="landing-subheadline">{t('landing.subheadline')}</p>

        <div className="landing-lang-toggle">
          <LanguageToggle />
        </div>

        {mode === 'closed' ? (
          <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Get Started CTA */}
            <button
              className="landing-role-btn landing-role-btn--primary"
              onClick={() => setMode('register')}
              disabled={submitting}
              style={{ width: '100%', justifyContent: 'center', fontSize: 16 }}
            >
              <span style={{ fontSize: 26 }}>🙋</span>
              <div style={{ textAlign: 'left' }}>
                <div>Get Started — Create Caregiver Account</div>
                <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 400, marginTop: 2 }}>Set up personalised care for your elder</div>
              </div>
            </button>

            {/* Elder PIN Login */}
            <button
              className="landing-role-btn"
              onClick={() => navigate('/pin-login')}
              disabled={submitting}
              style={{ width: '100%', justifyContent: 'center', fontSize: 15 }}
            >
              <span style={{ fontSize: 26 }}>🔢</span>
              <div style={{ textAlign: 'left' }}>
                <div>Elder Login</div>
                <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 400, marginTop: 2 }}>Log in directly with your Unique Access ID</div>
              </div>
            </button>

            {authError && <p className="landing-error">{authError}</p>}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14, marginTop: 6, textAlign: 'center' }}>
              <button
                className="landing-link-btn"
                onClick={() => setMode('login')}
                style={{ fontSize: 14, textDecoration: 'underline' }}
              >
                Already have an account? Sign in with Email
              </button>
            </div>
          </div>
        ) : mode === 'register' ? (
          <form onSubmit={handleRegister} className="landing-login-form">
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, textAlign: 'center' }}>Create Caregiver Account</h3>
            <input
              type="text"
              required
              placeholder="Your full name"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              className="landing-input"
            />
            <input
              type="email"
              required
              placeholder="Email address"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              className="landing-input"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password (min 8 characters)"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              className="landing-input"
            />
            {authError && <p className="landing-error">{authError}</p>}
            <button type="submit" className="btn btn--primary" disabled={submitting} style={{ height: 52, fontSize: 16, borderRadius: 14 }}>
              {submitting ? 'Creating account…' : 'Create Account & Set Up Elder →'}
            </button>
            <button type="button" className="landing-link-btn" onClick={() => setMode('closed')}>
              ← Back
            </button>
          </form>
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
