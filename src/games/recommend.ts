import type { GameType, CognitiveDomain } from '../types';
import { GAME_REGISTRY } from './registry';
import type { GameDefinition } from './types';

/**
 * Picks ONE game for "Today's Activity" within the adaptive engine's
 * recommended domain — preferring elderly-friendly games, and avoiding
 * whichever game was played most recently so the pick doesn't feel
 * repetitive even when the same domain is recommended two days running.
 * Falls back gracefully (domain has no games → whole registry; every
 * candidate was just played → replay is fine, better than an empty pick).
 */
export function pickTodaysGame(domain: CognitiveDomain, recentGameIds: GameType[], availableGames: GameDefinition[] = GAME_REGISTRY): GameDefinition {
  const inDomain = availableGames.filter((g) => g.cognitiveDomains.includes(domain));
  const pool = inDomain.length > 0 ? inDomain : availableGames;

  const friendly = pool.filter((g) => g.elderlyFriendly);
  const searchIn = friendly.length > 0 ? friendly : pool;

  const justPlayed = recentGameIds[0];
  const fresh = searchIn.filter((g) => g.id !== justPlayed);
  const finalPool = fresh.length > 0 ? fresh : searchIn;

  return finalPool[Math.floor(Math.random() * finalPool.length)];
}
