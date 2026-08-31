import { Lightbulb, Sparkles } from 'lucide-react';
import type { Recommendation } from '../../utils/recommendations';
import { EmptyState } from './States';

export function RecommendationsList({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length === 0) {
    return <EmptyState title="No recommendations yet" description="More activity data is needed before suggestions can be generated." />;
  }

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-tertiary)',
          marginBottom: 12,
          padding: '8px 12px',
          background: 'var(--bg-page)',
          borderRadius: 8,
        }}
      >
        These are supportive activity suggestions derived from app usage data — not medical advice or clinical decisions.
      </div>
      {recommendations.map((r) => (
        <div
          key={r.id}
          style={{
            display: 'flex',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 12,
            marginBottom: 10,
            background: r.kind === 'insight' ? 'var(--color-info-light)' : 'var(--color-warning-light)',
            border: `1px solid ${r.kind === 'insight' ? '#D4EDF2' : '#FFE0B2'}`,
          }}
        >
          <div style={{ flexShrink: 0, marginTop: 2 }}>
            {r.kind === 'insight' ? <Sparkles size={16} color="var(--color-info)" /> : <Lightbulb size={16} color="var(--color-warning)" />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</span>
              <span className={`badge ${r.kind === 'insight' ? 'badge--info' : 'badge--warning'}`} style={{ fontSize: 10 }}>
                {r.kind === 'insight' ? 'Insight' : 'Activity suggestion'}
              </span>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{r.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
