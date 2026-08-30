// ============================================================
// Cognitive Activity Engine — shared contracts every game implements.
// ============================================================
//
// Deliberately NOT a new backend data model: CognitiveGameResult is a richer
// in-memory shape produced by the game shell (adds replay/assistance/timing
// bookkeeping the shell itself owns), which then gets reduced to the
// existing CognitiveSession shape for persistence — see
// src/games/resultMapping.ts. That keeps every game flowing through the
// already-working, already-tested addSession()/adaptive-engine/analytics/
// alerts pipeline instead of standing up a parallel one.

import type { ComponentType } from 'react';
import type { CognitiveDomain, Difficulty, GameType, Memory } from '../types';

/** UI grouping only — never surfaced as a medical/diagnostic label. "Gentle Focus" stands in for anything ADHD-adjacent. */
export type GameCategory = 'MEMORY' | 'FOCUS' | 'REACTION' | 'PATTERN' | 'ROUTINE' | 'GENTLE' | 'ADVANCED' | 'CULTURAL';

/** The props every game component receives — unchanged from the original 6 games, so none of them needed touching. */
export interface GameComponentProps {
  difficulty: Difficulty;
  onComplete: (accuracy: number, mistakes: number, responseTime?: number) => void;
  /** Only games that personalize with family content (e.g. Family & Faces) read this — the rest just ignore it. Required (not optional) here so a component that *does* require it, like FamilyFacesGame, type-checks against this shared contract. */
  memories: Memory[];
}

export interface GameDefinition {
  id: GameType;
  name: string;
  category: GameCategory;
  cognitiveDomains: CognitiveDomain[];
  difficultyLevels: Difficulty[];
  /** Typical minutes to complete one round at "easy". */
  estimatedDuration: number;
  elderlyFriendly: boolean;
  voiceSupported: boolean;
  offlineSupported: boolean;
  culturalContentSupported: boolean;
  emoji: string;
  /** One short, plain-language sentence — what the caregiver/HCW sees, and the basis for voice instruction. */
  description: string;
  component: ComponentType<GameComponentProps>;
}

/** The rich result the shell assembles around every game's onComplete call. */
export interface CognitiveGameResult {
  patientId: string;
  gameId: GameType;
  domain: CognitiveDomain;
  difficulty: Difficulty;
  score: number;
  accuracy: number;
  responseTime: number;
  mistakes: number;
  completionRate: number;
  replayCount: number;
  startedAt: string;
  completedAt: string;
  assistanceUsed: boolean;
}
