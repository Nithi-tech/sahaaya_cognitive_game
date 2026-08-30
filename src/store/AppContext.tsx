import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  Language, CognitiveProfile, CognitiveSession, Reminder, Memory, Alert, DailyActivity, MoodType,
  PatientProfile, AdaptiveRecommendation, PatientPreferences, OnboardingData,
} from '../types';
import { api, ApiOfflineError, apiOrOffline } from '../api/client';
import { updateDomainScore, generateRecommendation } from '../engines/adaptiveDifficulty';
import { useAuth } from './AuthContext';
import { useOffline } from './OfflineContext';
import { setActivePatientVoiceClip } from '../services/voiceService';

interface AppContextType {
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  currentPatient: PatientProfile | null;
  patients: PatientProfile[];
  selectPatient: (patientId: string) => Promise<void>;
  cognitiveProfile: CognitiveProfile;
  sessions: CognitiveSession[];
  reminders: Reminder[];
  memories: Memory[];
  alerts: Alert[];
  dailyActivities: DailyActivity[];
  mood: MoodType | null;
  setMood: (mood: MoodType) => void;
  addSession: (session: Omit<CognitiveSession, 'id' | 'patientId' | 'timestamp'>) => Promise<AdaptiveRecommendation | null>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'patientId' | 'status'>) => Promise<void>;
  updateReminderStatus: (id: string, status: Reminder['status']) => Promise<void>;
  addMemory: (memory: Omit<Memory, 'id' | 'patientId' | 'createdAt'>) => Promise<void>;
  updateDailyActivity: (id: string, status: DailyActivity['status']) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  updatePreferences: (partial: Partial<PatientPreferences>) => Promise<void>;
  /** Refetches the patient list from the server. */
  refreshPatients: () => Promise<void>;
  /** Creates a new patient + elder account from the onboarding wizard. Returns the created patient + PIN hint. */
  createPatient: (input: { name: string; age: number; region: string; language: string; pin: string }) => Promise<{ patient: PatientProfile; pinHint: string }>;
  /** Saves a single onboarding section for the current patient. */
  saveOnboardingSection: (section: keyof OnboardingData, data: OnboardingData[keyof OnboardingData]) => Promise<void>;
  /** Marks the onboarding wizard as complete for the current patient. */
  markOnboardingComplete: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);

const EMPTY_PROFILE = (patientId: string): CognitiveProfile => ({
  patientId,
  memoryScore: 50,
  attentionScore: 50,
  recognitionScore: 50,
  patternScore: 50,
  routineScore: 50,
  overallEngagement: 50,
  updatedAt: new Date().toISOString(),
});

function cacheKey(patientId: string, name: string) {
  return `sahaaya_cache_${patientId}_${name}`;
}

function readCache<T>(patientId: string, name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(cacheKey(patientId, name));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache<T>(patientId: string, name: string, value: T) {
  localStorage.setItem(cacheKey(patientId, name), JSON.stringify(value));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { isOnline, addToQueue } = useOffline();

  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('sahaaya_lang') as Language) ?? 'en');
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [currentPatient, setCurrentPatient] = useState<PatientProfile | null>(null);
  const [cognitiveProfile, setCognitiveProfile] = useState<CognitiveProfile>(EMPTY_PROFILE('unknown'));
  const [sessions, setSessions] = useState<CognitiveSession[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [mood, setMoodState] = useState<MoodType | null>(null);

  const patientIdRef = useRef<string | null>(null);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sahaaya_lang', lang);
  }, []);

  const setMood = useCallback((m: MoodType) => {
    const today = new Date().toISOString().split('T')[0];
    setMoodState(m);
    localStorage.setItem('sahaaya_mood_' + today, m);
  }, []);

  // Load the current user's patient + all patient-scoped data. Falls back to
  // whatever was last cached to localStorage when the network is unavailable.
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    setMoodState(localStorage.getItem('sahaaya_mood_' + today) as MoodType | null);

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { patients: fetchedPatients } = await api.get<{ patients: PatientProfile[] }>('/patients');
        if (cancelled) return;
        setPatients(fetchedPatients);
        const storedPid = localStorage.getItem('sahaaya_active_patient_id');
        const patient = user?.role === 'elderly'
          ? (fetchedPatients.find((p) => p.userId === user.id) ?? fetchedPatients[0] ?? null)
          : ((storedPid ? fetchedPatients.find((p) => p.id === storedPid) : undefined) ?? fetchedPatients[0] ?? null);
        setCurrentPatient(patient);
        patientIdRef.current = patient ? patient.id : null;
        if (patient) {
          localStorage.setItem('sahaaya_active_patient_id', patient.id);
        }
        if (!patient) {
          setLoading(false);
          return;
        }
        writeCache(patient.id, 'patient', patient);

        const [profileRes, sessionsRes, remindersRes, memoriesRes, alertsRes, activitiesRes] = await Promise.all([
          api.get<{ profile: CognitiveProfile }>(`/sessions/${patient.id}/profile`).catch(() => ({ profile: EMPTY_PROFILE(patient.id) })),
          api.get<{ sessions: CognitiveSession[] }>(`/sessions/${patient.id}`),
          api.get<{ reminders: Reminder[] }>(`/reminders/${patient.id}`),
          api.get<{ memories: Memory[] }>(`/memories/${patient.id}`),
          api.get<{ alerts: Alert[] }>(`/alerts/${patient.id}`),
          api.get<{ activities: DailyActivity[] }>(`/daily-activities/${patient.id}`),
        ]);
        if (cancelled) return;

        setCognitiveProfile(profileRes.profile);
        setSessions(sessionsRes.sessions);
        setReminders(remindersRes.reminders);
        setMemories(memoriesRes.memories);
        setAlerts(alertsRes.alerts);
        setDailyActivities(activitiesRes.activities);

        writeCache(patient.id, 'profile', profileRes.profile);
        writeCache(patient.id, 'sessions', sessionsRes.sessions);
        writeCache(patient.id, 'reminders', remindersRes.reminders);
        writeCache(patient.id, 'memories', memoriesRes.memories);
        writeCache(patient.id, 'alerts', alertsRes.alerts);
        writeCache(patient.id, 'activities', activitiesRes.activities);
      } catch {
        // Offline or server unreachable on first load — use the last cached patient, if any.
        const cachedPatientId = Object.keys(localStorage)
          .find((k) => k.startsWith('sahaaya_cache_') && k.endsWith('_patient'));
        if (cachedPatientId) {
          const pid = cachedPatientId.replace('sahaaya_cache_', '').replace('_patient', '');
          const patient = readCache<PatientProfile | null>(pid, 'patient', null);
          patientIdRef.current = pid;
          setCurrentPatient(patient);
          setCognitiveProfile(readCache(pid, 'profile', EMPTY_PROFILE(pid)));
          setSessions(readCache(pid, 'sessions', []));
          setReminders(readCache(pid, 'reminders', []));
          setMemories(readCache(pid, 'memories', []));
          setAlerts(readCache(pid, 'alerts', []));
          setDailyActivities(readCache(pid, 'activities', []));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  // Synchronize the active patient's added family voice clip globally across all speech output
  useEffect(() => {
    if (currentPatient) {
      const people = currentPatient.preferences?.onboarding?.people?.people ?? [];
      const personWithClip = people.find(
        (p) => p.audioClips?.greeting || p.audioClips?.reminder || p.audioClips?.reward || p.greetingAudioUrl
      );
      const clip = personWithClip?.audioClips?.greeting
        || personWithClip?.audioClips?.reminder
        || personWithClip?.audioClips?.reward
        || personWithClip?.greetingAudioUrl;
      setActivePatientVoiceClip(clip ?? null);
    } else {
      setActivePatientVoiceClip(null);
    }
  }, [currentPatient]);

  const addSession = useCallback(
    async (input: Omit<CognitiveSession, 'id' | 'patientId' | 'timestamp'>): Promise<AdaptiveRecommendation | null> => {
      const patientId = patientIdRef.current;
      if (!patientId) return null;

      if (isOnline) {
        try {
          const result = await apiOrOffline(() =>
            api.post<{ session: CognitiveSession; profile: CognitiveProfile; recommendation: AdaptiveRecommendation }>(
              `/sessions/${patientId}`,
              input,
            ),
          );
          setSessions((prev) => {
            const updated = [result.session, ...prev];
            writeCache(patientId, 'sessions', updated);
            return updated;
          });
          setCognitiveProfile(result.profile);
          writeCache(patientId, 'profile', result.profile);
          return result.recommendation;
        } catch (err) {
          if (!(err instanceof ApiOfflineError)) throw err;
          // fall through to offline path below
        }
      }

      // Offline: apply the same adaptive-scoring logic locally so the UI updates
      // immediately, then queue the real write for when connectivity returns.
      const localSession: CognitiveSession = {
        ...input,
        id: `local_${Date.now()}`,
        patientId,
        timestamp: new Date().toISOString(),
      };
      let recommendation: AdaptiveRecommendation | null = null;
      setSessions((prev) => {
        const updated = [localSession, ...prev];
        writeCache(patientId, 'sessions', updated);
        return updated;
      });
      setCognitiveProfile((prev) => {
        const updated = { ...prev };
        const key = `${input.domain}Score` as keyof CognitiveProfile;
        (updated[key] as number) = updateDomainScore(prev[key] as number, input.accuracy);
        updated.overallEngagement = Math.round(
          (updated.memoryScore + updated.attentionScore + updated.recognitionScore + updated.patternScore + updated.routineScore) / 5,
        );
        updated.updatedAt = localSession.timestamp;
        writeCache(patientId, 'profile', updated);
        recommendation = generateRecommendation(
          {
            memory: updated.memoryScore,
            attention: updated.attentionScore,
            recognition: updated.recognitionScore,
            pattern: updated.patternScore,
            routine: updated.routineScore,
          },
          [],
          input.accuracy,
        );
        return updated;
      });
      addToQueue({ patientId, actionType: 'addSession', payload: input });
      return recommendation;
    },
    [isOnline, addToQueue],
  );

  const addReminder = useCallback(
    async (input: Omit<Reminder, 'id' | 'patientId' | 'status'>) => {
      const patientId = patientIdRef.current;
      if (!patientId) return;
      if (isOnline) {
        try {
          const { reminder } = await apiOrOffline(() => api.post<{ reminder: Reminder }>(`/reminders/${patientId}`, input));
          setReminders((prev) => {
            const updated = [...prev, reminder];
            writeCache(patientId, 'reminders', updated);
            return updated;
          });
          return;
        } catch (err) {
          if (!(err instanceof ApiOfflineError)) throw err;
        }
      }
      const local: Reminder = { ...input, id: `local_${Date.now()}`, patientId, status: 'scheduled' };
      setReminders((prev) => {
        const updated = [...prev, local];
        writeCache(patientId, 'reminders', updated);
        return updated;
      });
      addToQueue({ patientId, actionType: 'addReminder', payload: input });
    },
    [isOnline, addToQueue],
  );

  const updateReminderStatus = useCallback(
    async (id: string, status: Reminder['status']) => {
      const patientId = patientIdRef.current;
      if (!patientId) return;
      setReminders((prev) => {
        const updated = prev.map((r) => (r.id === id ? { ...r, status } : r));
        writeCache(patientId, 'reminders', updated);
        return updated;
      });
      if (isOnline) {
        try {
          const { reminder } = await apiOrOffline(() =>
            api.patch<{ reminder: Reminder }>(`/reminders/${patientId}/${id}/status`, { status }),
          );
          setReminders((prev) => {
            const updated = prev.map((r) => (r.id === id ? reminder : r));
            writeCache(patientId, 'reminders', updated);
            return updated;
          });
          return;
        } catch (err) {
          if (!(err instanceof ApiOfflineError)) throw err;
        }
      }
      addToQueue({ patientId, actionType: 'setReminderStatus', payload: { reminderId: id, status } });
    },
    [isOnline, addToQueue],
  );

  const addMemory = useCallback(
    async (input: Omit<Memory, 'id' | 'patientId' | 'createdAt'>) => {
      const patientId = patientIdRef.current;
      if (!patientId) return;
      if (isOnline) {
        try {
          const { memory } = await apiOrOffline(() => api.post<{ memory: Memory }>(`/memories/${patientId}`, input));
          setMemories((prev) => {
            const updated = [memory, ...prev];
            writeCache(patientId, 'memories', updated);
            return updated;
          });
          return;
        } catch (err) {
          if (!(err instanceof ApiOfflineError)) throw err;
        }
      }
      const local: Memory = { ...input, id: `local_${Date.now()}`, patientId, createdAt: new Date().toISOString() };
      setMemories((prev) => {
        const updated = [local, ...prev];
        writeCache(patientId, 'memories', updated);
        return updated;
      });
      addToQueue({ patientId, actionType: 'addMemory', payload: input });
    },
    [isOnline, addToQueue],
  );

  const updateDailyActivity = useCallback(
    async (id: string, status: DailyActivity['status']) => {
      const patientId = patientIdRef.current;
      if (!patientId) return;
      setDailyActivities((prev) => {
        const updated = prev.map((a) => (a.id === id ? { ...a, status } : a));
        writeCache(patientId, 'activities', updated);
        return updated;
      });
      if (isOnline) {
        try {
          await apiOrOffline(() => api.patch(`/daily-activities/${patientId}/${id}`, { status }));
          return;
        } catch (err) {
          if (!(err instanceof ApiOfflineError)) throw err;
        }
      }
      addToQueue({ patientId, actionType: 'setDailyActivityStatus', payload: { activityId: id, status } });
    },
    [isOnline, addToQueue],
  );

  const updatePreferences = useCallback(
    async (partial: Partial<PatientPreferences>) => {
      const patientId = patientIdRef.current;
      if (!patientId) return;

      let merged: PatientPreferences | null = null;
      setCurrentPatient((prev) => {
        if (!prev) return prev;
        merged = { ...prev.preferences, ...partial };
        const updated = { ...prev, preferences: merged };
        writeCache(patientId, 'patient', updated);
        return updated;
      });
      if (!merged) return;

      if (isOnline) {
        try {
          const { patient } = await apiOrOffline(() =>
            api.patch<{ patient: PatientProfile }>(`/patients/${patientId}`, { preferences: merged }),
          );
          setCurrentPatient(patient);
          writeCache(patientId, 'patient', patient);
          return;
        } catch (err) {
          if (!(err instanceof ApiOfflineError)) throw err;
        }
      }
      addToQueue({ patientId, actionType: 'updatePatientPreferences', payload: merged });
    },
    [isOnline, addToQueue],
  );

  const resolveAlert = useCallback(
    async (id: string) => {
      const patientId = patientIdRef.current;
      if (!patientId) return;
      setAlerts((prev) => {
        const updated = prev.map((a) => (a.id === id ? { ...a, resolved: true } : a));
        writeCache(patientId, 'alerts', updated);
        return updated;
      });
      if (isOnline) {
        try {
          await apiOrOffline(() => api.patch(`/alerts/${patientId}/${id}/resolve`));
          return;
        } catch (err) {
          if (!(err instanceof ApiOfflineError)) throw err;
        }
      }
      addToQueue({ patientId, actionType: 'resolveAlert', payload: { alertId: id } });
    },
    [isOnline, addToQueue],
  );

  const selectPatient = useCallback(async (patientId: string) => {
    const selected = patients.find((p) => p.id === patientId) ?? null;
    if (!selected) return;
    setCurrentPatient(selected);
    patientIdRef.current = selected.id;
    localStorage.setItem('sahaaya_active_patient_id', selected.id);
    writeCache(selected.id, 'patient', selected);
    setLoading(true);
    try {
      const [profileRes, sessionsRes, remindersRes, memoriesRes, alertsRes, activitiesRes] = await Promise.all([
        api.get<{ profile: CognitiveProfile }>(`/sessions/${selected.id}/profile`).catch(() => ({ profile: EMPTY_PROFILE(selected.id) })),
        api.get<{ sessions: CognitiveSession[] }>(`/sessions/${selected.id}`),
        api.get<{ reminders: Reminder[] }>(`/reminders/${selected.id}`),
        api.get<{ memories: Memory[] }>(`/memories/${selected.id}`),
        api.get<{ alerts: Alert[] }>(`/alerts/${selected.id}`),
        api.get<{ activities: DailyActivity[] }>(`/daily-activities/${selected.id}`),
      ]);
      setCognitiveProfile(profileRes.profile);
      setSessions(sessionsRes.sessions);
      setReminders(remindersRes.reminders);
      setMemories(memoriesRes.memories);
      setAlerts(alertsRes.alerts);
      setDailyActivities(activitiesRes.activities);
      writeCache(selected.id, 'profile', profileRes.profile);
      writeCache(selected.id, 'sessions', sessionsRes.sessions);
      writeCache(selected.id, 'reminders', remindersRes.reminders);
      writeCache(selected.id, 'memories', memoriesRes.memories);
      writeCache(selected.id, 'alerts', alertsRes.alerts);
      writeCache(selected.id, 'activities', activitiesRes.activities);
    } catch {
      // offline fallback
      setCognitiveProfile(readCache(selected.id, 'profile', EMPTY_PROFILE(selected.id)));
      setSessions(readCache(selected.id, 'sessions', []));
      setReminders(readCache(selected.id, 'reminders', []));
      setMemories(readCache(selected.id, 'memories', []));
      setAlerts(readCache(selected.id, 'alerts', []));
      setDailyActivities(readCache(selected.id, 'activities', []));
    } finally {
      setLoading(false);
    }
  }, [patients]);

  const refreshPatients = useCallback(async () => {
    try {
      const { patients: fetchedPatients } = await api.get<{ patients: PatientProfile[] }>('/patients');
      setPatients(fetchedPatients);
      const storedPid = localStorage.getItem('sahaaya_active_patient_id');
      const active = (storedPid ? fetchedPatients.find(p => p.id === storedPid) : undefined) ?? fetchedPatients[0] ?? null;
      if (active) {
        setCurrentPatient(active);
        patientIdRef.current = active.id;
        localStorage.setItem('sahaaya_active_patient_id', active.id);
      } else {
        setCurrentPatient(null);
        patientIdRef.current = null;
      }
    } catch {
      /* ignore */
    }
  }, []);

  const createPatient = useCallback(
    async (input: { name: string; age: number; region: string; language: string; pin: string }) => {
      const result = await api.post<{ patient: PatientProfile; pinHint: string }>('/patients', input);
      setPatients((prev) => [...prev, result.patient]);
      setCurrentPatient(result.patient);
      patientIdRef.current = result.patient.id;
      localStorage.setItem('sahaaya_active_patient_id', result.patient.id);
      writeCache(result.patient.id, 'patient', result.patient);
      return result;
    },
    [],
  );

  const saveOnboardingSection = useCallback(
    async (section: keyof OnboardingData, data: OnboardingData[keyof OnboardingData]) => {
      const patientId = patientIdRef.current;
      if (!patientId) return;
      await api.patch(`/onboarding/${patientId}/${section}`, { data });
      // Merge the section into the local patient preferences so the wizard can
      // read it back without a full reload.
      setCurrentPatient((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          preferences: {
            ...prev.preferences,
            onboarding: {
              ...prev.preferences.onboarding,
              [section]: data,
            },
          },
        };
        writeCache(patientId, 'patient', updated);
        return updated;
      });
    },
    [],
  );

  const markOnboardingComplete = useCallback(async () => {
    const patientId = patientIdRef.current;
    if (!patientId) return;
    const { patient } = await api.patch<{ patient: PatientProfile }>(`/patients/${patientId}/onboarding-complete`);
    setCurrentPatient(patient);
    setPatients((prev) => prev.map((p) => (p.id === patient.id ? patient : p)));
    writeCache(patientId, 'patient', patient);
  }, []);

  return (
    <AppContext.Provider
      value={{
        loading,
        language, setLanguage,
        currentPatient,
        patients,
        selectPatient,
        refreshPatients,
        cognitiveProfile, sessions, reminders, memories, alerts, dailyActivities,
        mood, setMood,
        addSession, addReminder, updateReminderStatus, addMemory, updateDailyActivity, resolveAlert,
        updatePreferences,
        createPatient, saveOnboardingSection, markOnboardingComplete,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
