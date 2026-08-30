import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthToken } from '../../api/client';
import type { AuthUser } from '../../store/AuthContext';

export default function ElderPinLogin() {
  const navigate = useNavigate();
  // Store just the 4-digit code (auto-prefixed with SAH-) or full accessId
  const [digits, setDigits] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const fullId = digits ? `SAH-${digits}` : '';

  const handleDigit = (d: string) => {
    if (digits.length < 4) {
      const next = digits + d;
      setDigits(next);
      if (next.length === 4) {
        verifyLogin(`SAH-${next}`);
      }
    }
  };

  const handleBackspace = () => setDigits(d => d.slice(0, -1));

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const verifyLogin = async (idToVerify: string) => {
    if (!idToVerify || idToVerify === 'SAH-') {
      setError('Please enter your 4-digit Access ID');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api';
      const res = await fetch(`${API_URL}/auth/elder-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessId: idToVerify }),
      });
      const data = await res.json() as { token?: string; user?: AuthUser; error?: string };
      if (!res.ok || !data.token) {
        throw new Error(data.error ?? 'Invalid Access ID');
      }
      setAuthToken(data.token);
      localStorage.setItem('sahaaya_auth_user', JSON.stringify(data.user));
      navigate('/', { replace: true });
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
      setDigits('');
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  };

  const DIGITS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* Brand */}
      <div style={{ color: 'white', textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🧠</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Sahaaya</h1>
        <p style={{ fontSize: 16, opacity: 0.8, marginTop: 8 }}>Elder Login — Enter your Unique Access ID</p>
      </div>

      <div style={{
        width: '100%', maxWidth: 360,
        background: 'white', borderRadius: 28,
        boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        padding: '32px 28px', textAlign: 'center',
      }}>
        {/* Access ID Display */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#666', marginBottom: 10 }}>
            Unique Access ID
          </label>
          <div style={{
            background: '#F0F9FF', border: '2px solid #0284C7',
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            animation: shake ? 'shake 0.5s ease' : 'none',
          }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#0369A1', fontFamily: 'monospace' }}>
              SAH -
            </span>
            <span style={{
              fontSize: 32, fontWeight: 900,
              fontFamily: 'monospace', color: '#1A237E', letterSpacing: 6,
              minWidth: 100, textAlign: 'left',
            }}>
              {digits ? digits : <span style={{ color: '#B0BEC5' }}>_ _ _ _</span>}
            </span>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 13, color: '#E53935', marginBottom: 16, fontWeight: 700, padding: '8px 12px', background: '#FFEBEE', borderRadius: 10 }}>
            ❌ {error}
          </div>
        )}

        {submitting && (
          <div style={{ fontSize: 14, color: '#0284C7', marginBottom: 16, fontWeight: 800 }}>
            Signing you in…
          </div>
        )}

        {/* Big accessible keypad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {DIGITS.flat().map((d, i) => (
            d === '' ? (
              <div key={i} />
            ) : d === '⌫' ? (
              <button
                key={i}
                type="button"
                onClick={handleBackspace}
                disabled={submitting}
                style={{
                  height: 66, borderRadius: 16, border: '2px solid #E0E0E0',
                  background: '#F5F5F5', fontSize: 24, cursor: 'pointer',
                  fontWeight: 800, color: '#666', transition: 'all 0.1s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {d}
              </button>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => handleDigit(d)}
                disabled={submitting || digits.length >= 4}
                style={{
                  height: 66, borderRadius: 16, border: '2px solid #E2E8F0',
                  background: 'white', fontSize: 28, fontWeight: 900,
                  cursor: submitting || digits.length >= 4 ? 'default' : 'pointer',
                  color: '#0F172A', transition: 'all 0.1s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
              >
                {d}
              </button>
            )
          ))}
        </div>

        <button
          type="button"
          onClick={() => verifyLogin(fullId)}
          disabled={digits.length < 4 || submitting}
          style={{
            width: '100%', marginTop: 20, padding: '16px', borderRadius: 16, border: 'none',
            background: digits.length === 4 && !submitting ? 'linear-gradient(135deg, #0284C7 0%, #1565C0 100%)' : '#E2E8F0',
            color: digits.length === 4 && !submitting ? 'white' : '#94A3B8',
            fontSize: 16, fontWeight: 800, cursor: digits.length === 4 && !submitting ? 'pointer' : 'default',
            boxShadow: digits.length === 4 && !submitting ? '0 8px 20px rgba(2,132,199,0.3)' : 'none',
          }}
        >
          {submitting ? 'Signing in…' : 'Sign In →'}
        </button>
      </div>

      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          marginTop: 24, background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14,
        }}
      >
        ← Back to Main Menu
      </button>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
