import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HCWSidebar } from '../../../components/Sidebar/Sidebar';
import { useAuth } from '../../../store/AuthContext';
import { usePatientRoster } from '../../../hooks/usePatientRoster';
import { StatCard } from '../../../components/HealthcareDashboard/StatCard';
import { TrendIndicator } from '../../../components/HealthcareDashboard/TrendIndicator';
import { ErrorState, EmptyState, SkeletonRow } from '../../../components/HealthcareDashboard/States';
import { average, trendDirection } from '../../../utils/analytics';
import { api } from '../../../api/client';
import type { PatientProfile } from '../../../types';
import { ArrowRight, Users, CheckCircle2, AlertTriangle, BarChart3, Search, UserPlus, X } from 'lucide-react';

export default function HCWPatients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state, rows, reload } = usePatientRoster();
  const [query, setQuery] = useState('');
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState(false);
  const [linking, setLinking] = useState(false);
  const [accessId, setAccessId] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  const handleLinkPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessId.trim()) return;
    setLinkSubmitting(true);
    setLinkError(null);
    try {
      await api.post<{ patient: PatientProfile }>('/patients/link', { accessId: accessId.trim() });
      setAccessId('');
      setLinking(false);
      reload();
    } catch (err) {
      setLinkError((err as Error).message);
    } finally {
      setLinkSubmitting(false);
    }
  };

  const enriched = useMemo(
    () =>
      rows.map((row) => {
        const accuracies = row.recentSessions.map((s) => s.accuracy);
        const trend = trendDirection(accuracies, { minSamples: 3 });
        const activeAlerts = row.alerts.filter((a) => !a.resolved).length;
        const lastSessionAt = row.recentSessions.length
          ? row.recentSessions.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0].timestamp
          : null;
        return { ...row, trend, activeAlerts, lastSessionAt };
      }),
    [rows],
  );

  const avgEngagement = useMemo(() => {
    const values = enriched.map((r) => r.profile?.overallEngagement).filter((v): v is number => v !== undefined && v !== null);
    return average(values);
  }, [enriched]);

  const needsAttention = enriched.filter((r) => r.activeAlerts > 0 || (r.profile?.overallEngagement ?? 100) < 60);
  const activeThisWeek = enriched.filter((r) => r.lastSessionAt !== null);

  const filtered = enriched.filter((r) => {
    if (needsAttentionOnly && !needsAttention.includes(r)) return false;
    if (query.trim() && !r.patient.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="dashboard-layout">
      <HCWSidebar />
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Welcome,</p>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{user?.name}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Patient activity overview · Not a clinical report</p>
          </div>
          <button className="btn btn--primary btn--sm" onClick={() => setLinking((v) => !v)} style={{ gap: 6 }}>
            {linking ? <X size={15} /> : <UserPlus size={15} />}
            {linking ? 'Cancel' : 'Add Patient'}
          </button>
        </div>

        {linking && (
          <form
            onSubmit={handleLinkPatient}
            className="card"
            style={{ borderRadius: 16, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}
          >
            <div style={{ flex: '1 1 220px' }}>
              <label htmlFor="hcw-link-access-id" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                Patient's Access ID
              </label>
              <input
                id="hcw-link-access-id"
                value={accessId}
                onChange={(e) => setAccessId(e.target.value)}
                placeholder="e.g. SAH-4821"
                autoFocus
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: 14 }}
              />
              <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 6 }}>
                Ask the patient's caregiver for this ID — it's the same code used for Elder Login, shown on their onboarding screen.
              </p>
            </div>
            <button type="submit" className="btn btn--primary" disabled={linkSubmitting || !accessId.trim()} style={{ height: 42 }}>
              {linkSubmitting ? 'Linking…' : 'Link Patient'}
            </button>
            {linkError && <p className="landing-error" style={{ width: '100%', margin: 0 }}>{linkError}</p>}
          </form>
        )}

        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <StatCard label="Total Patients" value={String(enriched.length)} icon={<Users size={20} />} color="var(--color-primary)" bg="rgba(46,125,139,0.08)" />
          <StatCard label="Active This Week" value={String(activeThisWeek.length)} icon={<CheckCircle2 size={20} />} color="var(--color-success)" bg="var(--color-success-light)" />
          <StatCard label="Needs Attention" value={String(needsAttention.length)} icon={<AlertTriangle size={20} />} color="var(--color-warning)" bg="var(--color-warning-light)" />
          <StatCard label="Avg. Engagement" value={avgEngagement !== null ? `${Math.round(avgEngagement)}%` : '—'} icon={<BarChart3 size={20} />} color="var(--color-info)" bg="var(--color-info-light)" />
        </div>

        <div
          style={{
            background: '#FFF8F0',
            border: '1px solid #FFD08A',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          All data reflects activity engagement only. This platform does not diagnose, predict, or assess medical conditions including dementia or Alzheimer's disease.
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients by name…"
              aria-label="Search patients by name"
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: 14 }}
            />
          </div>
          <button
            className={`btn btn--sm ${needsAttentionOnly ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => setNeedsAttentionOnly((v) => !v)}
          >
            Needs Attention Only
          </button>
          {(query || needsAttentionOnly) && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setQuery('');
                setNeedsAttentionOnly(false);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="card" style={{ borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Assigned Patients</h3>
          </div>
          {state === 'loading' && (
            <div style={{ padding: 20 }}>
              <SkeletonRow count={3} height={56} />
            </div>
          )}
          {state === 'error' && <ErrorState message="Couldn't load your patients. Please check your connection." onRetry={reload} />}
          {state === 'success' && rows.length === 0 && <EmptyState title="No patients assigned to you yet" />}
          {state === 'success' && rows.length > 0 && filtered.length === 0 && (
            <EmptyState title="No patients match your filters" description="Try clearing the search or the needs-attention filter." />
          )}
          {state === 'success' && filtered.length > 0 && (
            <div className="data-table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Age</th>
                    <th>Last Activity</th>
                    <th>Engagement</th>
                    <th>Recent Trend</th>
                    <th>Alerts</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const engagement = row.profile?.overallEngagement ?? 0;
                    const goToPatient = () => navigate(`/patient/${row.patient.id}`);
                    return (
                      <tr
                        key={row.patient.id}
                        onClick={goToPatient}
                        tabIndex={0}
                        role="link"
                        aria-label={`View details for ${row.patient.name}`}
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
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 50,
                                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: 14,
                                flexShrink: 0,
                              }}
                            >
                              {row.patient.name[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{row.patient.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{row.patient.region}</div>
                            </div>
                          </div>
                        </td>
                        <td>{row.patient.age}</td>
                        <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                          {row.lastSessionAt ? new Date(row.lastSessionAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No activity'}
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              color: engagement >= 75 ? 'var(--color-success)' : engagement >= 60 ? 'var(--color-warning)' : 'var(--color-danger)',
                            }}
                          >
                            {engagement}%
                          </span>
                        </td>
                        <td>
                          <TrendIndicator direction={row.trend} size={12} />
                        </td>
                        <td>
                          {row.activeAlerts > 0 ? (
                            <span className="badge badge--warning">{row.activeAlerts} active</span>
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
