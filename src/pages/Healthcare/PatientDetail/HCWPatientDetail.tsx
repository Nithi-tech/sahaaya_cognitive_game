import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HCWSidebar } from '../../../components/Sidebar/Sidebar';
import { TrendChart, DomainBar, ScoreRing } from '../../../components/Charts/Charts';
import { api } from '../../../api/client';
import { buildTrendData } from '../../../utils/trends';
import type { PatientProfile, CognitiveProfile, CognitiveSession } from '../../../types';
import { ArrowLeft } from 'lucide-react';

export default function HCWPatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [sessions, setSessions] = useState<CognitiveSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ patient: p }, profileRes, sessionsRes] = await Promise.all([
          api.get<{ patient: PatientProfile }>(`/patients/${id}`),
          api.get<{ profile: CognitiveProfile }>(`/sessions/${id}/profile`).catch(() => null),
          api.get<{ sessions: CognitiveSession[] }>(`/sessions/${id}?days=30`),
        ]);
        if (cancelled) return;
        setPatient(p);
        setProfile(profileRes?.profile ?? null);
        setSessions(sessionsRes.sessions);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="dashboard-layout">
        <HCWSidebar />
        <main className="dashboard-content">
          <p style={{ color: 'var(--color-danger)' }}>{error}</p>
        </main>
      </div>
    );
  }

  if (!patient || !profile) {
    return (
      <div className="dashboard-layout">
        <HCWSidebar />
        <main className="dashboard-content">
          <p style={{ color: 'var(--text-tertiary)' }}>Loading patient…</p>
        </main>
      </div>
    );
  }

  const domainScores = [
    { label: 'Memory', score: profile.memoryScore, color: '#E91E63' },
    { label: 'Attention', score: profile.attentionScore, color: '#2196F3' },
    { label: 'Recognition', score: profile.recognitionScore, color: '#FF9800' },
    { label: 'Pattern', score: profile.patternScore, color: '#9C27B0' },
    { label: 'Routine', score: profile.routineScore, color: '#4CAF50' },
  ];

  const strongest = [...domainScores].sort((a, b) => b.score - a.score)[0];
  const needsImprovement = [...domainScores].sort((a, b) => a.score - b.score)[0];
  const trendData = buildTrendData(sessions, 30, profile.overallEngagement);

  return (
    <div className="dashboard-layout">
      <HCWSidebar />
      <main className="dashboard-content">
        {/* Back + Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => navigate('/')}
            style={{ gap: 6, color: 'var(--text-secondary)', marginBottom: 12, paddingLeft: 0 }}
          >
            <ArrowLeft size={16} /> All Patients
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 26,
            }}>
              {patient.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>{patient.name}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                Age {patient.age} · {patient.region} · {patient.language === 'en' ? 'English' : 'Assamese'}
              </p>
            </div>
            <div style={{
              background: 'var(--color-success-light)', border: '1px solid var(--color-success)',
              borderRadius: 12, padding: '8px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-success)' }}>{profile.overallEngagement}%</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-success)' }}>Engagement</div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          background: '#FFF8F0', border: '1px solid #FFD08A', borderRadius: 12,
          padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)',
        }}>
          ⚠️ Activity performance scores. Not a clinical assessment of dementia or cognitive disease.
        </div>

        {/* Domain Score Rings */}
        <div className="card" style={{ borderRadius: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Activity Performance Profile</h3>
            <button onClick={() => navigate('/reports')} className="btn btn--outline btn--sm">Export Report</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 24 }}>
            {domainScores.map(d => (
              <ScoreRing key={d.label} score={d.score} label={d.label} color={d.color} size={80} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div style={{ background: 'var(--color-success-light)', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Strongest Domain</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{strongest.label} ({strongest.score})</div>
            </div>
            <div style={{ background: 'var(--color-warning-light)', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Focus Area</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{needsImprovement.label} ({needsImprovement.score})</div>
            </div>
          </div>

          {domainScores.map(d => (
            <DomainBar key={d.label} domain={d.label.toLowerCase()} score={d.score} color={d.color} label={d.label} />
          ))}
        </div>

        {/* Trend Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TrendChart
            data={trendData}
            xKey="date"
            title="30-Day Activity Performance Trend"
            lines={[
              { key: 'memory', color: '#E91E63', label: 'Memory' },
              { key: 'attention', color: '#2196F3', label: 'Attention' },
              { key: 'recognition', color: '#FF9800', label: 'Recognition' },
            ]}
            height={240}
          />
          <TrendChart
            data={trendData}
            xKey="date"
            title="Overall Engagement Trend"
            lines={[{ key: 'overall', color: 'var(--color-primary)', label: 'Overall' }]}
            height={180}
          />
        </div>
      </main>
    </div>
  );
}
