import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  triggerMomentJoy,
  getMomentJoyHistory,
  getActivityNotifications,
  getPatientCoinState,
  redeemWeeklyCoins,
} from './momentJoyService';
import { generateWeeklyNarrativeSummary } from './weeklyNarrativeEngine';
import type { PatientProfile, CognitiveSession, Reminder, DailyActivity } from '../../types';

// Mock audio / soundService / personalizedAudio
vi.mock('../soundService', () => ({
  playSuccessChime: vi.fn(),
  playGentleTone: vi.fn(),
}));

vi.mock('../voice/personalizedAudio', () => ({
  playPersonalizedPrompt: vi.fn(({ patient }) => {
    const hasCustom = Boolean(patient?.preferences?.onboarding?.people?.people?.[0]?.audioClips?.reward);
    return {
      isCustomAudio: hasCustom,
      stop: vi.fn(),
    };
  }),
}));

const mockPatientWithVoice: PatientProfile = {
  id: 'patient_maya_1',
  userId: 'user_maya_1',
  name: 'Maya Devi',
  age: 72,
  language: 'en',
  region: 'Assam',
  caregiverId: 'caregiver_1',
  caregiverName: 'Ananya',
  createdAt: '2026-01-01T00:00:00Z',
  onboardingComplete: true,
  preferences: {
    preferredLanguage: 'en',
    preferredActivityTime: '10:00',
    favoriteCategory: 'family',
    favoriteContent: 'Family garden memories',
    difficulty: 'adaptive',
    voiceEnabled: true,
    onboarding: {
      people: {
        people: [
          {
            name: 'Ananya',
            callsBy: 'Maa',
            relationship: 'Daughter',
            audioClips: {
              reward: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
            },
          },
        ],
      },
    },
  },
};

const mockPatientWithoutVoice: PatientProfile = {
  id: 'patient_ganga_2',
  userId: 'user_ganga_2',
  name: 'Ganga Sharma',
  age: 68,
  language: 'en',
  region: 'Assam',
  caregiverId: 'caregiver_2',
  caregiverName: 'Ravi',
  createdAt: '2026-01-01T00:00:00Z',
  onboardingComplete: true,
  preferences: {
    preferredLanguage: 'en',
    preferredActivityTime: '16:00',
    favoriteCategory: 'favorites',
    favoriteContent: 'Mango',
    difficulty: 'easy',
    voiceEnabled: true,
  },
};

describe('MomentJoy Architecture Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ============================================================
  // LAYER 1: Immediate Patient Feedback (Coins & Voice, Offline)
  // ============================================================
  describe('Layer 1: Immediate Patient Feedback', () => {
    it('fires immediately with personalized voice clip and awards 10 coins for a game', () => {
      const result = triggerMomentJoy({
        patient: mockPatientWithVoice,
        actionType: 'game',
        title: 'Memory Match',
        praiseText: 'Super job Maya!',
        isOnline: true,
      });

      expect(result.event).toBeDefined();
      expect(result.event.rewardVoiceUsed).toBe(true);
      expect(result.event.coinsAwarded).toBe(10);
      expect(result.coinsAwarded).toBe(10);
      expect(result.coinState.currentWeekCoins).toBe(10);

      // Verify stored in local history & coin state
      const history = getMomentJoyHistory('patient_maya_1');
      expect(history.length).toBe(1);
      expect(history[0].title).toBe('Memory Match');
      expect(history[0].coinsAwarded).toBe(10);

      const coinState = getPatientCoinState('patient_maya_1');
      expect(coinState.currentWeekCoins).toBe(10);
      expect(coinState.totalAllTimeCoins).toBe(10);
    });

    it('awards correct coin amounts for medicine (5), hydration (3), and routine (5)', () => {
      // 1. Medicine -> 5 coins
      const medRes = triggerMomentJoy({
        patient: mockPatientWithoutVoice,
        actionType: 'medicine',
        title: 'Morning Tablet',
        isOnline: false,
      });
      expect(medRes.coinsAwarded).toBe(5);
      expect(medRes.coinState.currentWeekCoins).toBe(5);

      // 2. Hydration -> 3 coins (total: 8)
      const hydRes = triggerMomentJoy({
        patient: mockPatientWithoutVoice,
        actionType: 'hydration',
        title: 'Water Glass',
        isOnline: false,
      });
      expect(hydRes.coinsAwarded).toBe(3);
      expect(hydRes.coinState.currentWeekCoins).toBe(8);

      // 3. Routine -> 5 coins (total: 13)
      const routRes = triggerMomentJoy({
        patient: mockPatientWithoutVoice,
        actionType: 'routine',
        title: 'Morning Walk',
        isOnline: false,
      });
      expect(routRes.coinsAwarded).toBe(5);
      expect(routRes.coinState.currentWeekCoins).toBe(13);

      // Verify persistent local storage state
      const finalCoinState = getPatientCoinState('patient_ganga_2');
      expect(finalCoinState.currentWeekCoins).toBe(13);
      expect(finalCoinState.totalAllTimeCoins).toBe(13);
    });

    it('gracefully handles null patient without crashing', () => {
      expect(() => {
        triggerMomentJoy({
          patient: null,
          actionType: 'routine',
          title: 'Morning Walk',
          isOnline: false,
        });
      }).not.toThrow();

      const history = getMomentJoyHistory();
      expect(history.length).toBe(1);
      expect(history[0].patientName).toBe('Maya');
    });
  });

  // ============================================================
  // LAYER 2: Caregiver Micro-Notification (Live / Offline Queued)
  // ============================================================
  describe('Layer 2: Caregiver Micro-Notification', () => {
    it('generates notification with correct status and coin tag when online', () => {
      const addToSyncQueue = vi.fn();

      const { notification } = triggerMomentJoy({
        patient: mockPatientWithVoice,
        actionType: 'game',
        title: 'Pattern Game',
        isOnline: true,
        addToSyncQueue,
      });

      expect(notification.status).toBe('synced');
      expect(notification.message).toContain('Maya completed Pattern Game (+10 🪙)');
      expect(notification.iconEmoji).toBe('🎮');
      expect(addToSyncQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'addActivityNotification',
          patientId: 'patient_maya_1',
          payload: expect.objectContaining({
            coinsAwarded: 10,
          }),
        })
      );

      const notifs = getActivityNotifications('patient_maya_1');
      expect(notifs.length).toBe(1);
      expect(notifs[0].status).toBe('synced');
    });

    it('queues notification with "queued_offline" status when offline without throwing', () => {
      const addToSyncQueue = vi.fn();

      const { notification } = triggerMomentJoy({
        patient: mockPatientWithoutVoice,
        actionType: 'hydration',
        title: 'Fresh Water',
        isOnline: false,
        addToSyncQueue,
      });

      expect(notification.status).toBe('queued_offline');
      expect(notification.iconEmoji).toBe('💧');
      expect(addToSyncQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'addActivityNotification',
          patientId: 'patient_ganga_2',
        })
      );

      const notifs = getActivityNotifications('patient_ganga_2');
      expect(notifs.length).toBe(1);
      expect(notifs[0].status).toBe('queued_offline');
    });
  });

  // ============================================================
  // LAYER 3: Weekly Family Narrative Summary & Coin Redemption
  // ============================================================
  describe('Layer 3: Weekly Family Narrative Summary & Coin Redemption', () => {
    const d1 = new Date();
    d1.setDate(d1.getDate() - 2);
    d1.setHours(9, 30, 0, 0);

    const d2 = new Date();
    d2.setDate(d2.getDate() - 3);
    d2.setHours(10, 15, 0, 0);

    const mockSessions: CognitiveSession[] = [
      {
        id: 's1',
        patientId: 'patient_maya_1',
        gameType: 'memory_match',
        difficulty: 'medium',
        score: 95,
        accuracy: 95,
        responseTime: 4.2,
        mistakes: 0,
        completed: true,
        domain: 'memory',
        timestamp: d1.toISOString(),
      },
      {
        id: 's2',
        patientId: 'patient_maya_1',
        gameType: 'object_recognition',
        difficulty: 'medium',
        score: 90,
        accuracy: 90,
        responseTime: 3.8,
        mistakes: 1,
        completed: true,
        domain: 'recognition',
        timestamp: d2.toISOString(),
      },
    ];

    const mockReminders: Reminder[] = [
      { id: 'r1', patientId: 'patient_maya_1', title: 'Morning Tablet', description: 'Take 1 with water', type: 'medicine', time: '08:00', status: 'completed' },
      { id: 'r2', patientId: 'patient_maya_1', title: 'Evening Tablet', description: 'Take 1 with food', type: 'medicine', time: '20:00', status: 'completed' },
      { id: 'r3', patientId: 'patient_maya_1', title: 'Water', description: '1 glass', type: 'hydration', time: '11:00', status: 'completed' },
    ];

    const mockActivities: DailyActivity[] = [
      { id: 'a1', patientId: 'patient_maya_1', activity: 'Morning Prayer', emoji: '🙏', scheduledTime: '07:30', date: '2026-08-30', status: 'completed' },
      { id: 'a2', patientId: 'patient_maya_1', activity: 'Evening Walk', emoji: '🚶', scheduledTime: '17:30', date: '2026-08-30', status: 'completed' },
    ];

    it('aggregates local session, medication, routine, and coin data into a narrative', () => {
      // Award some coins first
      triggerMomentJoy({ patient: mockPatientWithVoice, actionType: 'game', title: 'Game 1' });
      triggerMomentJoy({ patient: mockPatientWithVoice, actionType: 'medicine', title: 'Meds' });

      const summary = generateWeeklyNarrativeSummary({
        patient: mockPatientWithVoice,
        sessions: mockSessions,
        reminders: mockReminders,
        dailyActivities: mockActivities,
      });

      expect(summary.patientName).toBe('Maya Devi');
      expect(summary.gameSessionsCount).toBe(2);
      expect(summary.averageAccuracy).toBe(93); // (95 + 90) / 2 = 92.5 -> 93
      expect(summary.medicineAdherencePercent).toBe(100);
      expect(summary.coinsEarnedThisWeek).toBe(15); // 10 + 5
      expect(summary.totalAllTimeCoins).toBe(15);

      // Circadian analysis
      expect(summary.circadianPeak.timeOfDay).toBe('Morning');
      expect(summary.circadianPeak.timeRange).toBe('08:00 AM – 11:30 AM');

      // Narrative letter verification
      expect(summary.narrativeText).toContain('Dear Family');
      expect(summary.narrativeText).toContain('Maya');
      expect(summary.narrativeText).toContain('Joy Coins');
      expect(summary.engagementHighlights.length).toBeGreaterThanOrEqual(3);
    });

    it('redeems weekly coins, resets current week balance, and preserves history', () => {
      // Award 25 coins
      triggerMomentJoy({ patient: mockPatientWithVoice, actionType: 'game', title: 'G1' }); // +10
      triggerMomentJoy({ patient: mockPatientWithVoice, actionType: 'game', title: 'G2' }); // +10
      triggerMomentJoy({ patient: mockPatientWithVoice, actionType: 'medicine', title: 'M1' }); // +5

      const stateBefore = getPatientCoinState('patient_maya_1');
      expect(stateBefore.currentWeekCoins).toBe(25);

      // Caregiver marks as redeemed
      const { redeemedRecord, newState } = redeemWeeklyCoins('patient_maya_1', 'Evening Mango Kulfi Treat');

      expect(redeemedRecord.coinsEarned).toBe(25);
      expect(redeemedRecord.rewardNote).toBe('Evening Mango Kulfi Treat');
      expect(newState.currentWeekCoins).toBe(0); // Reset for new week
      expect(newState.totalAllTimeCoins).toBe(25); // All time preserved
      expect(newState.history.length).toBe(1);
      expect(newState.history[0].rewardNote).toBe('Evening Mango Kulfi Treat');

      // Check subsequent summary reflects 0 current week coins but keeps history
      const summaryAfter = generateWeeklyNarrativeSummary({
        patient: mockPatientWithVoice,
        sessions: mockSessions,
        reminders: mockReminders,
        dailyActivities: mockActivities,
      });
      expect(summaryAfter.coinsEarnedThisWeek).toBe(0);
      expect(summaryAfter.totalAllTimeCoins).toBe(25);
      expect(summaryAfter.coinRedemptionHistory.length).toBe(1);
    });
  });
});
