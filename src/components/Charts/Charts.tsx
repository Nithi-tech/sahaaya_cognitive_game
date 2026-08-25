import type { TrendDataPoint } from '../../types';

interface TrendChartProps {
  data: TrendDataPoint[];
  lines: { key: string; color: string; label: string }[];
  xKey: string;
  title?: string;
  height?: number;
}

import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';

export function TrendChart({ data, lines, xKey, title, height = 220 }: TrendChartProps) {
  return (
    <div className="chart-container">
      {title && <div className="chart-title">{title}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            {lines.map((l) => (
              <linearGradient key={l.key} id={`grad-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={l.color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={l.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: '#718096' }}
            tickFormatter={(v) => v.slice(5)} // Show MM-DD
            interval="preserveStartEnd"
          />
          <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: '#718096' }} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              fontSize: 13,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            labelFormatter={(v) => `Date: ${v}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          {lines.map((l) => (
            <Area
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label}
              stroke={l.color}
              strokeWidth={2.5}
              fill={`url(#grad-${l.key})`}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DomainBarProps {
  domain: string;
  score: number;
  color: string;
  label: string;
}

export function DomainBar({ domain, score, color, label }: DomainBarProps) {
  const getLevel = (s: number) => s >= 80 ? 'Excellent' : s >= 65 ? 'Good' : s >= 50 ? 'Fair' : 'Needs Practice';
  const getLevelColor = (s: number) => s >= 80 ? 'var(--color-success)' : s >= 65 ? 'var(--color-primary)' : s >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div data-domain={domain} style={{ marginBottom: 16 }}>
      <div className="flex justify-between items-center mb-2">
        <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: getLevelColor(score), fontWeight: 600 }}>{getLevel(score)}</span>
          <span style={{ fontWeight: 700, fontSize: 16, color }}>{score}</span>
        </div>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar__fill"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)` }}
        />
      </div>
    </div>
  );
}

interface ScoreRingProps {
  score: number;
  size?: number;
  color?: string;
  label?: string;
}

export function ScoreRing({ score, size = 80, color = 'var(--color-primary)', label }: ScoreRingProps) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text
          x={size / 2} y={size / 2 + 1}
          textAnchor="middle" dominantBaseline="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}
          fontSize={size * 0.22} fontWeight={700} fill={color}
        >
          {score}
        </text>
      </svg>
      {label && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>{label}</span>}
    </div>
  );
}
