import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import type { TrendDirection } from '../../utils/analytics';

const CONFIG: Record<TrendDirection, { label: string; color: string; icon: typeof TrendingUp }> = {
  improving: { label: 'Improving', color: 'var(--color-success)', icon: TrendingUp },
  declining: { label: 'Declining', color: 'var(--color-danger)', icon: TrendingDown },
  stable: { label: 'Stable', color: 'var(--text-secondary)', icon: Minus },
  insufficient_data: { label: 'Not enough data yet', color: 'var(--text-tertiary)', icon: HelpCircle },
};

// Trend is always communicated with text + icon, never color alone (Section 22).
export function TrendIndicator({ direction, size = 14 }: { direction: TrendDirection; size?: number }) {
  const { label, color, icon: Icon } = CONFIG[direction];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color, fontWeight: 700, fontSize: size }}>
      <Icon size={size + 2} />
      {label}
      {direction !== 'stable' && direction !== 'insufficient_data' && (
        <span aria-hidden="true">{direction === 'improving' ? '↑' : '↓'}</span>
      )}
      {direction === 'stable' && <span aria-hidden="true">→</span>}
    </span>
  );
}
