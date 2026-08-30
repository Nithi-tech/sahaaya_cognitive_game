import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { OnboardingPeopleSection, OnboardingPerson } from '../../../types';
import { MultiClipRecorder } from '../../../components/Voice/MultiClipRecorder';

interface Props {
  saved: OnboardingPeopleSection | null;
  onSave: (data: OnboardingPeopleSection) => void;
  onSkip: () => void;
  saving: boolean;
}

const emptyPerson = (): OnboardingPerson => ({
  name: '', callsBy: '', relationship: '', photoUrl: undefined, greetingAudioUrl: undefined,
  askedForOften: false,
});

export default function Step1_People({ saved, onSave, onSkip, saving }: Props) {
  const [people, setPeople] = useState<OnboardingPerson[]>(
    saved?.people?.length ? saved.people : [emptyPerson()],
  );

  const update = <K extends keyof OnboardingPerson>(i: number, field: K, value: OnboardingPerson[K]) => {
    setPeople(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const addPerson = () => setPeople(prev => [...prev, emptyPerson()]);
  const removePerson = (i: number) => setPeople(prev => prev.filter((_, idx) => idx !== i));

  const handlePhoto = (i: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 512;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          update(i, 'photoUrl', canvas.toDataURL('image/jpeg', 0.85));
        } else {
          update(i, 'photoUrl', rawUrl);
        }
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = people.filter(p => p.name.trim());
    if (valid.length === 0) { onSkip(); return; }
    onSave({ people: valid });
  };

  const fieldStyle: React.CSSProperties = {
    padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0',
    fontSize: 14, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>👨‍👩‍👧</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>People & Relationships</h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 6 }}>
          Add family members and close people. Ask the elder aloud — <em>"Who do you call when you need help?"</em>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {people.map((p, i) => (
          <div key={i} style={{
            background: '#F8FAFB', borderRadius: 16, padding: 16,
            border: '1.5px solid #E8EEF2', position: 'relative',
          }}>
            {people.length > 1 && (
              <button
                type="button"
                onClick={() => removePerson(i)}
                style={{
                  position: 'absolute', top: 12, right: 12,
                  background: '#FFEBEE', border: 'none', borderRadius: 8,
                  padding: '4px 8px', cursor: 'pointer', color: '#E53935',
                }}
              >
                <Trash2 size={14} />
              </button>
            )}

            {/* Photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <label style={{ cursor: 'pointer', flexShrink: 0 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 14, overflow: 'hidden',
                  background: p.photoUrl ? 'transparent' : 'linear-gradient(135deg, #E91E63, #9C27B0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px dashed #B0BEC5', cursor: 'pointer',
                }}>
                  {p.photoUrl
                    ? <img src={p.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : <span style={{ fontSize: 24 }}>📷</span>
                  }
                </div>
                <input
                  type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => handlePhoto(i, e.target.files?.[0] ?? null)}
                />
              </label>
              <div style={{ flex: 1 }}>
                <input
                  style={fieldStyle}
                  placeholder="Person's name (e.g. Anjali)"
                  value={p.name}
                  onChange={e => update(i, 'name', e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>
                  The elder calls them:
                </label>
                <input
                  style={fieldStyle}
                  placeholder="e.g. Amma, Dada, Bhai"
                  value={p.callsBy}
                  onChange={e => update(i, 'callsBy', e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>
                  Relationship:
                </label>
                <input
                  style={fieldStyle}
                  placeholder="e.g. Daughter, Son, Niece"
                  value={p.relationship}
                  onChange={e => update(i, 'relationship', e.target.value)}
                />
              </div>
            </div>

            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
              fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={!!p.askedForOften}
                onChange={e => update(i, 'askedForOften', e.target.checked)}
              />
              The elder asks for or mentions them often
            </label>

            <div style={{ marginTop: 10 }}>
              <MultiClipRecorder
                personName={p.name}
                clips={p.audioClips ?? (p.greetingAudioUrl ? { greeting: p.greetingAudioUrl } : {})}
                aiVoiceEnabled={p.aiVoiceEnabled !== false}
                onToggleAiVoice={(enabled) => update(i, 'aiVoiceEnabled', enabled)}
                onChange={(clips) => {
                  update(i, 'audioClips', clips);
                  update(i, 'greetingAudioUrl', clips.greeting);
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addPerson}
        style={{
          width: '100%', marginTop: 12, padding: '12px', borderRadius: 12,
          border: '2px dashed #B0BEC5', background: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 14, fontWeight: 700, color: '#666',
        }}
      >
        <Plus size={16} /> Add another person
      </button>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: saving ? '#B0BEC5' : 'linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)',
            color: 'white', fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save & Continue →'}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={saving}
          style={{
            padding: '14px 20px', borderRadius: 12, border: '2px solid #E0E0E0',
            background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#888',
          }}
        >
          Skip
        </button>
      </div>
    </form>
  );
}
