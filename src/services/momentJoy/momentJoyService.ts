import { playPersonalizedPrompt } from '../voice/personalizedAudio';
import { playSuccessChime } from '../soundService';
import type {
  PatientProfile,
  MomentJoyActionType,
  MomentJoyEvent,
  ActivityNotification,
  PatientCoinState,
  WeeklyCoinRedemptionRecord,
} from '../../types';

export interface TriggerMomentJoyOptions {
  patient: PatientProfile | null;
  actionType: MomentJoyActionType;
  title: string;
  detail?: string;
  praiseText?: string;
  lang?: 'en' | 'as';
  metadata?: Record<string, unknown>;
  addToSyncQueue?: (item: { patientId: string; actionType: string; payload: Record<string, unknown> }) => void;
  isOnline?: boolean;
}

const EVENTS_STORAGE_KEY = 'sahaaya_momentjoy_events';
const NOTIFICATIONS_STORAGE_KEY = 'sahaaya_activity_notifications';
const COINS_STORAGE_KEY_PREFIX = 'sahaaya_patient_coins_v1_';
const MAX_STORED_ITEMS = 100; // Circular buffer limit to prevent localStorage bloat

export const COIN_REWARDS: Record<MomentJoyActionType, number> = {
  game: 10,
  medicine: 5,
  hydration: 3,
  routine: 5,
};

type MomentJoyListener = (
  event: MomentJoyEvent,
  notification: ActivityNotification,
  coinState?: PatientCoinState
) => void;
const listeners = new Set<MomentJoyListener>();

export function subscribeToMomentJoy(listener: MomentJoyListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Returns all stored MomentJoy events, optionally filtered by patient ID.
 */
export function getMomentJoyHistory(patientId?: string): MomentJoyEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: MomentJoyEvent[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (patientId) {
      return parsed.filter((e) => e.patientId === patientId);
    }
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Returns all activity micro-notifications for caregiver dashboard feed.
 */
export function getActivityNotifications(patientId?: string): ActivityNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: ActivityNotification[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (patientId) {
      return parsed.filter((n) => n.patientId === patientId);
    }
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Gets the current patient's coin state (current weekly balance, all-time, and redemption history).
 */
export function getPatientCoinState(patientId: string): PatientCoinState {
  try {
    const raw = localStorage.getItem(`${COINS_STORAGE_KEY_PREFIX}${patientId}`);
    if (raw) {
      const parsed: PatientCoinState = JSON.parse(raw);
      if (parsed && typeof parsed.currentWeekCoins === 'number') {
        return parsed;
      }
    }

    // Auto-migrate from default_patient if coins were earned before explicit patient attachment
    if (patientId && patientId !== 'default_patient') {
      const defaultRaw = localStorage.getItem(`${COINS_STORAGE_KEY_PREFIX}default_patient`);
      if (defaultRaw) {
        const parsedDefault: PatientCoinState = JSON.parse(defaultRaw);
        if (parsedDefault && parsedDefault.currentWeekCoins > 0) {
          const migrated: PatientCoinState = {
            ...parsedDefault,
            patientId,
          };
          savePatientCoinState(migrated);
          localStorage.removeItem(`${COINS_STORAGE_KEY_PREFIX}default_patient`);
          return migrated;
        }
      }
    }
  } catch {
    /* ignore */
  }

  return {
    patientId,
    currentWeekCoins: 0,
    totalAllTimeCoins: 0,
    history: [],
  };
}

/**
 * Persists the patient's coin state into localStorage.
 */
export function savePatientCoinState(state: PatientCoinState): void {
  try {
    localStorage.setItem(`${COINS_STORAGE_KEY_PREFIX}${state.patientId}`, JSON.stringify(state));
  } catch (err) {
    console.warn('[MomentJoy Coins] Failed to persist coin state:', err);
  }
}

/**
 * Increments the patient's coins based on the completed action.
 */
export function awardMomentJoyCoins(
  patientId: string,
  actionType: MomentJoyActionType,
  customAmount?: number
): { coinsAwarded: number; newState: PatientCoinState } {
  const coinsAwarded = customAmount ?? COIN_REWARDS[actionType] ?? 5;
  const current = getPatientCoinState(patientId);

  const newState: PatientCoinState = {
    ...current,
    currentWeekCoins: (current.currentWeekCoins || 0) + coinsAwarded,
    totalAllTimeCoins: (current.totalAllTimeCoins || 0) + coinsAwarded,
  };

  savePatientCoinState(newState);
  return { coinsAwarded, newState };
}

/**
 * Caregiver action: marks the patient's weekly accumulated coins as redeemed for a family treat
 * and resets the current week's coin counter to 0 while archiving past records.
 */
export function redeemWeeklyCoins(
  patientId: string,
  rewardNote: string = 'Family Celebration Treat',
  weekStart?: string,
  weekEnd?: string
): { redeemedRecord: WeeklyCoinRedemptionRecord; newState: PatientCoinState } {
  const current = getPatientCoinState(patientId);
  const now = new Date();
  const defaultEnd = now.toISOString().split('T')[0];
  const defaultStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const redeemedRecord: WeeklyCoinRedemptionRecord = {
    id: `redemption_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    patientId,
    weekStart: weekStart || defaultStart,
    weekEnd: weekEnd || defaultEnd,
    coinsEarned: current.currentWeekCoins,
    redeemedAt: now.toISOString(),
    rewardNote,
  };

  const newState: PatientCoinState = {
    ...current,
    currentWeekCoins: 0,
    lastRedemptionDate: now.toISOString(),
    history: [redeemedRecord, ...(current.history || [])],
  };

  savePatientCoinState(newState);

  // Dispatch custom event so UI updates reactively
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('sahaaya:momentjoy:coins_redeemed', {
          detail: { patientId, redeemedRecord, newState },
        })
      );
    } catch {
      /* ignore */
    }
  }

  return { redeemedRecord, newState };
}

function getIconForAction(actionType: MomentJoyActionType): string {
  switch (actionType) {
    case 'game':
      return '🎮';
    case 'medicine':
      return '💊';
    case 'hydration':
      return '💧';
    case 'routine':
      return '🔄';
    default:
      return '✨';
  }
}

function generateDefaultPraise(
  actionType: MomentJoyActionType,
  elderName: string,
  title: string,
  lang: 'en' | 'as' = 'en'
): string {
  if (lang === 'as') {
    switch (actionType) {
      case 'game':
        return `বৰ ভাল কাম ${elderName}! খেলখন সম্পূৰ্ণ কৰিলা!`;
      case 'medicine':
        return `ধন্যবাদ ${elderName}, সময়মতে ঔষধ খোৱাৰ বাবে!`;
      case 'hydration':
        return `বৰ ভাল ${elderName}, পানী খোৱাটো স্বাস্থ্যৰ বাবে ভাল!`;
      case 'routine':
        return `সুন্দৰ কাম ${elderName}! ${title} সম্পূৰ্ণ কৰিলা!`;
    }
  }

  switch (actionType) {
    case 'game':
      return `Well done ${elderName}! You completed ${title}!`;
    case 'medicine':
      return `Great job ${elderName}, thank you for taking your ${title}!`;
    case 'hydration':
      return `Splendid ${elderName}, staying hydrated keeps you refreshed!`;
    case 'routine':
      return `Wonderful ${elderName}, you completed ${title}!`;
    default:
      return `Well done ${elderName}! Keep up the wonderful spirit!`;
  }
}

function generateCaregiverMessage(
  elderName: string,
  actionType: MomentJoyActionType,
  title: string,
  coins: number
): string {
  switch (actionType) {
    case 'game':
      return `${elderName} completed ${title} (+${coins} 🪙) ✔`;
    case 'medicine':
      return `${elderName} took ${title} (+${coins} 🪙) ✔`;
    case 'hydration':
      return `${elderName} logged hydration (+${coins} 🪙) ✔`;
    case 'routine':
      return `${elderName} completed routine: ${title} (+${coins} 🪙) ✔`;
    default:
      return `${elderName} completed ${title} (+${coins} 🪙) ✔`;
  }
}

/**
 * Triggers MomentJoy — Layer 1 (Instant local praise & coin increment) and Layer 2 (Caregiver micro-notification & sync queue).
 * Always safe, offline-first, and guaranteed not to throw or block execution.
 */
export function triggerMomentJoy({
  patient,
  actionType,
  title,
  detail,
  praiseText,
  lang = 'en',
  metadata,
  addToSyncQueue,
  isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true,
}: TriggerMomentJoyOptions): {
  event: MomentJoyEvent;
  notification: ActivityNotification;
  coinsAwarded: number;
  coinState: PatientCoinState;
} {
  const timestamp = new Date().toISOString();
  let patientId = patient?.id;
  if (!patientId && typeof localStorage !== 'undefined') {
    patientId = localStorage.getItem('sahaaya_active_patient_id') || undefined;
  }
  if (!patientId && typeof localStorage !== 'undefined') {
    const cachedKey = Object.keys(localStorage).find((k) => k.startsWith('sahaaya_cache_') && k.endsWith('_patient'));
    if (cachedKey) {
      patientId = cachedKey.replace('sahaaya_cache_', '').replace('_patient', '');
    }
  }
  patientId = patientId || 'default_patient';

  const elderName = patient?.name ? patient.name.split(' ')[0] : 'Maya';

  // ------------------------------------------------------------
  // LAYER 1: Immediate Patient Feedback (Coins & Voice Praise)
  // ------------------------------------------------------------
  let rewardVoiceUsed = false;
  let coinsAwarded = COIN_REWARDS[actionType] || 5;
  let coinState = getPatientCoinState(patientId);

  try {
    // 1. Increment local coins immediately in local state
    const coinRes = awardMomentJoyCoins(patientId, actionType);
    coinsAwarded = coinRes.coinsAwarded;
    coinState = coinRes.newState;

    // 2. Play gentle audio chime
    playSuccessChime();

    // 3. Play family voice prompt or fallback TTS praise
    const fallbackMessage = praiseText || generateDefaultPraise(actionType, elderName, title, lang);
    const audioPrompt = playPersonalizedPrompt({
      patient,
      trigger: 'reward',
      fallbackText: fallbackMessage,
      lang,
    });
    rewardVoiceUsed = audioPrompt.isCustomAudio;
  } catch (err) {
    console.warn('[MomentJoy Layer 1] Non-fatal reward trigger warning:', err);
  }

  // 4. Create MomentJoy Event & persist locally
  const event: MomentJoyEvent = {
    id: `mj_evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    patientId,
    patientName: patient?.name || elderName,
    actionType,
    title,
    description: detail,
    timestamp,
    rewardVoiceUsed,
    coinsAwarded,
    synced: isOnline,
    metadata,
  };

  try {
    const existingEvents = getMomentJoyHistory();
    const updatedEvents = [event, ...existingEvents.filter((e) => e.id !== event.id)].slice(0, MAX_STORED_ITEMS);
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updatedEvents));
  } catch (err) {
    console.warn('[MomentJoy Layer 1] Failed to persist event history:', err);
  }

  // ------------------------------------------------------------
  // LAYER 2: Caregiver Micro-Notification (Live / Offline Queued)
  // ------------------------------------------------------------
  const notification: ActivityNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    patientId,
    patientName: patient?.name || elderName,
    actionType,
    title,
    message: generateCaregiverMessage(elderName, actionType, title, coinsAwarded),
    timestamp,
    status: isOnline ? 'synced' : 'queued_offline',
    iconEmoji: getIconForAction(actionType),
  };

  try {
    const existingNotifs = getActivityNotifications();
    const updatedNotifs = [notification, ...existingNotifs.filter((n) => n.id !== notification.id)].slice(0, MAX_STORED_ITEMS);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifs));
  } catch (err) {
    console.warn('[MomentJoy Layer 2] Failed to persist notification:', err);
  }

  // Enqueue to offline sync queue if callback provided
  if (addToSyncQueue) {
    try {
      addToSyncQueue({
        patientId,
        actionType: 'addActivityNotification',
        payload: {
          id: notification.id,
          actionType: notification.actionType,
          title: notification.title,
          message: notification.message,
          timestamp: notification.timestamp,
          coinsAwarded,
        },
      });
    } catch (err) {
      console.warn('[MomentJoy Layer 2] Failed to enqueue sync item:', err);
    }
  }

  // Notify any active UI listeners in-process
  listeners.forEach((listener) => {
    try {
      listener(event, notification, coinState);
    } catch {
      /* ignore */
    }
  });

  // Also dispatch window custom event for decoupled reactive components & coin animation
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('sahaaya:momentjoy:event', {
          detail: { event, notification, coinsAwarded, coinState },
        })
      );
    } catch {
      /* ignore */
    }
  }

  return { event, notification, coinsAwarded, coinState };
}
