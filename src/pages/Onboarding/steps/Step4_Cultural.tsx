import { useState } from 'react';
import type { OnboardingCulturalSection } from '../../../types';

interface Props {
  saved: OnboardingCulturalSection | null;
  onSave: (data: OnboardingCulturalSection) => void;
  onSkip: () => void;
  saving: boolean;
}

const FESTIVAL_OPTIONS = ['Bihu', 'Durga Puja', 'Eid', 'Christmas', 'Diwali', 'Navratri', 'Baisakhi', 'Lohri', 'Onam', 'Pongal'];
const OBJECT_OPTIONS = ['Jaapi', 'Mekhela Chador', 'Gamosa', 'Dhol', 'Pepa', 'Brass Pots', 'Hand Loom', 'Bamboo Craft', 'Terracotta'];

function ToggleChips({
  options, selected, onToggle, customPlaceholder,
}: {
  options: string[];
  selected: string[];
  onToggle: (item: string) => void;
  customPlaceholder?: string;
}) {
  const [custom, setCustom] = useState('');

  const handleCustomAdd = () => {
    if (custom.trim() && !selected.includes(custom.trim())) {
      onToggle(custom.trim());
      setCustom('');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(o => (
          <button
            key={o} type="button" onClick={() => onToggle(o)}
            style={{
              padding: '8px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
              border: `2px solid ${selected.includes(o) ? '#3F51B5' : '#E0E0E0'}`,
              background: selected.includes(o) ? '#E8EAF6' : 'white',
              color: selected.includes(o) ? '#3F51B5' : '#555', cursor: 'pointer',
            }}
          >
            {selected.includes(o) ? '✓ ' : ''}{o}
          </button>
        ))}
        {selected.filter(s => !options.includes(s)).map(s => (
          <button
            key={s} type="button" onClick={() => onToggle(s)}
            style={{
              padding: '8px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
              border: '2px solid #3F51B5', background: '#E8EAF6', color: '#3F51B5', cursor: 'pointer',
            }}
          >
            ✓ {s}
          </button>
        ))}
      </div>
      {customPlaceholder && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '2px solid #E0E0E0', fontSize: 13, fontFamily: 'inherit' }}
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCustomAdd(); } }}
            placeholder={customPlaceholder}
          />
          <button
            type="button" onClick={handleCustomAdd}
            style={{ padding: '10px 14px', borderRadius: 10, border: '2px solid #3F51B5', background: '#E8EAF6', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#3F51B5' }}
          >
            + Add
          </button>
        </div>
      )}
    </>
  );
}

export default function Step4_Cultural({ saved, onSave, onSkip, saving }: Props) {
  const [festivals, setFestivals] = useState<string[]>(saved?.festivals ?? []);
  const [objects, setObjects] = useState<string[]>(saved?.traditionalObjects ?? []);
  const [dialect, setDialect] = useState(saved?.dialect ?? '');

  const toggleFestival = (f: string) =>
    setFestivals(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  const toggleObject = (o: string) =>
    setObjects(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ festivals, traditionalObjects: objects, dialect });
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎨</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Cultural & Regional Memory</h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 6 }}>
          Cultural familiarity strengthens memory recall. Select what resonates with the elder.
        </p>
      </div>

      {/* Festivals */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
          🪔 Festivals celebrated
        </label>
        <ToggleChips
          options={FESTIVAL_OPTIONS}
          selected={festivals}
          onToggle={toggleFestival}
          customPlaceholder="Add another festival…"
        />
      </div>

      {/* Traditional objects */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
          🪡 Familiar traditional objects / crafts
        </label>
        <ToggleChips
          options={OBJECT_OPTIONS}
          selected={objects}
          onToggle={toggleObject}
          customPlaceholder="Add an object or craft…"
        />
      </div>

      {/* Dialect */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
          🗣️ Regional language / dialect notes
        </label>
        <textarea
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #E0E0E0',
            fontSize: 14, resize: 'vertical', minHeight: 80, fontFamily: 'inherit', boxSizing: 'border-box',
          }}
          value={dialect}
          onChange={e => setDialect(e.target.value)}
          placeholder="e.g. Prefers Assamese over Hindi, uses Kamrupi dialect, understands Bengali"
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={saving}
          style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: saving ? '#B0BEC5' : 'linear-gradient(135deg, #3F51B5 0%, #9C27B0 100%)',
            color: 'white', fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
          }}>
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
