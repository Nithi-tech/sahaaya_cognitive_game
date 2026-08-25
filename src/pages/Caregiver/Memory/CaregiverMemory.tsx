import { useState } from 'react';
import { useApp } from '../../../store/AppContext';
import { CaregiverSidebar } from '../../../components/Sidebar/Sidebar';
import { Plus, X, Check } from 'lucide-react';
import type { MemoryCategory } from '../../../types';

const CATEGORY_CONFIG: Record<MemoryCategory, { emoji: string; label: string; color: string }> = {
  family: { emoji: '👨‍👩‍👧', label: 'Family', color: '#E91E63' },
  places: { emoji: '🏠', label: 'Important Places', color: '#2196F3' },
  favorites: { emoji: '❤️', label: 'Favourite Things', color: '#FF9800' },
  routine: { emoji: '📅', label: 'Daily Routine', color: '#4CAF50' },
  dates: { emoji: '🗓️', label: 'Important Dates', color: '#9C27B0' },
};

export default function CaregiverMemory() {
  const { memories, addMemory, currentPatient } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MemoryCategory | 'all'>('all');
  const [form, setForm] = useState({
    category: 'family' as MemoryCategory,
    title: '',
    description: '',
    relationship: '',
    voiceText: '',
    notes: '',
  });

  const [titleError, setTitleError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const filtered = activeCategory === 'all' ? memories : memories.filter(m => m.category === activeCategory);

  const handleAdd = async () => {
    if (!form.title.trim()) {
      setTitleError(true);
      return;
    }
    setSaving(true);
    setSaveError(false);
    try {
      await addMemory({
        category: form.category,
        title: form.title,
        description: form.description,
        relationship: form.relationship,
        voiceText: form.voiceText || `${form.title} — ${form.description}`,
        notes: form.notes,
      });
      setForm({ category: 'family', title: '', description: '', relationship: '', voiceText: '', notes: '' });
      setTitleError(false);
      setShowAdd(false);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <CaregiverSidebar />
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Memory Manager</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Add memories to help {currentPatient?.name ?? 'your patient'} remember the people and things they love
            </p>
          </div>
          <button className="btn btn--primary" onClick={() => setShowAdd(true)} style={{ gap: 6 }}>
            <Plus size={18} /> Add Memory
          </button>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['all', ...Object.keys(CATEGORY_CONFIG)] as (MemoryCategory | 'all')[]).map((cat) => {
            const conf = cat !== 'all' ? CATEGORY_CONFIG[cat as MemoryCategory] : null;
            const count = cat === 'all' ? memories.length : memories.filter(m => m.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px', borderRadius: 99,
                  border: `2px solid ${activeCategory === cat ? (conf?.color ?? 'var(--color-primary)') : 'var(--border-color)'}`,
                  background: activeCategory === cat ? (conf ? `${conf.color}15` : 'rgba(46,125,139,0.08)') : 'white',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {conf ? conf.emoji : '📚'} {cat === 'all' ? 'All' : conf?.label} <span style={{ opacity: 0.6 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="card" style={{ borderRadius: 20, marginBottom: 24, border: '2px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Add New Memory</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-tertiary)" />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Category</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(Object.entries(CATEGORY_CONFIG) as [MemoryCategory, typeof CATEGORY_CONFIG[MemoryCategory]][]).map(([cat, conf]) => (
                    <button
                      key={cat}
                      onClick={() => setForm(f => ({ ...f, category: cat }))}
                      style={{
                        padding: '8px 12px', borderRadius: 10,
                        border: `2px solid ${form.category === cat ? conf.color : 'var(--border-color)'}`,
                        background: form.category === cat ? `${conf.color}15` : 'white',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      }}
                    >
                      {conf.emoji} {conf.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Name / Title *</label>
                <input
                  className="form-input"
                  value={form.title}
                  onChange={e => { setForm(f => ({ ...f, title: e.target.value })); if (titleError) setTitleError(false); }}
                  placeholder="e.g. Anjali"
                  style={titleError ? { borderColor: 'var(--color-danger)' } : undefined}
                />
                {titleError && <p style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>Please enter a name or title.</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Relationship</label>
                <input className="form-input" value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} placeholder="e.g. Daughter" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Your loving daughter" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Voice Text (what Sahaaya will say)</label>
                <textarea className="form-input form-textarea" value={form.voiceText} onChange={e => setForm(f => ({ ...f, voiceText: e.target.value }))} placeholder="e.g. Anjali is your daughter. She lives in Guwahati and visits every weekend." />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Caregiver Notes</label>
                <input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. She calls every evening at 7 PM" />
              </div>
            </div>
            {saveError && <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 10 }}>Couldn't save this memory. Please try again.</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn--primary" onClick={handleAdd} disabled={saving} style={{ flex: 1, gap: 6 }}>
                <Check size={16} /> {saving ? 'Saving…' : 'Save Memory'}
              </button>
              <button className="btn btn--outline" onClick={() => setShowAdd(false)} disabled={saving}>Cancel</button>
            </div>
          </div>
        )}

        {/* Memory Grid */}
        {filtered.length === 0 && (
          <div className="card" style={{ borderRadius: 20, textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
            {memories.length === 0 ? "No memories yet — add one to get started." : "No memories in this category yet."}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map((m) => {
            const conf = CATEGORY_CONFIG[m.category];
            return (
              <div key={m.id} className="card" style={{ borderRadius: 20, border: `1px solid ${conf.color}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `${conf.color}20`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 28, flexShrink: 0,
                  }}>
                    {conf.emoji}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{m.title}</div>
                    {m.relationship && (
                      <span style={{ fontSize: 12, background: `${conf.color}20`, color: conf.color, padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                        {m.relationship}
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                  {m.voiceText || m.description}
                </p>
                {m.notes && (
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: 8, marginTop: 8 }}>
                    📝 {m.notes}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
                  {conf.emoji} {conf.label} · Added {new Date(m.createdAt).toLocaleDateString('en-IN')}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
