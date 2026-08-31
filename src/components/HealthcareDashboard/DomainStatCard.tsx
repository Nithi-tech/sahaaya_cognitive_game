import type { DomainAggregate } from '../../utils/analytics';
import { TrendIndicator } from './TrendIndicator';

const DOMAIN_LABELS: Record<string, string> = {
  memory: 'Memory',
  attention: 'Attention',
  recognition: 'Recognition',
  pattern: 'Pattern',
  routine: 'Routine',
};

export function DomainStatCard({ aggregate, color }: { aggregate: DomainAggregate; color: string }) {
  const label = DOMAIN_LABELS[aggregate.domain] ?? aggregate.domain;

  if (aggregate.count === 0) {
    return (
      <div className="card" style={{ borderRadius: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No sessions yet for this domain.</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ borderRadius: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color }}>{aggregate.current}</div>
      </div>
      <TrendIndicator direction={aggregate.trend} size={12} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12, fontSize: 12 }}>
        <div>
          <div style={{ color: 'var(--text-tertiary)' }}>Average</div>
          <div style={{ fontWeight: 700 }}>{aggregate.average !== null ? Math.round(aggregate.average) : '—'}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-tertiary)' }}>Best</div>
          <div style={{ fontWeight: 700 }}>{aggregate.best ?? '—'}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-tertiary)' }}>Worst</div>
          <div style={{ fontWeight: 700 }}>{aggregate.worst ?? '—'}</div>
        </div>
      </div>
      {aggregate.baseline !== null && aggregate.baselineDiff && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
          vs. personal baseline ({Math.round(aggregate.baseline)}):{' '}
          <strong style={{ color: aggregate.baselineDiff.absolute >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {aggregate.baselineDiff.absolute >= 0 ? '+' : ''}
            {Math.round(aggregate.baselineDiff.absolute)}
          </strong>
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
        Based on {aggregate.count} session{aggregate.count === 1 ? '' : 's'}
      </div>
    </div>
  );
}
