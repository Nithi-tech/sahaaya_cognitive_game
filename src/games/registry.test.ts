import { describe, it, expect } from 'vitest';
import { GAME_REGISTRY, getGameDefinition } from './registry';
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
