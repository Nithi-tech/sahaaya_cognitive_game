import { useState } from 'react';
import { CheckCircle, Copy } from 'lucide-react';

interface Props {
  patientName: string;
  pin: string;
  onGoToDashboard: () => void;
}

export default function Step7_Done({ patientName, pin, onGoToDashboard }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{ padding: '40px 28px', textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
        background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircle size={40} color="white" />
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>
        {patientName ? `${patientName} is all set! 🎉` : 'Setup complete! 🎉'}
      </h2>
      <p style={{ color: '#555', fontSize: 15, maxWidth: 400, margin: '0 auto 32px' }}>
        The personalisation data has been saved. Hand the elder their PIN to log in any time.
      </p>

      {/* Access ID display */}
      {pin && (
        <div style={{
          background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)',
          border: '3px solid #90CAF9', borderRadius: 20,
          padding: '24px 32px', marginBottom: 32, display: 'inline-block',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1565C0', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Elder's Unique Access ID
          </div>
          <div style={{
            fontSize: 44, fontWeight: 900, fontFamily: 'monospace',
            letterSpacing: 6, color: '#1A237E', lineHeight: 1,
          }}>
            {pin}
          </div>
          <button
            onClick={handleCopy}
            style={{
              marginTop: 16, padding: '10px 20px', borderRadius: 10,
              border: `2px solid ${copied ? '#4CAF50' : '#90CAF9'}`,
              background: copied ? '#E8F5E9' : 'white',
              cursor: 'pointer', fontSize: 14, fontWeight: 700,
              color: copied ? '#2E7D32' : '#1565C0',
              display: 'flex', alignItems: 'center', gap: 8, margin: '16px auto 0',
            }}
          >
            <Copy size={14} /> {copied ? 'Copied!' : 'Copy Unique ID'}
          </button>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        background: '#FFF8E1', border: '1.5px solid #FFE082', borderRadius: 16,
        padding: '16px 20px', marginBottom: 28, textAlign: 'left',
      }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#F57F17', marginBottom: 8 }}>📋 What to tell the elder:</div>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#555', lineHeight: 1.8 }}>
          <li>Open Sahaaya on their phone or tablet.</li>
          <li>Tap <strong>"Elder Login"</strong> on the start screen.</li>
          <li>Enter their Unique Access ID: <strong style={{ fontFamily: 'monospace', fontSize: 16, color: '#1A237E' }}>{pin || 'SAH-****'}</strong></li>
          <li>That's it — Sahaaya will open directly and greet them by name!</li>
        </ol>
      </div>

      {/* What was personalised */}
      <div style={{
        background: '#F1F8E9', border: '1.5px solid #AED581', borderRadius: 16,
        padding: '16px 20px', marginBottom: 28, textAlign: 'left',
      }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#558B2F', marginBottom: 8 }}>✨ Now personalised for {patientName || 'the elder'}:</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#555', lineHeight: 1.8 }}>
          <li>Family & Faces game recognises saved people</li>
          <li>Daily Routine uses their personal schedule</li>
          <li>Cultural games include their familiar festivals & objects</li>
          <li>Medicine reminders created automatically</li>
          <li>Breathing exercise defaults to their calming sounds</li>
        </ul>
      </div>

      <button
        onClick={onGoToDashboard}
        style={{
          width: '100%', padding: '18px', borderRadius: 14, border: 'none',
          background: 'linear-gradient(135deg, #2E7D8B 0%, #1565C0 100%)',
          color: 'white', fontSize: 17, fontWeight: 800, cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(46,125,139,0.3)',
        }}
      >
        Go to Caregiver Dashboard →
      </button>
    </div>
  );
}
