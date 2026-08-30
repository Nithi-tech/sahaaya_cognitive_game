import { useState } from 'react';
import type { OnboardingFavoritesSection } from '../../../types';

interface Props {
  saved: OnboardingFavoritesSection | null;
  onSave: (data: OnboardingFavoritesSection) => void;
  onSkip: () => void;
  saving: boolean;
}

const PRESET_COLOURS = [
  { label: 'Saffron', value: '#FF6B35' },
  { label: 'Teal', value: '#2E7D8B' },
  { label: 'Rose', value: '#E91E63' },
  { label: 'Forest', value: '#2E7D32' },
  { label: 'Gold', value: '#F9A825' },
  { label: 'Indigo', value: '#3F51B5' },
  { label: 'Sky', value: '#29B6F6' },
  { label: 'Magenta', value: '#9C27B0' },
];

const MUSIC_OPTIONS = ['Bihu', 'Classical (Hindustani)', 'Devotional', 'Folk Songs', 'Film Songs', 'Instrumental', 'Nature Sounds'];

export default function Step2_Favorites({ saved, onSave, onSkip, saving }: Props) {
  const [form, setForm] = useState<OnboardingFavoritesSection>({
    food: saved?.food ?? '',
    colour: saved?.colour ?? '',
    music: saved?.music ?? '',
    place: saved?.place ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: '2px solid #E0E0E0', fontSize: 15, boxSizing: 'border-box',
    fontFamily: 'inherit', outline: 'none',
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>❤️</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Favourites</h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 6 }}>
          Ask the elder: <em>"What makes you smile?"</em> These help personalise their experience.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Food */}
        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
            🍛 Favourite food
          </label>
          <input
            style={inputStyle}
            value={form.food}
            onChange={e => setForm(f => ({ ...f, food: e.target.value }))}
            placeholder="e.g. Rice and fish curry, Assam tea"
          />
        </div>

        {/* Colour */}
        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            🎨 Favourite colour
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {PRESET_COLOURS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, colour: c.value }))}
                title={c.label}
                style={{
                  width: 44, height: 44, borderRadius: 10, background: c.value,
                  border: `3px solid ${form.colour === c.value ? '#333' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: form.colour === c.value ? '0 0 0 2px white, 0 0 0 4px ' + c.value : 'none',
                }}
              />
            ))}
          </div>
          {form.colour && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: form.colour, border: '2px solid #E0E0E0' }} />
              <span style={{ fontSize: 13, color: '#666' }}>{form.colour}</span>
              <button type="button" onClick={() => setForm(f => ({ ...f, colour: '' }))}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 12 }}>
                ✕ clear
              </button>
            </div>
          )}
        </div>

        {/* Music */}
        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
            🎵 Favourite music / songs
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {MUSIC_OPTIONS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setForm(f => ({ ...f, music: f.music === m ? '' : m }))}
                style={{
                  padding: '8px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                  border: `2px solid ${form.music === m ? '#E91E63' : '#E0E0E0'}`,
                  background: form.music === m ? '#FCE4EC' : 'white',
                  color: form.music === m ? '#C2185B' : '#555', cursor: 'pointer',
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <input
            style={{ ...inputStyle, fontSize: 13 }}
            value={MUSIC_OPTIONS.includes(form.music ?? '') ? '' : (form.music ?? '')}
            onChange={e => setForm(f => ({ ...f, music: e.target.value }))}
            placeholder="Or type a specific song, artist, or genre…"
          />
        </div>

        {/* Place */}
        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
            🏠 Meaningful place
          </label>
          <input
            style={inputStyle}
            value={form.place}
            onChange={e => setForm(f => ({ ...f, place: e.target.value }))}
            placeholder="e.g. Childhood home in Jorhat, the family temple"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: saving ? '#B0BEC5' : 'linear-gradient(135deg, #FF6B35 0%, #E91E63 100%)',
            color: 'white', fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save & Continue →'}
        </button>
        <button type="button" onClick={onSkip} disabled={saving}
          style={{ padding: '14px 20px', borderRadius: 12, border: '2px solid #E0E0E0', background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#888' }}>
          Skip
        </button>
      </div>
    </form>
  );
}
