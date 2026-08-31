import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import type { Alert, AlertSeverity } from '../../types';
import { EmptyState } from './States';

const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; bg: string; badge: string; label: string }> = {
  high: { color: 'var(--color-danger)', bg: 'var(--color-danger-light)', badge: 'badge--danger', label: 'Important' },
  medium: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)', badge: 'badge--warning', label: 'Attention' },
  low: { color: 'var(--color-success)', bg: 'var(--color-success-light)', badge: 'badge--success', label: 'Informational' },
};

function AlertCard({ alert, onResolve }: { alert: Alert; onResolve?: (id: string) => Promise<void> | void }) {
  const conf = SEVERITY_CONFIG[alert.severity];
  const [resolving, setResolving] = useState(false);

  return (
    <div
      className={`alert-card alert-card--${alert.severity}`}
      style={{ opacity: alert.resolved ? 0.6 : 1, marginBottom: 12 }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span className={`badge ${conf.badge}`}>{conf.label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {new Date(alert.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{alert.message}</p>
        {alert.detail && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: alert.action ? 10 : 0 }}>{alert.detail}</p>}
        {alert.action && !alert.resolved && (
          <div
            style={{
              background: 'var(--bg-page)',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <span style={{ fontWeight: 700, color: conf.color }}>Suggested next step: </span>
            {alert.action}
          </div>
        )}
      </div>
      {onResolve && !alert.resolved && (
        <button
          className="btn btn--outline btn--sm"
          disabled={resolving}
          onClick={async () => {
            setResolving(true);
            try {
              await onResolve(alert.id);
            } finally {
              setResolving(false);
            }
          }}
          style={{ gap: 4, flexShrink: 0, alignSelf: 'flex-start' }}
        >
          <CheckCircle size={14} /> {resolving ? 'Resolving…' : 'Resolve'}
        </button>
      )}
      {alert.resolved && (
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <CheckCircle size={14} /> Resolved
        </span>
      )}
    </div>
  );
}

export function AlertsList({
  alerts,
  onResolve,
  showResolved = true,
}: {
  alerts: Alert[];
  onResolve?: (id: string) => Promise<void> | void;
  showResolved?: boolean;
}) {
  const unresolved = alerts.filter((a) => !a.resolved).sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const resolved = alerts.filter((a) => a.resolved);

  if (alerts.length === 0) {
    return <EmptyState title="No alerts" description="No activity patterns have triggered an alert for this patient yet." />;
  }

  return (
    <div>
      {unresolved.length > 0 && (
        <div style={{ marginBottom: showResolved && resolved.length ? 24 : 0 }}>
          {unresolved.map((a) => (
            <AlertCard key={a.id} alert={a} onResolve={onResolve} />
          ))}
        </div>
      )}
      {unresolved.length === 0 && (
        <EmptyState title="No active alerts" description="Everything currently looks within expected patterns." />
      )}
      {showResolved && resolved.length > 0 && (
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 10 }}>Resolved ({resolved.length})</h4>
          {resolved.map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function severityRank(s: AlertSeverity): number {
  return s === 'high' ? 2 : s === 'medium' ? 1 : 0;
}
