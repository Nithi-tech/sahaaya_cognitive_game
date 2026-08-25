import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { patients } = await api.get<{ patients: PatientProfile[] }>('/patients');
      const patient = patients[0];
      if (!patient) return;
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
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePrint = () => window.print();

  if (!data) {
    return (
      <div className="dashboard-layout">
        <HCWSidebar />
        <main className="dashboard-content">
          <p style={{ color: 'var(--text-tertiary)' }}>Loading report…</p>
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
          <button className="btn btn--primary" onClick={handlePrint} style={{ gap: 6 }}>
            <Download size={16} /> Export Report
          </button>
        </div>

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
      </main>
    </div>
  );
}
