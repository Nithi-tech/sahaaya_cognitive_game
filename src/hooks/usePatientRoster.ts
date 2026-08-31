import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Alert, CognitiveProfile, CognitiveSession, PatientProfile } from '../types';

export interface RosterRow {
  patient: PatientProfile;
  profile: CognitiveProfile | null;
  alerts: Alert[];
  recentSessions: CognitiveSession[];
}

export type LoadState = 'loading' | 'error' | 'success';

export function usePatientRoster() {
  const [state, setState] = useState<LoadState>('loading');
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    (async () => {
      try {
        const { patients } = await api.get<{ patients: PatientProfile[] }>('/patients');
        const withData = await Promise.all(
          patients.map(async (patient): Promise<RosterRow> => {
            const [profileRes, alertsRes, sessionsRes] = await Promise.all([
              api.get<{ profile: CognitiveProfile }>(`/sessions/${patient.id}/profile`).catch(() => null),
              api.get<{ alerts: Alert[] }>(`/alerts/${patient.id}`).catch(() => ({ alerts: [] })),
              api.get<{ sessions: CognitiveSession[] }>(`/sessions/${patient.id}?days=14`).catch(() => ({ sessions: [] })),
            ]);
            return {
              patient,
              profile: profileRes?.profile ?? null,
              alerts: alertsRes.alerts,
              recentSessions: sessionsRes.sessions,
            };
          }),
        );
        if (!cancelled) {
          setRows(withData);
          setState('success');
        }
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  return { state, rows, reload };
}
