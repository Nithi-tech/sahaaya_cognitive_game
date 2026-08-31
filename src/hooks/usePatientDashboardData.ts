import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Alert, CognitiveProfile, CognitiveSession, Memory, PatientProfile, Reminder } from '../types';

export interface PatientDashboardData {
  patient: PatientProfile;
  profile: CognitiveProfile | null;
  sessions: CognitiveSession[];
  reminders: Reminder[];
  alerts: Alert[];
  memories: Memory[];
}

export type LoadState = 'loading' | 'error' | 'success';

// Central fetch for the Healthcare patient-detail dashboard — replaces the
// ad-hoc Promise.all previously duplicated across HCWPatients/HCWPatientDetail/HCWReports.
export function usePatientDashboardData(patientId: string | undefined, days: number) {
  const [state, setState] = useState<LoadState>('loading');
  const [data, setData] = useState<PatientDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    setState('loading');
    (async () => {
      try {
        const [{ patient }, profileRes, sessionsRes, remindersRes, alertsRes, memoriesRes] = await Promise.all([
          api.get<{ patient: PatientProfile }>(`/patients/${patientId}`),
          api.get<{ profile: CognitiveProfile }>(`/sessions/${patientId}/profile`).catch(() => null),
          api.get<{ sessions: CognitiveSession[] }>(`/sessions/${patientId}?days=${days}`),
          api.get<{ reminders: Reminder[] }>(`/reminders/${patientId}`).catch(() => ({ reminders: [] })),
          api.get<{ alerts: Alert[] }>(`/alerts/${patientId}`).catch(() => ({ alerts: [] })),
          api.get<{ memories: Memory[] }>(`/memories/${patientId}`).catch(() => ({ memories: [] })),
        ]);
        if (cancelled) return;
        setData({
          patient,
          profile: profileRes?.profile ?? null,
          sessions: sessionsRes.sessions,
          reminders: remindersRes.reminders,
          alerts: alertsRes.alerts,
          memories: memoriesRes.memories,
        });
        setState('success');
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message);
        setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, days, reloadToken]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  return { state, data, error, reload };
}
