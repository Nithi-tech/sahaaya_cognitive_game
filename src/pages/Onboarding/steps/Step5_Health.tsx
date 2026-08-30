import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { OnboardingHealthSection } from '../../../types';

interface Props {
  saved: OnboardingHealthSection | null;
  onSave: (data: OnboardingHealthSection) => void;
  onSkip: () => void;
  saving: boolean;
}

const MOBILITY_OPTIONS = ['Uses a walking aid', 'Needs support on stairs', 'Difficulty sitting/standing', 'Cannot walk long distances', 'Balance issues', 'Uses a wheelchair'];

export default function Step5_Health({ saved, onSave, onSkip, saving }: Props) {
  const [medicines, setMedicines] = useState<Array<{ name: string; time: string }>>(
    saved?.medicines?.length ? saved.medicines : [{ name: '', time: '08:00' }],
  );
  const [selectedMobility, setSelectedMobility] = useState<string[]>([]);
  const [mobilityNotes, setMobilityNotes] = useState(saved?.mobilityIssues ?? '');
  const [diet, setDiet] = useState(saved?.diet ?? '');

  const updateMedicine = (i: number, field: 'name' | 'time', value: string) => {
    setMedicines(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };
  const addMedicine = () => setMedicines(prev => [...prev, { name: '', time: '08:00' }]);
  const removeMedicine = (i: number) => setMedicines(prev => prev.filter((_, idx) => idx !== i));

  const toggleMobility = (opt: string) =>
    setSelectedMobility(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMeds = medicines.filter(m => m.name.trim());
    const mobilityText = [...selectedMobility, ...(mobilityNotes ? [mobilityNotes] : [])].join('; ');
    onSave({ medicines: validMeds, mobilityIssues: mobilityText || undefined, diet: diet || undefined });
  };

  const fieldStyle: React.CSSProperties = {
    padding: '12px 14px', borderRadius: 10, border: '2px solid #E0E0E0',
    fontSize: 14, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
      {/* Sensitive banner */}
      <div style={{
        background: '#FFF3E0', border: '2px solid #FFB74D', borderRadius: 14,
        padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 24 }}>🔒</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#E65100' }}>Caregiver-only · Sensitive Information</div>
          <div style={{ fontSize: 12, color: '#BF360C', marginTop: 4 }}>
            This information is only visible to caregivers and healthcare workers.
            The elder's login does not expose this data.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 26, marginBottom: 6 }}>💊</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Health & Safety Basics</h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 6 }}>
          Add medications so Sahaaya can auto-create reminders. You can add or edit these later in Reminders.
        </p>
      </div>

      {/* Medicines */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
          💊 Medicines & times
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {medicines.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                style={{ ...fieldStyle, flex: 1 }}
                placeholder="Medicine name (e.g. Metformin 500mg)"
                value={m.name}
                onChange={e => updateMedicine(i, 'name', e.target.value)}
              />
              <input
                type="time"
                style={{ ...fieldStyle, width: 110, flexShrink: 0, textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}
                value={m.time}
                onChange={e => updateMedicine(i, 'time', e.target.value)}
              />
              {medicines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMedicine(i)}
                  style={{ background: '#FFEBEE', border: 'none', borderRadius: 8, padding: '10px', cursor: 'pointer', color: '#E53935', flexShrink: 0 }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button" onClick={addMedicine}
          style={{
            width: '100%', marginTop: 10, padding: '10px', borderRadius: 10,
            border: '2px dashed #B0BEC5', background: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 13, fontWeight: 700, color: '#666',
          }}
        >
          <Plus size={14} /> Add medicine
        </button>
      </div>

      {/* Mobility */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
          🦽 Mobility considerations
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {MOBILITY_OPTIONS.map(opt => (
            <button
              key={opt} type="button" onClick={() => toggleMobility(opt)}
              style={{
                padding: '8px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                border: `2px solid ${selectedMobility.includes(opt) ? '#F44336' : '#E0E0E0'}`,
                background: selectedMobility.includes(opt) ? '#FFEBEE' : 'white',
                color: selectedMobility.includes(opt) ? '#C62828' : '#555', cursor: 'pointer',
              }}
            >
              {selectedMobility.includes(opt) ? '✓ ' : ''}{opt}
            </button>
          ))}
        </div>
        <input
          style={fieldStyle}
          value={mobilityNotes}
          onChange={e => setMobilityNotes(e.target.value)}
          placeholder="Any other mobility notes…"
        />
      </div>

      {/* Diet */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
          🥗 Dietary restrictions
        </label>
        <input
          style={fieldStyle}
          value={diet}
          onChange={e => setDiet(e.target.value)}
          placeholder="e.g. Diabetic diet, low sodium, vegetarian, no spicy food"
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={saving}
          style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: saving ? '#B0BEC5' : 'linear-gradient(135deg, #F44336 0%, #E91E63 100%)',
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
