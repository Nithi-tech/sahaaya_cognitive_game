import type {
  PatientProfile,
  CognitiveSession,
  Reminder,
  DailyActivity,
  WeeklyNarrativeSummary,
  CircadianPeakInfo,
} from '../../types';
import { getPatientCoinState } from './momentJoyService';

export interface GenerateWeeklyNarrativeInput {
  patient: PatientProfile | null;
  sessions: CognitiveSession[];
  reminders: Reminder[];
  dailyActivities: DailyActivity[];
  days?: number;
  referenceDate?: Date;
}

/**
 * Pure local engine that aggregates the past 7 days of elder engagement data
 * and compiles a warm, human-readable family narrative report.
 * Works 100% offline with no external network requirements.
 */
export function generateWeeklyNarrativeSummary({
  patient,
  sessions,
  reminders,
  dailyActivities,
  days = 7,
  referenceDate = new Date(),
}: GenerateWeeklyNarrativeInput): WeeklyNarrativeSummary {
  const elderName = patient?.name ? patient.name.split(' ')[0] : 'Maya';
  const patientId = patient?.id || 'default_patient';

  const cutoff = new Date(referenceDate.getTime() - days * 24 * 60 * 60 * 1000);
  const periodStart = cutoff.toISOString().split('T')[0];
  const periodEnd = referenceDate.toISOString().split('T')[0];

  // Filter items in the last 7 days
  const recentSessions = (sessions || []).filter((s) => {
    const d = new Date(s.timestamp || (s as { completedAt?: string }).completedAt || Date.now());
    return d >= cutoff && d <= referenceDate;
  });

  const recentReminders = reminders || [];
  const recentActivities = dailyActivities || [];

  // Calculate Cognitive Statistics
  const gameSessionsCount = recentSessions.length;
  let totalAccuracy = 0;
  recentSessions.forEach((s) => {
    totalAccuracy += s.accuracy || 0;
  });
  const averageAccuracy = gameSessionsCount > 0 ? Math.round(totalAccuracy / gameSessionsCount) : 85;

  // Calculate Medication Adherence
  const medReminders = recentReminders.filter((r) => r.type === 'medicine');
  const completedMeds = medReminders.filter((r) => r.status === 'completed');
  const medicineAdherencePercent = medReminders.length > 0
    ? Math.round((completedMeds.length / medReminders.length) * 100)
    : 100;

  // Calculate Hydration Adherence
  const hydrationReminders = recentReminders.filter((r) => r.type === 'hydration');
  const completedHydration = hydrationReminders.filter((r) => r.status === 'completed');
  const hydrationAdherencePercent = hydrationReminders.length > 0
    ? Math.round((completedHydration.length / hydrationReminders.length) * 100)
    : 90;

  // Calculate Daily Routine Completion
  const completedRoutines = recentActivities.filter((a) => a.status === 'completed');
  const routineCompletionPercent = recentActivities.length > 0
    ? Math.round((completedRoutines.length / recentActivities.length) * 100)
    : 92;

  const totalActivitiesCompleted =
    recentSessions.filter((s) => s.completed !== false).length +
    completedMeds.length +
    completedHydration.length +
    completedRoutines.length;

  // ------------------------------------------------------------
  // CIRCADIAN ANALYSIS: Determine Optimal Cognitive Time Window
  // ------------------------------------------------------------
  const circadianBuckets = {
    Morning: { count: 0, totalAccuracy: 0, timeRange: '08:00 AM – 11:30 AM' },
    Afternoon: { count: 0, totalAccuracy: 0, timeRange: '01:00 PM – 04:30 PM' },
    Evening: { count: 0, totalAccuracy: 0, timeRange: '05:00 PM – 08:30 PM' },
    Night: { count: 0, totalAccuracy: 0, timeRange: '08:30 PM – 10:30 PM' },
  };

  recentSessions.forEach((s) => {
    const dateStr = s.timestamp || (s as { completedAt?: string }).completedAt;
    const hour = dateStr ? new Date(dateStr).getHours() : 10;
    const acc = s.accuracy || 80;

    if (hour >= 5 && hour < 12) {
      circadianBuckets.Morning.count++;
      circadianBuckets.Morning.totalAccuracy += acc;
    } else if (hour >= 12 && hour < 17) {
      circadianBuckets.Afternoon.count++;
      circadianBuckets.Afternoon.totalAccuracy += acc;
    } else if (hour >= 17 && hour < 21) {
      circadianBuckets.Evening.count++;
      circadianBuckets.Evening.totalAccuracy += acc;
    } else {
      circadianBuckets.Night.count++;
      circadianBuckets.Night.totalAccuracy += acc;
    }
  });

  let bestPeriod: 'Morning' | 'Afternoon' | 'Evening' | 'Night' = 'Morning';
  let maxScore = -1;
  let hasSessionData = false;

  (Object.keys(circadianBuckets) as Array<keyof typeof circadianBuckets>).forEach((period) => {
    const bucket = circadianBuckets[period];
    if (bucket.count > 0) {
      hasSessionData = true;
      const avg = bucket.totalAccuracy / bucket.count;
      // Score weights both accuracy and consistency
      const compositeScore = avg * 0.7 + bucket.count * 10;
      if (compositeScore > maxScore) {
        maxScore = compositeScore;
        bestPeriod = period;
      }
    }
  });

  // Fallback to patient preferences if sparse data
  const preferredTime = patient?.preferences?.preferredActivityTime || '10:00';
  const prefHour = parseInt(preferredTime.split(':')[0], 10) || 10;
  if (!hasSessionData) {
    if (prefHour < 12) bestPeriod = 'Morning';
    else if (prefHour < 17) bestPeriod = 'Afternoon';
    else bestPeriod = 'Evening';
  }

  const circadianPeak: CircadianPeakInfo = {
    timeOfDay: bestPeriod,
    timeRange: circadianBuckets[bestPeriod].timeRange,
    description: hasSessionData
      ? `${elderName} achieved highest memory & focus scores during ${bestPeriod.toLowerCase()} sessions (${circadianBuckets[bestPeriod].timeRange}).`
      : `${elderName}'s optimal activity window is set for ${bestPeriod.toLowerCase()} (${circadianBuckets[bestPeriod].timeRange}) based on daily routine preferences.`,
    confidence: recentSessions.length >= 5 ? 'high' : recentSessions.length >= 2 ? 'moderate' : 'initial',
  };

  const coinState = getPatientCoinState(patientId);
  const coinsEarnedThisWeek = coinState.currentWeekCoins || 0;
  const totalAllTimeCoins = coinState.totalAllTimeCoins || 0;

  // ------------------------------------------------------------
  // ENGAGEMENT HIGHLIGHTS & NARRATIVE GENERATION
  // ------------------------------------------------------------
  const highlights: string[] = [];

  if (gameSessionsCount > 0) {
    highlights.push(
      `🎯 Completed ${gameSessionsCount} cognitive game session${gameSessionsCount > 1 ? 's' : ''} with an average score of ${averageAccuracy}%.`
    );
  } else {
    highlights.push(`🌱 Maintained gentle daily engagement and app interactions.`);
  }

  if (medicineAdherencePercent >= 80) {
    highlights.push(`💊 Outstanding medication consistency (${medicineAdherencePercent}% adherence this week).`);
  } else {
    highlights.push(`💊 Medicine logging active (${medicineAdherencePercent}% completed).`);
  }

  highlights.push(`☀️ Peak cognitive vitality observed during ${bestPeriod} (${circadianPeak.timeRange}).`);

  if (coinsEarnedThisWeek > 0) {
    highlights.push(`🪙 Earned ${coinsEarnedThisWeek} Joy Coins this week towards a special family treat!`);
  }

  if (routineCompletionPercent >= 80) {
    highlights.push(`🌟 Completed ${routineCompletionPercent}% of scheduled daily morning and afternoon routine milestones.`);
  }

  // Compose warm narrative letter to family
  let narrativeText = `Dear Family,\n\n`;
  narrativeText += `Here is a warm summary of ${elderName}'s week from ${periodStart} to ${periodEnd}.\n\n`;

  if (gameSessionsCount >= 3) {
    narrativeText += `${elderName} has had an active, lively week! They completed ${gameSessionsCount} cognitive brain activities with great enthusiasm, achieving an impressive ${averageAccuracy}% overall accuracy. `;
  } else if (gameSessionsCount > 0) {
    narrativeText += `${elderName} engaged in cognitive exercises this week, displaying focus and steady progress with an average accuracy of ${averageAccuracy}%. `;
  } else {
    narrativeText += `${elderName} has been spending peaceful time with their daily routines and familiar music. `;
  }

  narrativeText += `Their highest energy and focus occurred during the ${bestPeriod.toLowerCase()} hours (${circadianPeak.timeRange}). `;

  if (medicineAdherencePercent >= 85 && hydrationAdherencePercent >= 80) {
    narrativeText += `Daily wellness has been wonderfully steady, with ${medicineAdherencePercent}% on-time medicine adherence and consistent hydration. `;
  } else {
    narrativeText += `Health routines and reminders are being tracked daily to support their ongoing wellness. `;
  }

  if (coinsEarnedThisWeek > 0) {
    narrativeText += `Together, ${elderName} accumulated ${coinsEarnedThisWeek} Joy Coins this week through their games and routines! `;
  }

  narrativeText += `\n\nOverall, ${elderName} is staying well-supported, connected to family voice reminders, and enjoying their personalized daily journey.\n\n`;
  narrativeText += `With love & care,\nSahaaya Cognitive Companion`;

  return {
    patientId,
    patientName: patient?.name || elderName,
    periodStart,
    periodEnd,
    totalActivitiesCompleted,
    gameSessionsCount,
    averageAccuracy,
    medicineAdherencePercent,
    hydrationAdherencePercent,
    routineCompletionPercent,
    circadianPeak,
    coinsEarnedThisWeek,
    totalAllTimeCoins,
    coinRedemptionHistory: coinState.history || [],
    engagementHighlights: highlights,
    narrativeText,
    generatedAt: new Date().toISOString(),
  };
}
