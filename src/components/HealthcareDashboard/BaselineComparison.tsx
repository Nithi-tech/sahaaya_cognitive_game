import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface ComparisonRow {
  label: string;
  referenceValue: number | null;
  referenceCaption?: string;
}

function DiffBadge({ current, reference }: { current: number; reference: number | null }) {
  if (reference === null) {
    return <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Not enough data</span>;
  }
  const diff = current - reference;
  const color = diff > 1 ? 'var(--color-success)' : diff < -1 ? 'var(--color-danger)' : 'var(--text-secondary)';
  const Icon = diff > 1 ? ArrowUpRight : diff < -1 ? ArrowDownRight : Minus;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color, fontWeight: 700, fontSize: 14 }}>
      <Icon size={14} />
      {diff > 0 ? '+' : ''}
      {Math.round(diff)} pts
    </span>
  );
}

export function BaselineComparison({
  current,
  baseline,
  baselineCaption,
  previousPeriodAvg,
  personalAverage,
}: {
  current: number;
  baseline: number | null;
  baselineCaption?: string;
  previousPeriodAvg: number | null;
  personalAverage: number | null;
}) {
  const rows: ComparisonRow[] = [
    { label: 'vs. Personal Baseline', referenceValue: baseline, referenceCaption: baselineCaption },
    { label: 'vs. Previous Period', referenceValue: previousPeriodAvg },
    { label: 'vs. Personal Average', referenceValue: personalAverage },
  ];

  return (
    <div className="card" style={{ borderRadius: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Baseline Comparison</h3>
        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)' }}>{current}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              background: 'var(--bg-page)',
              borderRadius: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{row.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                {row.referenceValue !== null ? `${Math.round(row.referenceValue)}${row.referenceCaption ? ` · ${row.referenceCaption}` : ''}` : 'Not yet established'}
              </div>
            </div>
            <DiffBadge current={current} reference={row.referenceValue} />
          </div>
        ))}
      </div>
    </div>
  );
}
