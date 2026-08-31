import type { ReactNode } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

export function SkeletonCard({ height = 120 }: { height?: number }) {
  return <div className="skeleton" style={{ height, width: '100%', borderRadius: 16 }} />;
}

export function SkeletonRow({ count = 3, height = 80 }: { count?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={height} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
        {icon ?? <Inbox size={32} color="var(--text-tertiary)" />}
      </div>
      <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 4 }}>{title}</p>
      {description && <p style={{ fontSize: 13, maxWidth: 360, margin: '0 auto' }}>{description}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <AlertCircle size={28} color="var(--color-danger)" style={{ marginBottom: 10 }} />
      <p style={{ color: 'var(--color-danger)', fontWeight: 600, marginBottom: 12 }}>{message}</p>
      {onRetry && (
        <button className="btn btn--outline btn--sm" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export function NotYetAvailable({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        background: 'var(--bg-page)',
        border: '1px dashed var(--border-color)',
        fontSize: 13,
        color: 'var(--text-tertiary)',
        textAlign: 'center',
      }}
    >
      {label} isn't tracked by Sahaaya yet.
    </div>
  );
}
