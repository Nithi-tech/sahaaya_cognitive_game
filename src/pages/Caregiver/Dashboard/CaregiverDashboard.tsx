import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../store/AppContext';
import { useAuth } from '../../../store/AuthContext';
import { CaregiverSidebar } from '../../../components/Sidebar/Sidebar';
import { NetworkToggle } from '../../../components/OfflineIndicator/OfflineIndicator';
import { ScoreRing } from '../../../components/Charts/Charts';
import { Pill, Droplets, Route, Brain, Bell, ArrowRight, Plus, CheckCircle, Copy } from 'lucide-react';
import { getVoiceCloneStatus } from '../../../services/voice/voiceCloneService';
import { api } from '../../../api/client';

export default function CaregiverDashboard() {
  const { user } = useAuth();
  const {
    currentPatient,
    patients,
    selectPatient,
    refreshPatients,
    reminders,
    alerts,
    cognitiveProfile,
    sessions,
    dailyActivities,
    loading,
  } = useApp();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleToggleAiVoice = async (p: (typeof patients)[0]) => {
    const isCurrentlyEnabled = p.preferences?.aiVoiceEnabled !== false;
    const newAiVoiceVal = !isCurrentlyEnabled;
    try {
      await api.patch(`/patients/${p.id}`, {
        preferences: {
          aiVoiceEnabled: newAiVoiceVal,
        },
      });
      await refreshPatients();
    } catch (err) {
      console.error('Failed to toggle AI voice:', err);
    }
  };

  // Automatically ensure patient list is fresh whenever CaregiverDashboard mounts
  useEffect(() => {
    refreshPatients();
  }, [refreshPatients]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

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
        </div>

        {/* Patients Section */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                Patients Under Your Care
              </h2>
              <span style={{
                background: 'rgba(46,125,139,0.12)', color: 'var(--color-primary)',
                fontSize: 12, fontWeight: 800, padding: '2px 10px', borderRadius: 99,
              }}>
                {patients.length} {patients.length === 1 ? 'elder' : 'elders'}
              </span>
            </div>
            {patients.length > 0 && (
              <button
                onClick={() => navigate('/onboarding?new=true')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'none', border: '1.5px solid var(--color-primary)',
                  color: 'var(--color-primary)', borderRadius: 10, padding: '6px 12px',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Plus size={15} /> Add Another Elder
              </button>
            )}
          </div>

          {patients.length === 0 && !loading ? (
            <div style={{
              background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
              border: '2px dashed #0284C7', borderRadius: 20,
              padding: '32px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>👤</div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0369A1', margin: '0 0 6px' }}>
                No Patient Added Yet
              </h3>
              <p style={{ color: '#475569', fontSize: 14, maxWidth: 460, margin: '0 auto 18px', lineHeight: 1.5 }}>
                Add your elder's profile to begin setting up their personalised routines, games, and unique login ID.
              </p>
              <button
                onClick={() => navigate('/onboarding?new=true')}
                className="btn btn--primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 22px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}
              >
                <Plus size={18} /> Add Your First Patient
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}>
              {patients.map((p) => {
                const isSelected = currentPatient?.id === p.id;
                return (
                  <div
                    key={p.id}
                    style={{
                      background: 'white',
                      borderRadius: 18,
                      border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      boxShadow: isSelected ? '0 8px 24px rgba(46,125,139,0.15)' : 'var(--shadow-sm)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Top Row: Avatar, Name, Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 50,
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, #1565C0 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: 18, flexShrink: 0,
                      }}>
                        {p.name[0] ?? '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 16, color: '#1E293B' }}>
                            {p.name}
                          </span>
                          {isSelected && (
                            <span style={{
                              background: '#E0F2FE', color: '#0369A1',
                              padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                            }}>
                              Currently Monitoring
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          Age {p.age} · {p.region} · {p.language === 'as' ? 'অসমীয়া' : 'English'}
                        </div>
                      </div>
                    </div>

                    {/* Access ID Bar */}
                    <div style={{
                      background: '#F8FAFC', border: '1px solid #E2E8F0',
                      borderRadius: 12, padding: '10px 14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                          🔑 Elder Access ID:
                        </span>
                        <span style={{
                          fontFamily: 'monospace', fontWeight: 900, fontSize: 14,
                          color: '#0F172A', letterSpacing: 1,
                        }}>
                          {p.elderAccessId || 'Pending'}
                        </span>
                      </div>
                      {p.elderAccessId && (
                        <button
                          type="button"
                          onClick={() => handleCopyId(p.elderAccessId!)}
                          title="Copy Elder ID"
                          style={{
                            background: copiedId === p.elderAccessId ? '#DCFCE7' : 'white',
                            border: `1px solid ${copiedId === p.elderAccessId ? '#86EFAC' : '#CBD5E1'}`,
                            color: copiedId === p.elderAccessId ? '#15803D' : '#475569',
                            borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          <Copy size={12} /> {copiedId === p.elderAccessId ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>

                    {/* AI Voice Cloning Status & Toggle */}
                    {(() => {
                      const voiceStatus = getVoiceCloneStatus(p);
                      return (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0',
                          fontSize: 12,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: voiceStatus.badgeColor, flexShrink: 0 }} />
                            <span style={{ fontWeight: 700, color: '#334155' }}>
                              {voiceStatus.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleAiVoice(p)}
                            style={{
                              background: 'none', border: 'none', color: 'var(--color-primary)',
                              fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline',
                            }}
                          >
                            {p.preferences?.aiVoiceEnabled !== false ? 'Turn Off' : 'Turn On'}
                          </button>
                        </div>
                      );
                    })()}

                    {/* Personalisation status & action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, gap: 8, flexWrap: 'wrap' }}>
                      <div>
                        {p.onboardingComplete ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#F0FDF4', color: '#16A34A',
                            padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          }}>
                            <CheckCircle size={13} /> Setup Complete
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#FEF3C7', color: '#D97706',
                            padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          }}>
                            ⚠️ Personalisation Incomplete
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {!p.onboardingComplete && (
                          <button
                            onClick={() => {
                              selectPatient(p.id);
                              navigate('/onboarding?continue=true');
                            }}
                            style={{
                              padding: '6px 12px', borderRadius: 8, border: '1px solid #D97706',
                              background: '#FFFBEB', color: '#B45309', fontSize: 12, fontWeight: 700,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            Setup <ArrowRight size={12} />
                          </button>
                        )}
                        {!isSelected ? (
                          <button
                            onClick={() => selectPatient(p.id)}
                            style={{
                              padding: '6px 14px', borderRadius: 8, border: 'none',
                              background: 'var(--color-primary)', color: 'white',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            Switch to {p.name.split(' ')[0]}
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', padding: '6px 0' }}>
                            ✓ Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
