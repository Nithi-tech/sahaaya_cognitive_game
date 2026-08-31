import type { ReactNode } from 'react';
import type { TrendDirection } from '../../utils/analytics';
import { TrendIndicator } from './TrendIndicator';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  color: string;
  bg: string;
  comparisonLabel?: string;
  direction?: TrendDirection;
  meaning?: string;
}

// Every KPI communicates Value -> Comparison -> Trend -> Meaning, not just a
// bare number (Section 5).
export function StatCard({ label, value, icon, color, bg, comparisonLabel, direction, meaning }: StatCardProps) {
  return (
    <div className="card" style={{ borderRadius: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: bg,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)' }}>{label}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 6 }}>{value}</div>
      {(comparisonLabel || direction) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: meaning ? 8 : 0 }}>
          {comparisonLabel && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{comparisonLabel}</span>}
          {direction && <TrendIndicator direction={direction} size={12} />}
        </div>
      )}
      {meaning && <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{meaning}</div>}
    </div>
  );
}
