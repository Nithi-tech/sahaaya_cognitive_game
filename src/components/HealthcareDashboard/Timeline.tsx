import type { ReactNode } from 'react';
import { Gamepad2, AlertTriangle, Heart } from 'lucide-react';
import type { Alert, CognitiveSession, Memory } from '../../types';
import { getGameDefinition } from '../../games/registry';
import { EmptyState } from './States';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  icon: ReactNode;
  color: string;
}

// Reminders are deliberately excluded here — the data model has no
// timestamp for "when a reminder's status changed," only its current
// status, so it can't honestly be placed on a chronological timeline (it
// still appears in Care Information, where a point-in-time isn't implied).
export function buildTimelineEvents(sessions: CognitiveSession[], alerts: Alert[], memories: Memory[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const s of sessions) {
    const def = getGameDefinition(s.gameType);
    events.push({
      id: `session-${s.id}`,
      timestamp: s.timestamp,
      title: `Completed ${def?.name ?? s.gameType.replace(/_/g, ' ')}`,
      description: `${s.accuracy}% accuracy · ${s.difficulty} difficulty${s.mistakes ? ` · ${s.mistakes} mistake${s.mistakes === 1 ? '' : 's'}` : ''}`,
      icon: <Gamepad2 size={14} />,
      color: 'var(--color-primary)',
    });
  }

  for (const a of alerts) {
    events.push({
      id: `alert-${a.id}`,
      timestamp: a.createdAt,
      title: a.message,
      description: a.detail,
      icon: <AlertTriangle size={14} />,
      color: a.severity === 'high' ? 'var(--color-danger)' : a.severity === 'medium' ? 'var(--color-warning)' : 'var(--color-success)',
    });
  }

  for (const m of memories) {
    events.push({
      id: `memory-${m.id}`,
      timestamp: m.createdAt,
      title: `Memory added: ${m.title}`,
      description: m.category,
      icon: <Heart size={14} />,
      color: 'var(--color-accent)',
    });
  }

  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function Timeline({ events, limit }: { events: TimelineEvent[]; limit?: number }) {
  const shown = limit ? events.slice(0, limit) : events;
  if (shown.length === 0) {
    return <EmptyState title="No recent activity" description="Events will appear here once the patient completes activities." />;
  }
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {shown.map((e, i) => (
        <li key={e.id} style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: i === shown.length - 1 ? 0 : 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: e.color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {e.icon}
            </div>
            {i !== shown.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--border-color)', marginTop: 4 }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                {new Date(e.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {e.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{e.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
