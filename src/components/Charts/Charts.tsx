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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4DFFB" strokeWidth={8} />
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
