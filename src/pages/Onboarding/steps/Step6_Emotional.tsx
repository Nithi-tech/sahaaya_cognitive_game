import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { OnboardingEmotionalSection } from '../../../types';

interface Props {
  saved: OnboardingEmotionalSection | null;
  onSave: (data: OnboardingEmotionalSection) => void;
  onSkip: () => void;
  saving: boolean;
}

const SOUND_OPTIONS = [
  { value: 'nature', label: '🌿 Nature sounds', desc: 'Birds, rain, river' },
  { value: 'music', label: '🎵 Soft music', desc: 'Devotional, classical' },
  { value: 'silence', label: '🤫 Silence', desc: 'Quiet environment' },
  { value: 'chanting', label: '🕉️ Chanting/prayer', desc: 'Religious verses' },
  { value: 'family', label: '👨‍👩‍👧 Family voices', desc: 'Recordings from loved ones' },
];

export default function Step6_Emotional({ saved, onSave, onSkip, saving }: Props) {
  const [calming, setCalming] = useState(saved?.calming ?? '');
  const [sounds, setSounds] = useState(saved?.sounds ?? '');
  const [images, setImages] = useState(saved?.images ?? '');
  const [phrases, setPhrases] = useState<string[]>(saved?.phrases ?? []);
  const [newPhrase, setNewPhrase] = useState('');

  const addPhrase = () => {
    const trimmed = newPhrase.trim();
    if (trimmed && !phrases.includes(trimmed)) {
      setPhrases(prev => [...prev, trimmed]);
      setNewPhrase('');
    }
  };
  const removePhrase = (p: string) => setPhrases(prev => prev.filter(x => x !== p));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ calming: calming || undefined, sounds: sounds || undefined, images: images || undefined, phrases });
  };

  const areaStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #E0E0E0',
    fontSize: 14, resize: 'vertical', minHeight: 80, fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🌸</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Emotional Comfort</h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 6 }}>
          Help Sahaaya know how to soothe the elder when they're anxious or upset.
        </p>
      </div>

      {/* What calms them */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
          💆 What calms them when anxious?
        </label>
        <textarea
          style={areaStyle}
          value={calming}
          onChange={e => setCalming(e.target.value)}
          placeholder="e.g. Holding their granddaughter's hand, humming Bihu tunes, sitting in the garden"
        />
      </div>

      {/* Calming sounds */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
          🔊 Calming sounds / audio
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SOUND_OPTIONS.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSounds(prev => prev === s.value ? '' : s.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12,
                border: `2px solid ${sounds === s.value ? '#9C27B0' : '#E0E0E0'}`,
                background: sounds === s.value ? '#F3E5F5' : 'white',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 20 }}>{s.label.split(' ')[0]}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: sounds === s.value ? '#6A1B9A' : '#333' }}>
                  {s.label.slice(s.label.indexOf(' ') + 1)}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>{s.desc}</div>
              </div>
              {sounds === s.value && <div style={{ marginLeft: 'auto', color: '#9C27B0', fontWeight: 800 }}>✓</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Calming images */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
          🖼️ Calming images / scenes
        </label>
        <textarea
          style={{ ...areaStyle, minHeight: 60 }}
          value={images}
          onChange={e => setImages(e.target.value)}
          placeholder="e.g. The Brahmaputra river, their childhood home courtyard, marigold flowers"
        />
      </div>

      {/* Comfort phrases */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
          💬 Comforting phrases (Sahaaya can speak these aloud)
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {phrases.map(p => (
            <span key={p} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              borderRadius: 99, background: '#E8F5E9', border: '2px solid #A5D6A7',
              fontSize: 13, fontWeight: 600, color: '#2E7D32',
            }}>
              "{p}"
              <button type="button" onClick={() => removePhrase(p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#81C784', padding: 0, lineHeight: 1 }}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '2px solid #E0E0E0', fontSize: 14, fontFamily: 'inherit' }}
            value={newPhrase}
            onChange={e => setNewPhrase(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPhrase(); } }}
            placeholder="e.g. 'Anjali will be here soon' or 'All is well, Ma'"
          />
          <button type="button" onClick={addPhrase}
            style={{ padding: '10px 14px', borderRadius: 10, border: '2px solid #4CAF50', background: '#E8F5E9', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#2E7D32' }}>
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={saving}
          style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: saving ? '#B0BEC5' : 'linear-gradient(135deg, #9C27B0 0%, #3F51B5 100%)',
            color: 'white', fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
          }}>
          {saving ? 'Saving…' : 'Save & Finish Setup →'}
        </button>
        <button type="button" onClick={onSkip} disabled={saving}
          style={{ padding: '14px 20px', borderRadius: 12, border: '2px solid #E0E0E0', background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#888' }}>
          Skip
        </button>
      </div>
    </form>
  );
}
