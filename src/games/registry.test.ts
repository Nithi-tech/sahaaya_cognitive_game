import { describe, it, expect } from 'vitest';
import { GAME_REGISTRY, getGameDefinition } from './registry';
import { pickTodaysGame } from './recommend';
import { toSessionPayload } from './resultMapping';
import type { CognitiveGameResult } from './types';

describe('game registry', () => {
  it('every game has a unique id', () => {
    const ids = GAME_REGISTRY.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every game declares at least one cognitive domain and difficulty level', () => {
    for (const g of GAME_REGISTRY) {
      expect(g.cognitiveDomains.length).toBeGreaterThan(0);
      expect(g.difficultyLevels.length).toBeGreaterThan(0);
      expect(g.component).toBeTruthy();
    }
  });

  it('getGameDefinition finds a real game and returns undefined for a bogus id', () => {
    expect(getGameDefinition('color_focus')?.name).toBe('Color Focus');
    expect(getGameDefinition('not-a-real-game')).toBeUndefined();
  });

  it('includes all five reimplemented reference games and the two new native games', () => {
    const ids = GAME_REGISTRY.map((g) => g.id);
    for (const id of ['color_focus', 'quick_response', 'number_focus', 'block_memory', 'dual_memory', 'go_no_go', 'find_the_change']) {
      expect(ids).toContain(id);
    }
  });

  it('never labels the impulse-control game as anything ADHD-adjacent', () => {
    const goNoGo = getGameDefinition('go_no_go')!;
    expect(goNoGo.name.toLowerCase()).not.toContain('adhd');
    expect(goNoGo.category).toBe('GENTLE');
  });
});

describe('pickTodaysGame', () => {
  it('prefers a game in the recommended domain over the whole registry', () => {
    const pick = pickTodaysGame('routine', []);
    expect(pick.cognitiveDomains).toContain('routine');
  });

  it('never recommends the game just played when the domain has other candidates', () => {
    // 'attention' has several candidates (Attention, Color Focus, Number
    // Focus, Quick Response, Gentle Focus), so "just played 'attention'"
    // should be excluded every single time, not just occasionally.
    const picks = Array.from({ length: 30 }, () => pickTodaysGame('attention', ['attention']).id);
    expect(picks).not.toContain('attention');
  });

  it('falls back to the available pool when none of it matches the recommended domain', () => {
    const attentionOnly = GAME_REGISTRY.filter((g) => g.cognitiveDomains.includes('attention'));
    // Ask for 'routine' against a pool that has no routine games at all.
    const pick = pickTodaysGame('routine', [], attentionOnly);
    expect(attentionOnly.map((g) => g.id)).toContain(pick.id);
  });

  it('excludes family_faces when the caller only passes it as unavailable', () => {
    const withoutFamily = GAME_REGISTRY.filter((g) => g.id !== 'family_faces');
    const pick = pickTodaysGame('memory', [], withoutFamily);
    expect(pick.id).not.toBe('family_faces');
  });
});

describe('toSessionPayload', () => {
  it('maps every CognitiveGameResult field to the shape addSession expects', () => {
    const result: CognitiveGameResult = {
      patientId: 'patient_1',
      gameId: 'block_memory',
      domain: 'memory',
      difficulty: 'medium',
      score: 80,
      accuracy: 80,
      responseTime: 12.5,
      mistakes: 1,
      completionRate: 1,
      replayCount: 0,
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:12.500Z',
      assistanceUsed: false,
    };
    const payload = toSessionPayload(result);
    expect(payload).toEqual({
      gameType: 'block_memory',
      difficulty: 'medium',
      score: 80,
      accuracy: 80,
      responseTime: 12.5,
      mistakes: 1,
      completed: true,
      domain: 'memory',
    });
  });

  it('marks completed false when completionRate is under 1 (an interrupted attempt)', () => {
    const result: CognitiveGameResult = {
      patientId: 'p', gameId: 'go_no_go', domain: 'attention', difficulty: 'easy',
      score: 40, accuracy: 40, responseTime: 5, mistakes: 3, completionRate: 0.5,
      replayCount: 0, startedAt: '', completedAt: '', assistanceUsed: false,
    };
    expect(toSessionPayload(result).completed).toBe(false);
  });
});
