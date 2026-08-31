import { RANGE_PRESETS, type RangePreset } from '../../utils/dateRange';

interface DateRangeControlProps {
  preset: RangePreset;
  customFrom: string;
  customTo: string;
  onPresetChange: (preset: RangePreset) => void;
  onCustomChange: (from: string, to: string) => void;
}

export function DateRangeControl({ preset, customFrom, customTo, onPresetChange, onCustomChange }: DateRangeControlProps) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      <div className="tabs" role="tablist" aria-label="Select time range">
        {RANGE_PRESETS.map((p) => (
          <button
            key={p.value}
            role="tab"
            aria-selected={preset === p.value}
            className={`tab ${preset === p.value ? 'active' : ''}`}
            onClick={() => onPresetChange(p.value)}
          >
            {p.label}
          </button>
        ))}
        <button role="tab" aria-selected={preset === 'custom'} className={`tab ${preset === 'custom' ? 'active' : ''}`} onClick={() => onPresetChange('custom')}>
          Custom
        </button>
      </div>
      {preset === 'custom' && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>From</span>
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(e) => onCustomChange(e.target.value, customTo)}
              style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>To</span>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => onCustomChange(customFrom, e.target.value)}
              style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
