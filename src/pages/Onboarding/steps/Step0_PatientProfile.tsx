import { useState } from 'react';
import { useApp } from '../../../store/AppContext';
import type { Language } from '../../../types';

interface Props {
  onCreated: (accessId: string) => void;
}

const REGIONS = ['Assam', 'Meghalaya', 'Manipur', 'Nagaland', 'Arunachal Pradesh', 'Mizoram', 'Tripura', 'Sikkim', 'Other'];

function generateAccessId(): string {
  return `SAH-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function Step0_PatientProfile({ onCreated }: Props) {
  const { createPatient } = useApp();
  const [form, setForm] = useState({
    name: '',
    age: '',
    region: 'Assam',
    language: 'en' as Language,
    accessId: generateAccessId(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Please enter the elder\'s name';
    if (!form.age || isNaN(Number(form.age)) || Number(form.age) < 40 || Number(form.age) > 110)
      e.age = 'Please enter a valid age (40–110)';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setApiError('');
    try {
      await createPatient({
        name: form.name.trim(),
        age: Number(form.age),
        region: form.region,
        language: form.language,
        pin: form.accessId,
      });
      onCreated(form.accessId);
    } catch (err) {
      setApiError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const regenerateAccessId = () => setForm(f => ({ ...f, accessId: generateAccessId() }));

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: 16,
    border: `2px solid ${errors[field] ? '#F44336' : '#E0E0E0'}`,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'border-color 0.15s',
  });

  return (
    <form onSubmit={handleSubmit} style={{ padding: '32px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>👤</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Patient Profile</h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 6 }}>
          Tell us about the elder you're caring for. You'll set up their personal preferences in the next steps.
        </p>
      </div>

      {apiError && (
        <div style={{ background: '#FFEBEE', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#C62828' }}>
          {apiError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Name */}
        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
            Elder's full name *
          </label>
          <input
            style={inputStyle('name')}
            value={form.name}
            onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(v => ({ ...v, name: '' })); }}
            placeholder="e.g. Maya Devi"
            autoFocus
          />
          {errors.name && <p style={{ color: '#F44336', fontSize: 12, marginTop: 4 }}>{errors.name}</p>}
        </div>

        {/* Age + Region */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Age *</label>
            <input
              style={inputStyle('age')}
              type="number"
              min={40} max={110}
              value={form.age}
              onChange={e => { setForm(f => ({ ...f, age: e.target.value })); setErrors(v => ({ ...v, age: '' })); }}
              placeholder="e.g. 72"
            />
            {errors.age && <p style={{ color: '#F44336', fontSize: 12, marginTop: 4 }}>{errors.age}</p>}
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Region</label>
            <select
              style={{ ...inputStyle('region'), background: 'white' }}
              value={form.region}
              onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
            >
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Language */}
        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Preferred language</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {([['en', 'English', '🇮🇳'], ['as', 'অসমীয়া', '🌿']] as [Language, string, string][]).map(([code, label, emoji]) => (
              <button
                key={code}
                type="button"
                onClick={() => setForm(f => ({ ...f, language: code }))}
                style={{
                  flex: 1, padding: '14px 12px', borderRadius: 14,
                  border: `2px solid ${form.language === code ? 'var(--color-primary, #2E7D8B)' : '#E0E0E0'}`,
                  background: form.language === code ? 'rgba(46,125,139,0.08)' : 'white',
                  cursor: 'pointer', fontSize: 15, fontWeight: 700,
                }}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Unique Access ID */}
        <div style={{ background: '#F8FAFB', borderRadius: 16, padding: '16px 20px' }}>
          <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            Elder's Unique Access ID
          </label>
          <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
            This is the unique ID the elder will use to log in directly. No password or email needed.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              fontSize: 32, fontWeight: 900, letterSpacing: 4,
              color: 'var(--color-primary, #2E7D8B)', fontFamily: 'monospace',
              flex: 1, textAlign: 'center',
              background: 'white', borderRadius: 12, padding: '12px 16px',
              border: '2px solid rgba(46,125,139,0.2)',
            }}>
              {form.accessId}
            </div>
            <button
              type="button"
              onClick={regenerateAccessId}
              style={{
                padding: '12px 16px', borderRadius: 12, border: '2px solid #E0E0E0',
                background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                color: '#666',
              }}
            >
              🔄 New ID
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: saving ? '#B0BEC5' : 'linear-gradient(135deg, #2E7D8B 0%, #1565C0 100%)',
            color: 'white', fontSize: 17, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {saving ? 'Creating profile…' : 'Create Patient Profile →'}
        </button>
      </div>
    </form>
  );
}
