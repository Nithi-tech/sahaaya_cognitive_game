import { useEffect, useRef, useState } from 'react';
import { HCWSidebar } from '../../../components/Sidebar/Sidebar';
import { TrendChart } from '../../../components/Charts/Charts';
import { DateRangeControl } from '../../../components/HealthcareDashboard/DateRangeControl';
import { ErrorState, EmptyState, SkeletonRow } from '../../../components/HealthcareDashboard/States';
import { usePatientDashboardData } from '../../../hooks/usePatientDashboardData';
import { api } from '../../../api/client';
import { buildTrendData } from '../../../utils/trends';
import { average, computeDomainAggregate } from '../../../utils/analytics';
import { computeEngagementSummary } from '../../../utils/engagement';
import { buildGameStats, findFavoriteGame } from '../../../utils/gameAnalytics';
import { daysBetween, presetToDays, type RangePreset } from '../../../utils/dateRange';
import { exportToCsv } from '../../../utils/csvExport';
import type { CognitiveDomain, PatientProfile } from '../../../types';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

const DOMAINS: CognitiveDomain[] = ['memory', 'attention', 'recognition', 'pattern', 'routine'];
const DOMAIN_COLORS: Record<CognitiveDomain, string> = {
  memory: '#E91E63',
  attention: '#2196F3',
  recognition: '#FF9800',
  pattern: '#9C27B0',
  routine: '#4CAF50',
};
const DOMAIN_LABELS: Record<CognitiveDomain, string> = {
  memory: 'Memory',
  attention: 'Attention',
  recognition: 'Recognition',
  pattern: 'Pattern',
  routine: 'Routine',
};

function todayIso() {
  return new Date().toISOString().split('T')[0];
}
function daysAgoIso(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export default function HCWReports() {
  const [patients, setPatients] = useState<PatientProfile[] | null>(null);
  const [patientsError, setPatientsError] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [rangePreset, setRangePreset] = useState<RangePreset>('30d');
  const [customFrom, setCustomFrom] = useState(daysAgoIso(30));
  const [customTo, setCustomTo] = useState(todayIso());
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { patients: list } = await api.get<{ patients: PatientProfile[] }>('/patients');
        if (cancelled) return;
        setPatients(list);
        if (list.length > 0) setSelectedPatientId(list[0].id);
      } catch {
        if (!cancelled) setPatientsError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const days = rangePreset === 'custom' ? daysBetween(customFrom, customTo) : presetToDays(rangePreset);
  const { state, data, error, reload } = usePatientDashboardData(selectedPatientId || undefined, days);

  const handleExportPdf = async () => {
    if (!reportRef.current || exporting) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
      pdf.save(`sahaaya-report-${data?.patient.name.replace(/\s+/g, '-').toLowerCase() ?? 'patient'}.pdf`);
    } catch {
      window.print();
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = () => {
    if (!data) return;
    exportToCsv(
      `sahaaya-sessions-${data.patient.name.replace(/\s+/g, '-').toLowerCase()}.csv`,
      data.sessions.map((s) => ({
        date: s.timestamp,
        game: s.gameType,
        domain: s.domain,
        difficulty: s.difficulty,
        score: s.score,
        accuracy: s.accuracy,
        responseTime: s.responseTime,
        mistakes: s.mistakes,
        completed: s.completed,
      })),
    );
  };

  if (patientsError) {
    return (
      <div className="dashboard-layout">
        <HCWSidebar />
        <main className="dashboard-content">
          <ErrorState message="Couldn't load your patients. Please check your connection." onRetry={() => window.location.reload()} />
        </main>
      </div>
    );
  }

  if (patients === null) {
    return (
      <div className="dashboard-layout">
        <HCWSidebar />
        <main className="dashboard-content">
          <SkeletonRow count={3} height={100} />
        </main>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="dashboard-layout">
        <HCWSidebar />
        <main className="dashboard-content">
          <EmptyState title="No patients assigned to you yet" description="There's nothing to report on until a patient is assigned." />
        </main>
      </div>
    );
  }

  const trendData = data ? buildTrendData(data.sessions, days, data.profile?.overallEngagement ?? 70) : [];
  const domainAggregates = data ? DOMAINS.map((d) => computeDomainAggregate(data.sessions, d)) : [];
  const engagement = data ? computeEngagementSummary(data.sessions, days) : null;
  const gameStats = data ? buildGameStats(data.sessions) : [];
  const favoriteGame = findFavoriteGame(gameStats);
  const medicineReminders = data?.reminders.filter((r) => r.type === 'medicine') ?? [];
  const medicineCompleted = medicineReminders.filter((r) => r.status === 'completed');
  const medicineAdherence = medicineReminders.length ? Math.round((medicineCompleted.length / medicineReminders.length) * 100) : null;
  const avgOverall = trendData.length ? Math.round(average(trendData.map((d) => d.overall)) ?? 0) : null;

  return (
    <div className="dashboard-layout">
      <HCWSidebar />
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Reports &amp; Trends</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Longitudinal activity engagement analytics</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--outline" onClick={handleExportCsv} disabled={!data || data.sessions.length === 0} style={{ gap: 6 }}>
              <FileSpreadsheet size={16} /> CSV
            </button>
            <button className="btn btn--primary" onClick={handleExportPdf} disabled={exporting || !data} style={{ gap: 6 }}>
              <Download size={16} /> {exporting ? 'Exporting…' : 'Export PDF'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            aria-label="Select patient"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: 14, minWidth: 200 }}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <DateRangeControl
            preset={rangePreset}
            customFrom={customFrom}
            customTo={customTo}
            onPresetChange={setRangePreset}
            onCustomChange={(from, to) => {
              setCustomFrom(from);
              setCustomTo(to);
            }}
          />
        </div>

        {state === 'loading' && <SkeletonRow count={3} height={100} />}
        {state === 'error' && <ErrorState message={error ?? "Couldn't load this report."} onRetry={reload} />}

        {state === 'success' && data && engagement && (
          <div ref={reportRef}>
            <div
              style={{
                background: '#FFF8F0',
                border: '1px solid #FFD08A',
                borderRadius: 12,
                padding: '10px 14px',
                marginBottom: 20,
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}
            >
              This report summarizes application activity and engagement. It is not a medical diagnosis, and does not assess dementia or Alzheimer's disease.
            </div>

            <div className="card report-card" style={{ borderRadius: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                <FileText size={20} color="var(--color-primary)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {days}-Day Engagement Report — {data.patient.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {trendData[0]?.date} to {trendData[trendData.length - 1]?.date}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total Sessions', value: data.sessions.length, color: 'var(--color-primary)' },
                  { label: 'Avg. Engagement', value: avgOverall !== null ? `${avgOverall}%` : '—', color: 'var(--color-success)' },
                  {
                    label: 'Medication Adherence',
                    value: medicineAdherence !== null ? `${medicineAdherence}%` : 'N/A',
                    color: '#E91E63',
                  },
                  {
                    label: 'Active Days',
                    value: `${engagement.activeDaysInRange}/${engagement.possibleDaysInRange}`,
                    color: 'var(--color-info)',
                  },
                  {
                    label: 'Consistency',
                    value: engagement.consistencyPercent !== null ? `${Math.round(engagement.consistencyPercent)}%` : '—',
                    color: 'var(--color-accent)',
                  },
                ].map((k) => (
                  <div key={k.label} style={{ background: 'var(--bg-page)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginTop: 4 }}>{k.label}</div>
                  </div>
                ))}
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Key Observations</h4>
                {domainAggregates
                  .filter((a) => a.count > 0 && a.trend !== 'insufficient_data' && a.trend !== 'stable')
                  .map((a) => (
                    <div
                      key={a.domain}
                      style={{
                        display: 'flex',
                        gap: 10,
                        padding: '10px 14px',
                        borderRadius: 10,
                        marginBottom: 8,
                        background: 'var(--bg-page)',
                        border: '1px solid var(--border-color)',
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ flexShrink: 0 }}>{a.trend === 'improving' ? '📈' : '📉'}</span>
                      {DOMAIN_LABELS[a.domain]} {a.trend === 'improving' ? 'improved' : 'decreased'} by{' '}
                      {a.changeAbsolute !== null ? Math.abs(Math.round(a.changeAbsolute)) : 0} points over the tracked sessions.
                    </div>
                  ))}
                {favoriteGame && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 10,
                      marginBottom: 8,
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border-color)',
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>🎯</span>
                    {favoriteGame.name} is the most-played activity ({favoriteGame.attempts} sessions), averaging{' '}
                    {favoriteGame.averageAccuracy !== null ? Math.round(favoriteGame.averageAccuracy) : '—'}% accuracy.
                  </div>
                )}
                {medicineAdherence !== null && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 10,
                      marginBottom: 8,
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border-color)',
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>💊</span>
                    Medication adherence at {medicineAdherence}% over the tracked reminders.
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TrendChart
                data={trendData}
                xKey="date"
                title="Full Period — All Domains"
                lines={DOMAINS.map((d) => ({ key: d, color: DOMAIN_COLORS[d], label: DOMAIN_LABELS[d] }))}
                height={280}
              />
            </div>

            <div style={{ marginTop: 24, fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.6 }}>
              Report generated by Sahaaya · {new Date().toLocaleDateString('en-IN')} · Data is for activity monitoring only and does not
              constitute clinical advice.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
