import type { PatientProfile } from '../../types';
import type { TrendDirection } from '../../utils/analytics';
import { TrendIndicator } from './TrendIndicator';

function timeAgo(iso: string | null): string {
  if (!iso) return 'No activity recorded';
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function PatientHeader({
  patient,
  overallScore,
  overallTrend,
  lastSessionAt,
  unresolvedAlertCount,
}: {
  patient: PatientProfile;
  overallScore: number | null;
  overallTrend: TrendDirection;
  lastSessionAt: string | null;
  unresolvedAlertCount: number;
}) {
  const daysSinceActivity = lastSessionAt ? Math.floor((Date.now() - new Date(lastSessionAt).getTime()) / 86400000) : null;
  const careStatus =
    unresolvedAlertCount > 0 ? { label: 'Needs Attention', color: 'var(--color-warning)', bg: 'var(--color-warning-light)' }
    : daysSinceActivity !== null && daysSinceActivity <= 2 ? { label: 'Active', color: 'var(--color-success)', bg: 'var(--color-success-light)' }
    : { label: 'Inactive', color: 'var(--text-tertiary)', bg: 'var(--bg-page)' };

  return (
    <div className="card" style={{ borderRadius: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          {patient.name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{patient.name}</h1>
            <span style={{ padding: '3px 10px', borderRadius: 99, background: careStatus.bg, color: careStatus.color, fontSize: 12, fontWeight: 700 }}>
              {careStatus.label}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Age {patient.age} · {patient.region} · {patient.language === 'en' ? 'English' : 'Assamese'} · ID {patient.id}
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 6 }}>Last activity: {timeAgo(lastSessionAt)}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Overall Cognitive Score
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1.2 }}>{overallScore ?? '—'}</div>
          <TrendIndicator direction={overallTrend} />
        </div>
      </div>
      <div
        style={{
          background: '#FFF8F0',
          border: '1px solid #FFD08A',
          borderRadius: 12,
          padding: '10px 14px',
          marginTop: 16,
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}
      >
        Scores reflect app activity engagement only — not a clinical assessment of dementia, Alzheimer's, or any other condition.
      </div>
    </div>
  );
}
