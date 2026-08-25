import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HCWSidebar } from '../../../components/Sidebar/Sidebar';
import { useAuth } from '../../../store/AuthContext';
import { api } from '../../../api/client';
import type { PatientProfile, CognitiveProfile, Alert } from '../../../types';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Row {
  patient: PatientProfile;
  profile: CognitiveProfile | null;
  activeAlerts: number;
  activeRecently: boolean;
}

export default function HCWPatients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(false);
      try {
        const { patients } = await api.get<{ patients: PatientProfile[] }>('/patients');
        const withData = await Promise.all(
          patients.map(async (patient) => {
            const [profileRes, alertsRes, recentSessionsRes] = await Promise.all([
              api.get<{ profile: CognitiveProfile }>(`/sessions/${patient.id}/profile`).catch(() => null),
              api.get<{ alerts: Alert[] }>(`/alerts/${patient.id}`).catch(() => ({ alerts: [] })),
              api.get<{ sessions: unknown[] }>(`/sessions/${patient.id}?days=7`).catch(() => ({ sessions: [] })),
            ]);
            return {
              patient,
              profile: profileRes?.profile ?? null,
              activeAlerts: alertsRes.alerts.filter((a) => !a.resolved).length,
              activeRecently: recentSessionsRes.sessions.length > 0,
            };
          }),
        );
        if (!cancelled) setRows(withData);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const profiles = rows ?? [];
  const avgEngagement = profiles.length
    ? Math.round(profiles.reduce((a, p) => a + (p.profile?.overallEngagement ?? 0), 0) / profiles.length)
    : 0;
  const needsAttention = profiles.filter((p) => (p.profile?.overallEngagement ?? 0) < 70).length;
  const activeCount = profiles.filter((p) => p.activeRecently).length;

  const TrendIcon = ({ score }: { score: number }) => {
    if (score >= 75) return <TrendingUp size={14} color="var(--color-success)" />;
    if (score >= 60) return <Minus size={14} color="var(--color-warning)" />;
    return <TrendingDown size={14} color="var(--color-danger)" />;
  };

  return (
    <div className="dashboard-layout">
      <HCWSidebar />
      <main className="dashboard-content">
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Welcome,</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{user?.name}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Patient activity overview · Not a clinical report
          </p>
        </div>

        {/* Summary KPIs */}
        <div className="stat-grid" style={{ marginBottom: 28 }}>
          {[
            { label: 'Total Patients', value: profiles.length, color: 'var(--color-primary)', emoji: '👥' },
            { label: 'Active This Week', value: activeCount, color: 'var(--color-success)', emoji: '✅' },
            { label: 'Needs Attention', value: needsAttention, color: 'var(--color-warning)', emoji: '⚠️' },
            { label: 'Avg. Engagement', value: `${avgEngagement}%`, color: 'var(--color-info)', emoji: '📊' },
          ].map(k => (
            <div key={k.label} className="card" style={{ borderRadius: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{k.emoji}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          background: '#FFF8F0', border: '1px solid #FFD08A', borderRadius: 12,
          padding: '12px 16px', marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)',
        }}>
          ⚠️ All data reflects activity engagement only. This platform does not diagnose, predict, or assess medical conditions including dementia or Alzheimer's disease.
        </div>

        {/* Patient Table */}
        <div className="card" style={{ borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Assigned Patients</h3>
          </div>
          {rows === null && !loadError ? (
            <div style={{ padding: 24, color: 'var(--text-tertiary)' }}>Loading patients…</div>
          ) : loadError ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ color: 'var(--color-danger)', marginBottom: 12 }}>Couldn't load your patients. Please check your connection.</p>
              <button className="btn btn--outline btn--sm" onClick={() => window.location.reload()}>Try Again</button>
            </div>
          ) : profiles.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No patients are assigned to you yet.
            </div>
          ) : (
          <div className="data-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Age</th>
                <th>Last Activity</th>
                <th>Engagement</th>
                <th>Memory</th>
                <th>Attention</th>
                <th>Pattern</th>
                <th>Alerts</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(({ patient, profile, activeAlerts }) => {
                const engagement = profile?.overallEngagement ?? 0;
                const goToPatient = () => navigate(`/patient/${patient.id}`);
                return (
                  <tr
                    key={patient.id}
                    onClick={goToPatient}
                    tabIndex={0}
                    role="link"
                    aria-label={`View details for ${patient.name}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        goToPatient();
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 50,
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
                        }}>
                          {patient.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{patient.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{patient.region}</div>
                        </div>
                      </div>
                    </td>
                    <td>{patient.age}</td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Today</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendIcon score={engagement} />
                        <span style={{
                          fontWeight: 700,
                          color: engagement >= 75 ? 'var(--color-success)' :
                            engagement >= 60 ? 'var(--color-warning)' : 'var(--color-danger)',
                        }}>
                          {engagement}%
                        </span>
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 600 }}>{profile?.memoryScore ?? '—'}</span></td>
                    <td><span style={{ fontWeight: 600 }}>{profile?.attentionScore ?? '—'}</span></td>
                    <td><span style={{ fontWeight: 600 }}>{profile?.patternScore ?? '—'}</span></td>
                    <td>
                      {activeAlerts > 0 ? (
                        <span className="badge badge--warning">{activeAlerts} active</span>
                      ) : (
                        <span className="badge badge--neutral">None</span>
                      )}
                    </td>
                    <td>
                      <ArrowRight size={16} color="var(--text-tertiary)" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
