export type RangePreset = '7d' | '30d' | '3m' | '6m' | '1y' | 'custom';

export const RANGE_PRESETS: { value: RangePreset; label: string; days: number }[] = [
  { value: '7d', label: '7 Days', days: 7 },
  { value: '30d', label: '30 Days', days: 30 },
  { value: '3m', label: '3 Months', days: 90 },
  { value: '6m', label: '6 Months', days: 182 },
  { value: '1y', label: '1 Year', days: 365 },
];

export function presetToDays(preset: RangePreset, customDays?: number): number {
  if (preset === 'custom') return Math.max(1, customDays ?? 30);
  return RANGE_PRESETS.find((p) => p.value === preset)?.days ?? 30;
}

export function presetLabel(preset: RangePreset, customDays?: number): string {
  if (preset === 'custom') return `${customDays ?? 30} Days (custom)`;
  return RANGE_PRESETS.find((p) => p.value === preset)?.label ?? '30 Days';
}

export function daysBetween(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}
