import { useState } from 'react';
import { useApp } from '../../../store/AppContext';
import { CaregiverSidebar } from '../../../components/Sidebar/Sidebar';
import { Plus, Check, X } from 'lucide-react';
import type { ReminderType } from '../../../types';

const TYPE_CONFIG: Record<ReminderType, { emoji: string; color: string; label: string }> = {
  medicine: { emoji: '💊', color: '#E91E63', label: 'Medicine' },
  hydration: { emoji: '💧', color: '#2196F3', label: 'Hydration' },
  activity: { emoji: '🏃', color: '#4CAF50', label: 'Activity' },
  appointment: { emoji: '🏥', color: '#9C27B0', label: 'Appointment' },
};

export default function CaregiverReminders() {
  const { reminders, addReminder, updateReminderStatus } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'medicine' as ReminderType, title: '', description: '', time: '09:00' });

  const handleAdd = () => {
    if (!form.title) return;
    addReminder({
      type: form.type,
      title: form.title,
      description: form.description,
      time: form.time,
    });
    setForm({ type: 'medicine', title: '', description: '', time: '09:00' });
    setShowAdd(false);
  };

  const adherenceByType = (type: ReminderType) => {
    const list = reminders.filter(r => r.type === type);
    const completed = list.filter(r => r.status === 'completed');
    return list.length ? Math.round((completed.length / list.length) * 100) : 0;
  };

  return (
    <div className="dashboard-layout">
      <CaregiverSidebar />
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Reminders</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Manage Maya Devi's daily reminders</p>
          </div>
          <button className="btn btn--primary" onClick={() => setShowAdd(true)} style={{ gap: 6 }}>
            <Plus size={18} /> Add Reminder
          </button>
        </div>

        {/* Adherence Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {(Object.entries(TYPE_CONFIG) as [ReminderType, typeof TYPE_CONFIG[ReminderType]][]).map(([type, conf]) => {
            const pct = adherenceByType(type);
            return (
              <div key={type} className="card" style={{ borderRadius: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{conf.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{conf.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: conf.color, marginBottom: 4 }}>{pct}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>adherence</div>
                <div style={{ marginTop: 8 }}>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: `${pct}%`, background: conf.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="card" style={{ borderRadius: 20, marginBottom: 24, border: '2px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Add New Reminder</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-tertiary)" />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(Object.entries(TYPE_CONFIG) as [ReminderType, typeof TYPE_CONFIG[ReminderType]][]).map(([type, conf]) => (
                    <button
                      key={type}
                      onClick={() => setForm(f => ({ ...f, type }))}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: 12,
                        border: `2px solid ${form.type === type ? conf.color : 'var(--border-color)'}`,
                        background: form.type === type ? `${conf.color}15` : 'white',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                      }}
                    >
                      {conf.emoji} {conf.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Morning Medicine" />
              </div>
              <div className="form-group">
                <label className="form-label">Time</label>
                <input className="form-input" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Take 2 tablets with water" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn--primary" onClick={handleAdd} style={{ flex: 1, gap: 6 }}>
                <Check size={16} /> Save Reminder
              </button>
              <button className="btn btn--outline" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Reminder List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reminders.map((r) => {
            const conf = TYPE_CONFIG[r.type] ?? TYPE_CONFIG.medicine;
            return (
              <div key={r.id} className="card" style={{ borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
                <div style={{ fontSize: 28 }}>{conf.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{r.description}</div>
                  <div style={{ fontSize: 12, color: conf.color, fontWeight: 600, marginTop: 4 }}>🕐 {r.time}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${
                    r.status === 'completed' ? 'badge--success' :
                    r.status === 'skipped' ? 'badge--warning' :
                    r.status === 'delayed' ? 'badge--warning' : 'badge--info'
                  }`}>{r.status}</span>
                  {r.adherenceRate !== undefined && (
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      {r.adherenceRate}% adherence
                    </div>
                  )}
                </div>
                <button
                  onClick={() => updateReminderStatus(r.id, 'completed')}
                  disabled={r.status === 'completed'}
                  style={{
                    background: r.status === 'completed' ? 'var(--color-success-light)' : 'var(--color-primary)',
                    color: r.status === 'completed' ? 'var(--color-success)' : 'white',
                    border: 'none', borderRadius: 10, padding: '8px 14px',
                    cursor: r.status === 'completed' ? 'default' : 'pointer',
                    fontSize: 13, fontWeight: 700,
                  }}
                >
                  {r.status === 'completed' ? '✓' : 'Mark Done'}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
