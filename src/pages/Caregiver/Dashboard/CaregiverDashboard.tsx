import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../store/AppContext';
import { useAuth } from '../../../store/AuthContext';
import { CaregiverSidebar } from '../../../components/Sidebar/Sidebar';
import { NetworkToggle } from '../../../components/OfflineIndicator/OfflineIndicator';
import { ScoreRing } from '../../../components/Charts/Charts';
import { Pill, Droplets, Route, Brain, Bell, ArrowRight, Plus } from 'lucide-react';

export default function CaregiverDashboard() {
  const { user } = useAuth();
  const { currentPatient, patients, selectPatient, reminders, alerts, cognitiveProfile, sessions, dailyActivities, loading } = useApp();
  const navigate = useNavigate();

  const todaySessions = sessions.filter(
    s => s.timestamp.startsWith(new Date().toISOString().split('T')[0])
  );
  const medicineRem = reminders.filter(r => r.type === 'medicine');
  const hydrationRem = reminders.filter(r => r.type === 'hydration');
  const medicineCompleted = medicineRem.filter(r => r.status === 'completed');
  const hydrationCompleted = hydrationRem.filter(r => r.status === 'completed');
  const medicineAdherence = medicineRem.length ? Math.round((medicineCompleted.length / medicineRem.length) * 100) : 0;
  const hydrationAdherence = hydrationRem.length ? Math.round((hydrationCompleted.length / hydrationRem.length) * 100) : 0;
  const routineCompleted = dailyActivities.filter(a => a.status === 'completed');
  const routineAdherence = dailyActivities.length ? Math.round((routineCompleted.length / dailyActivities.length) * 100) : 0;
  const unresolvedAlerts = alerts.filter(a => !a.resolved);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="dashboard-layout">
      <CaregiverSidebar />
      <main className="dashboard-content">
        {/* Continue Setup Banner — shown when onboarding is incomplete */}
        {currentPatient && !currentPatient.onboardingComplete && (
          <div style={{
            background: 'linear-gradient(135deg, #E3F2FD 0%, #FFF8E1 100%)',
            border: '2px solid #90CAF9', borderRadius: 18,
            padding: '18px 22px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 32 }}>📋</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1565C0' }}>
                Complete {currentPatient.name}'s personalisation setup
              </div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
                Some onboarding sections haven't been saved yet. Fill them in to unlock personalised games and reminders.
              </div>
            </div>
            <button
              onClick={() => navigate('/onboarding?continue=true')}
              style={{
                padding: '10px 20px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #1565C0, #2E7D8B)',
                color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              }}
            >
              Continue Setup <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>{greeting},</p>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>{user?.name}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/onboarding?new=true')}
                className="btn btn--primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  borderRadius: 12, height: 42, padding: '0 16px', fontSize: 14, fontWeight: 700,
                }}
              >
                <Plus size={16} /> Add Patient
              </button>
              <div style={{ maxWidth: 280 }}>
                <NetworkToggle />
              </div>
            </div>
          </div>

          {/* Patient Bar */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {currentPatient ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                background: 'white', border: '1px solid var(--border-color)',
                borderRadius: 99, padding: '8px 16px', boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 50, background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 15 }}>
                  {currentPatient.name[0] ?? '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {currentPatient.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    Age {currentPatient.age} · {currentPatient.region} · Last active: Today
                  </div>
                </div>
                <span style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>Active</span>
              </div>
            ) : !loading ? (
              <div style={{
                width: '100%',
                background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                border: '2px dashed #0284C7', borderRadius: 20,
                padding: '28px 24px', textAlign: 'center', marginTop: 8,
              }}>
                <div style={{ fontSize: 36, marginBottom: 6 }}>👤</div>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0369A1', margin: '0 0 6px' }}>
                  No Patient Added Yet
                </h2>
                <p style={{ color: '#475569', fontSize: 14, maxWidth: 460, margin: '0 auto 16px', lineHeight: 1.5 }}>
                  Add your elder's profile to begin setting up their personalised routines, games, and reminders.
                </p>
                <button
                  onClick={() => navigate('/onboarding?new=true')}
                  className="btn btn--primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}
                >
                  <Plus size={18} /> Add New Patient
                </button>
              </div>
            ) : null}

            {/* Multiple Patients Switcher */}
            {patients.length > 1 && (
              <select
                value={currentPatient?.id ?? ''}
                onChange={(e) => selectPatient(e.target.value)}
                style={{
                  padding: '8px 14px', borderRadius: 12, border: '1.5px solid var(--border-color)',
                  background: 'white', fontSize: 13, fontWeight: 600, color: '#333', cursor: 'pointer',
                }}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    👤 {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Alert Banner */}
        {unresolvedAlerts.length > 0 && (
          <button
            onClick={() => navigate('/alerts')}
            style={{
              background: '#FFF3E0', border: '1px solid #FFB74D',
              borderRadius: 16, padding: '14px 18px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              width: '100%', textAlign: 'left', font: 'inherit',
            }}
          >
            <Bell size={20} color="var(--color-warning)" />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, color: '#E65100' }}>
                {unresolvedAlerts.length} alert{unresolvedAlerts.length > 1 ? 's' : ''} need attention
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13, marginLeft: 8 }}>
                {unresolvedAlerts[0].message}
              </span>
            </div>
            <ArrowRight size={16} color="var(--color-warning)" />
          </button>
        )}

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            {
              icon: <Brain size={22} />, label: "Today's Activity",
              value: todaySessions.length > 0 ? `${todaySessions.length} sessions` : 'Not started',
              sub: todaySessions.length > 0 ? '✓ Completed' : 'No activity yet today',
              color: todaySessions.length > 0 ? 'var(--color-success)' : 'var(--color-primary)',
              bg: todaySessions.length > 0 ? 'var(--color-success-light)' : 'rgba(46,125,139,0.06)',
            },
            {
              icon: <Pill size={22} />, label: 'Medicine',
              value: `${medicineCompleted.length}/${medicineRem.length}`,
              sub: `${medicineAdherence}% adherence`,
              color: 'var(--color-primary)',
              bg: 'rgba(46,125,139,0.06)',
            },
            {
              icon: <Droplets size={22} />, label: 'Hydration',
              value: `${hydrationCompleted.length}/${hydrationRem.length}`,
              sub: `${hydrationAdherence}% adherence`,
              color: 'var(--color-info)',
              bg: 'rgba(33,150,243,0.06)',
            },
            {
              icon: <Route size={22} />, label: 'Daily Routine',
              value: `${routineAdherence}%`,
              sub: `${routineCompleted.length} of ${dailyActivities.length} done`,
              color: 'var(--color-success)',
              bg: 'var(--color-success-light)',
            },
          ].map((card) => (
            <div key={card.label} className="card" style={{ borderRadius: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ background: card.bg, color: card.color, padding: 10, borderRadius: 12 }}>
                  {card.icon}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>{card.value}</div>
              <div style={{ fontSize: 13, color: card.color, fontWeight: 600 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Cognitive Profile + Quick Actions — stacks to one column below
            900px (see .dashboard-two-col in index.css) instead of squeezing
            a fixed 320px rail onto a phone-width screen. */}
        <div className="dashboard-two-col" style={{ gap: 20 }}>
          {/* Cognitive Profile */}
          <div className="card" style={{ borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Cognitive Engagement Profile</h3>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Activity performance · Not a medical assessment</p>
              </div>
              <button onClick={() => navigate('/activity')} className="btn btn--outline btn--sm">View Details</button>
            </div>

            {/* Compact at-a-glance view only — the same 5 scores as bars/trends
                live one tap away via "View Details" (/activity), so this card
                shouldn't repeat them in a second format. Wraps instead of
                overflowing on narrow screens. */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
              {[
                { label: 'Memory', score: cognitiveProfile.memoryScore, color: '#E91E63' },
                { label: 'Attention', score: cognitiveProfile.attentionScore, color: '#2196F3' },
                { label: 'Recognition', score: cognitiveProfile.recognitionScore, color: '#FF9800' },
                { label: 'Pattern', score: cognitiveProfile.patternScore, color: '#9C27B0' },
                { label: 'Routine', score: cognitiveProfile.routineScore, color: '#4CAF50' },
              ].map((d) => (
                <ScoreRing key={d.label} score={d.score} label={d.label} color={d.color} size={76} />
              ))}
            </div>

            <div style={{ marginTop: 16, padding: '10px 14px', background: '#FFF8F0', borderRadius: 10, border: '1px solid #FFD08A', fontSize: 12, color: 'var(--text-secondary)' }}>
              ⚠️ These scores reflect activity engagement patterns and are not a medical diagnosis.
            </div>
          </div>

          {/* Quick Actions + Recent Alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ borderRadius: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Quick Actions</h3>
              {[
                { label: 'View Analytics', to: '/activity', emoji: '📊' },
                { label: 'Manage Reminders', to: '/reminders', emoji: '🔔' },
                { label: 'Add Memory', to: '/memory', emoji: '❤️' },
                { label: 'View Alerts', to: '/alerts', emoji: `🔔 ${unresolvedAlerts.length > 0 ? `(${unresolvedAlerts.length})` : ''}` },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 12,
                    background: 'var(--bg-page)', border: '1px solid var(--border-color)',
                    cursor: 'pointer', marginBottom: 8, fontSize: 14, fontWeight: 600,
                    color: 'var(--text-primary)', transition: 'all 0.15s',
                  }}
                >
                  <span>{a.emoji}</span> {a.label}
                  <ArrowRight size={14} color="var(--text-tertiary)" style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </div>

            <div className="card" style={{ borderRadius: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Recent Alerts</h3>
              {unresolvedAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} style={{
                  padding: '10px 12px', borderRadius: 10, marginBottom: 8,
                  background: alert.severity === 'high' ? 'var(--color-danger-light)' :
                    alert.severity === 'medium' ? 'var(--color-warning-light)' : 'var(--color-success-light)',
                  border: `1px solid ${alert.severity === 'high' ? '#FFCDD2' : alert.severity === 'medium' ? '#FFE0B2' : '#C8E6C9'}`,
                  fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4,
                }}>
                  {alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🟢'} {alert.message}
                </div>
              ))}
              <button onClick={() => navigate('/alerts')} className="btn btn--outline btn--sm" style={{ width: '100%' }}>
                View All Alerts
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
