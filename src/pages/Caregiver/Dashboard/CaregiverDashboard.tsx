import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../store/AppContext';
import { useAuth } from '../../../store/AuthContext';
import { CaregiverSidebar } from '../../../components/Sidebar/Sidebar';
import { NetworkToggle } from '../../../components/OfflineIndicator/OfflineIndicator';
import { DomainBar, ScoreRing } from '../../../components/Charts/Charts';
import { Pill, Droplets, Route, Brain, Bell, ArrowRight } from 'lucide-react';

export default function CaregiverDashboard() {
  const { user } = useAuth();
  const { currentPatient, reminders, alerts, cognitiveProfile, sessions, dailyActivities, loading } = useApp();
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
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>{greeting},</p>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>{user?.name}</h1>
            </div>
            <div style={{ maxWidth: 280 }}>
              <NetworkToggle />
            </div>
          </div>

          {/* Patient Pill */}
          <div style={{
            marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 12,
            background: 'white', border: '1px solid var(--border-color)',
            borderRadius: 99, padding: '8px 16px', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 50, background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 15 }}>
              {currentPatient?.name[0] ?? '?'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {currentPatient?.name ?? (loading ? 'Loading…' : 'No patient assigned yet')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {currentPatient ? <>Age {currentPatient.age} · {currentPatient.region} · Last active: Today</> : 'Ask an admin to assign a patient to your account.'}
              </div>
            </div>
            {currentPatient && (
              <span style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>Active</span>
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

        {/* Cognitive Profile + Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          {/* Cognitive Profile */}
          <div className="card" style={{ borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Cognitive Engagement Profile</h3>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Activity performance · Not a medical assessment</p>
              </div>
              <button onClick={() => navigate('/activity')} className="btn btn--outline btn--sm">View Details</button>
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
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

            <DomainBar domain="memory" score={cognitiveProfile.memoryScore} color="#E91E63" label="Memory" />
            <DomainBar domain="attention" score={cognitiveProfile.attentionScore} color="#2196F3" label="Attention" />
            <DomainBar domain="recognition" score={cognitiveProfile.recognitionScore} color="#FF9800" label="Recognition" />
            <DomainBar domain="pattern" score={cognitiveProfile.patternScore} color="#9C27B0" label="Pattern" />
            <DomainBar domain="routine" score={cognitiveProfile.routineScore} color="#4CAF50" label="Routine" />

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
