import { useEffect, useRef, useState } from 'react';
import { HCWSidebar } from '../../../components/Sidebar/Sidebar';
import { TrendChart } from '../../../components/Charts/Charts';
import { buildTrendData } from '../../../utils/trends';
import { api } from '../../../api/client';
import type { PatientProfile, CognitiveProfile, CognitiveSession, Reminder } from '../../../types';
import { Download, FileText } from 'lucide-react';

interface ReportData {
  patient: PatientProfile;
  profile: CognitiveProfile;
  trendData: ReturnType<typeof buildTrendData>;
  memoryChange: number;
  attnChange: number;
  avgOverall: number;
  totalSessions: number;
  medicineAdherence: number;
}

export default function HCWReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error' | 'no-patient'>('loading');
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadState('loading');
      try {
        const { patients } = await api.get<{ patients: PatientProfile[] }>('/patients');
        const patient = patients[0];
        if (!patient) {
          if (!cancelled) setLoadState('no-patient');
          return;
        }
        const [{ profile }, { sessions }, { reminders }] = await Promise.all([
          api.get<{ profile: CognitiveProfile }>(`/sessions/${patient.id}/profile`),
          api.get<{ sessions: CognitiveSession[] }>(`/sessions/${patient.id}?days=30`),
          api.get<{ reminders: Reminder[] }>(`/reminders/${patient.id}`),
        ]);
        if (cancelled) return;

        const trendData = buildTrendData(sessions, 30, profile.overallEngagement);
        const latest = trendData[trendData.length - 1];
        const earliest = trendData[0];
        const medicineRem = reminders.filter((r) => r.type === 'medicine');
        const medicineCompleted = medicineRem.filter((r) => r.status === 'completed');

        setData({
          patient,
          profile,
          trendData,
          memoryChange: latest.memory - earliest.memory,
          attnChange: latest.attention - earliest.attention,
          avgOverall: Math.round(trendData.reduce((a, d) => a + d.overall, 0) / trendData.length),
          totalSessions: sessions.length,
          medicineAdherence: medicineRem.length ? Math.round((medicineCompleted.length / medicineRem.length) * 100) : 0,
        });
        setLoadState('ready');
      } catch {
        if (!cancelled) setLoadState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExport = async () => {
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
      // PDF generation failed (e.g. canvas tainted, out of memory) — fall back
      // to the browser's own print-to-PDF rather than leaving the user stuck.
      window.print();
    } finally {
      setExporting(false);
    }
  };

  if (loadState === 'loading') {
    return (
      <div className="dashboard-layout">
        <HCWSidebar />
        <main className="dashboard-content">
          <p style={{ color: 'var(--text-tertiary)' }}>Loading report…</p>
        </main>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="dashboard-layout">
        <HCWSidebar />
        <main className="dashboard-content" style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 12 }}>Couldn't load this report. Please check your connection.</p>
          <button className="btn btn--outline btn--sm" onClick={() => window.location.reload()}>Try Again</button>
        </main>
      </div>
    );
  }

  if (loadState === 'no-patient' || !data) {
    return (
      <div className="dashboard-layout">
        <HCWSidebar />
        <main className="dashboard-content" style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ color: 'var(--text-tertiary)' }}>No patients are assigned to you yet, so there's nothing to report on.</p>
        </main>
      </div>
    );
  }

  const { patient, profile, trendData, memoryChange, attnChange, avgOverall, totalSessions, medicineAdherence } = data;
  const strongestDomain = [
    { label: 'Memory', score: profile.memoryScore },
    { label: 'Attention', score: profile.attentionScore },
    { label: 'Recognition', score: profile.recognitionScore },
    { label: 'Pattern', score: profile.patternScore },
    { label: 'Routine', score: profile.routineScore },
  ].sort((a, b) => b.score - a.score)[0];

  return (
    <div className="dashboard-layout">
      <HCWSidebar />
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Reports & Trends</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Longitudinal activity engagement analytics for {patient.name}
            </p>
          </div>
          <button className="btn btn--primary" onClick={handleExport} disabled={exporting} style={{ gap: 6 }}>
            <Download size={16} /> {exporting ? 'Exporting…' : 'Export Report'}
          </button>
        </div>

        <div ref={reportRef}>
        {/* Disclaimer */}
        <div style={{
          background: '#FFF8F0', border: '1px solid #FFD08A', borderRadius: 12,
          padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)',
        }}>
          ⚠️ This report summarizes application activity and engagement. It is not a medical diagnosis, and does not assess dementia or Alzheimer's disease.
        </div>

        {/* Patient Summary Report */}
        <div className="card report-card" style={{ borderRadius: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
            <FileText size={20} color="var(--color-primary)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>30-Day Engagement Report — {patient.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {trendData[0].date} to {trendData[trendData.length - 1].date}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Sessions', value: totalSessions, color: 'var(--color-primary)' },
              { label: 'Avg. Engagement', value: `${avgOverall}%`, color: 'var(--color-success)' },
              { label: 'Medication Adherence', value: `${medicineAdherence}%`, color: '#E91E63' },
              { label: 'Memory Trend', value: memoryChange > 0 ? `+${memoryChange}` : `${memoryChange}`, color: memoryChange >= 0 ? 'var(--color-success)' : 'var(--color-danger)' },
              { label: 'Attention Trend', value: attnChange > 0 ? `+${attnChange}` : `${attnChange}`, color: attnChange >= 0 ? 'var(--color-success)' : 'var(--color-danger)' },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--bg-page)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Observations */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Key Observations</h4>
            {[
              {
                icon: memoryChange >= 0 ? '📈' : '📉',
                text: `Memory engagement ${memoryChange >= 0 ? 'improved' : 'decreased'} by ${Math.abs(memoryChange)} points over the period. ${memoryChange >= 0 ? 'Consistent practice appears beneficial.' : 'Increased session frequency may be beneficial.'}`,
              },
              {
                icon: '🎯',
                text: `${strongestDomain.label} is currently the strongest domain at ${strongestDomain.score}%.`,
              },
              {
                icon: '💊',
                text: `Medication adherence at ${medicineAdherence}% over the tracked reminders.`,
              },
            ].map((obs, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 10,
                marginBottom: 8, background: 'var(--bg-page)', border: '1px solid var(--border-color)',
                fontSize: 13, lineHeight: 1.5,
              }}>
                <span style={{ flexShrink: 0 }}>{obs.icon}</span>
                {obs.text}
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TrendChart
            data={trendData}
            xKey="date"
            title="Full Period — All Domains"
            lines={[
              { key: 'memory', color: '#E91E63', label: 'Memory' },
              { key: 'attention', color: '#2196F3', label: 'Attention' },
              { key: 'recognition', color: '#FF9800', label: 'Recognition' },
              { key: 'pattern', color: '#9C27B0', label: 'Pattern' },
              { key: 'routine', color: '#4CAF50', label: 'Routine' },
            ]}
            height={280}
          />
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.6 }}>
          Report generated by Sahaaya v1.0 · Assam Pilot · {new Date().toLocaleDateString('en-IN')} ·
          Data is for activity monitoring only and does not constitute clinical advice.
        </div>
        </div>
      </main>
    </div>
  );
}
