import type { CognitiveSession } from '../types';
import type { CognitiveGameResult } from './types';

/**
 * Reduces the engine's rich CognitiveGameResult down to exactly the shape
 * addSession() already expects — so every game flows through the existing,
 * already-tested pipeline (adaptive engine, cognitive profile, caregiver
 * dashboard, analytics, alerts) with zero backend changes.
 */
export function toSessionPayload(result: CognitiveGameResult): Omit<CognitiveSession, 'id' | 'patientId' | 'timestamp'> {
  return {
    gameType: result.gameId,
    difficulty: result.difficulty,
    score: result.score,
    accuracy: result.accuracy,
    responseTime: result.responseTime,
    mistakes: result.mistakes,
    completed: result.completionRate >= 1,
    domain: result.domain,
  };
}
