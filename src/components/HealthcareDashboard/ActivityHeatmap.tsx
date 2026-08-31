import type { HeatmapDay } from '../../utils/engagement';

function intensity(count: number): string {
  if (count === 0) return 'var(--border-color)';
  if (count === 1) return '#BEE3D8';
  if (count <= 3) return '#7FC8B8';
  return 'var(--color-success)';
}

export function ActivityHeatmap({ days }: { days: HeatmapDay[] }) {
  if (days.length === 0) return null;

  const first = new Date(days[0].date);
  const padStart = first.getDay();
  const padded: (HeatmapDay | null)[] = [...Array(padStart).fill(null), ...days];
  const weeks: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

  const activeDays = days.filter((d) => d.count > 0).length;

  return (
    <div>
      <p style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        Activity heatmap: {activeDays} active days out of {days.length} shown, from {days[0].date} to {days[days.length - 1].date}.
      </p>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }} aria-hidden="true">
        <div style={{ display: 'flex', gap: 3, width: 'max-content' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {week.map((day, di) =>
                day ? (
                  <div
                    key={di}
                    title={`${day.date}: ${day.count} session${day.count === 1 ? '' : 's'}`}
                    style={{ width: 12, height: 12, borderRadius: 3, background: intensity(day.count) }}
                  />
                ) : (
                  <div key={di} style={{ width: 12, height: 12 }} />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 11, color: 'var(--text-tertiary)' }} aria-hidden="true">
        Less
        {[0, 1, 2, 4].map((c) => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: intensity(c) }} />
        ))}
        More
      </div>
    </div>
  );
}
