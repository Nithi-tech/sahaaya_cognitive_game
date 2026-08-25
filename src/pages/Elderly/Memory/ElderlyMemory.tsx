import { useState } from 'react';
import { useApp } from '../../../store/AppContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { MemoryCategory } from '../../../types';

const CATEGORY_CONFIG: Record<MemoryCategory, { emoji: string; label: string; labelAs: string; color: string }> = {
  family: { emoji: '👨‍👩‍👧', label: 'Family', labelAs: 'পৰিয়াল', color: '#E91E63' },
  places: { emoji: '🏠', label: 'Important Places', labelAs: 'গুৰুত্বপূৰ্ণ ঠাই', color: '#2196F3' },
  favorites: { emoji: '❤️', label: 'Favourite Things', labelAs: 'প্ৰিয় বস্তু', color: '#FF9800' },
  routine: { emoji: '📅', label: 'Daily Routine', labelAs: 'দৈনন্দিন নিয়মিততা', color: '#4CAF50' },
  dates: { emoji: '🗓️', label: 'Important Dates', labelAs: 'গুৰুত্বপূৰ্ণ তাৰিখ', color: '#9C27B0' },
};

export default function ElderlyMemory() {
  const { memories } = useApp();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<MemoryCategory | null>(null);
  const [activeMemory, setActiveMemory] = useState<typeof memories[0] | null>(null);

  const filteredMemories = activeCategory
    ? memories.filter(m => m.category === activeCategory)
    : [];

  if (activeMemory) {
    const conf = CATEGORY_CONFIG[activeMemory.category];
    return (
      <div className="elderly-layout" style={{ paddingBottom: 90, padding: '20px' }}>
        <button onClick={() => setActiveMemory(null)} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 99, padding: '10px 14px', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 100, height: 100, borderRadius: 50,
            background: `${conf.color}22`,
            border: `4px solid ${conf.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 52, margin: '0 auto 16px',
          }}>
            {conf.emoji}
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>{activeMemory.title}</h2>
          {activeMemory.relationship && (
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 4 }}>
              {activeMemory.relationship}
            </p>
          )}
        </div>

        <div className="card" style={{ borderRadius: 20, marginBottom: 16, background: `${conf.color}08`, border: `1px solid ${conf.color}30` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: conf.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            🧠 Sahaaya remembers
          </div>
          <p style={{ fontSize: 19, lineHeight: 1.6, fontWeight: 500 }}>
            {activeMemory.voiceText || activeMemory.description}
          </p>
        </div>

        {activeMemory.notes && (
          <div className="card" style={{ borderRadius: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              📝 Notes
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.5 }}>{activeMemory.notes}</p>
          </div>
        )}
        <ElderlyNav />
      </div>
    );
  }

  if (activeCategory) {
    const conf = CATEGORY_CONFIG[activeCategory];
    return (
      <div className="elderly-layout" style={{ paddingBottom: 90 }}>
        <div style={{
          background: `linear-gradient(135deg, ${conf.color} 0%, ${conf.color}CC 100%)`,
          padding: '20px 20px 32px', color: 'white',
        }}>
          <button onClick={() => setActiveCategory(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 99, padding: '8px 12px', color: 'white', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ fontSize: 36 }}>{conf.emoji}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>
            {lang === 'as' ? conf.labelAs : conf.label}
          </h1>
        </div>
        <div style={{ padding: '20px', marginTop: -16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredMemories.length === 0 ? (
            <div className="card" style={{ borderRadius: 20, textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 16 }}>
                {lang === 'as' ? t('memory.empty') : "Your caregiver hasn't added any memories yet."}
              </p>
            </div>
          ) : (
            filteredMemories.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMemory(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: 'white', border: '2px solid var(--border-color)', borderRadius: 20,
                  padding: '20px', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{
                  width: 60, height: 60, borderRadius: 16,
                  background: `${conf.color}20`, border: `2px solid ${conf.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, flexShrink: 0,
                }}>
                  {conf.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{m.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {m.relationship || m.description.slice(0, 40)}
                  </div>
                </div>
                <ChevronRight size={20} color="var(--text-tertiary)" />
              </button>
            ))
          )}
        </div>
        <ElderlyNav />
      </div>
    );
  }

  return (
    <div className="elderly-layout" style={{ paddingBottom: 90 }}>
      <div style={{
        background: 'linear-gradient(135deg, #FF6B9D 0%, #E91E63 100%)',
        padding: '20px 20px 32px', color: 'white',
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 99, padding: '8px 12px', color: 'white', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          {lang === 'as' ? t('memory.title') : 'My Memories'}
        </h1>
        <p style={{ opacity: 0.85, fontSize: 15, marginTop: 4 }}>
          People, places and things you love
        </p>
      </div>

      <div style={{ padding: '20px', marginTop: -16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {(Object.entries(CATEGORY_CONFIG) as [MemoryCategory, typeof CATEGORY_CONFIG[MemoryCategory]][]).map(([cat, conf]) => {
          const count = memories.filter(m => m.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: `${conf.color}12`,
                border: `2px solid ${conf.color}30`,
                borderRadius: 20, padding: '24px 16px',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              }}
            >
              <span style={{ fontSize: 40 }}>{conf.emoji}</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                {lang === 'as' ? conf.labelAs : conf.label}
              </div>
              <div style={{
                background: conf.color, color: 'white',
                borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700,
              }}>
                {count} {count === 1 ? 'item' : 'items'}
              </div>
            </button>
          );
        })}
      </div>
      <ElderlyNav />
    </div>
  );
}
