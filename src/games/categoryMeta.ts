import type { CognitiveDomain } from '../types';
import type { GameCategory } from './types';

// Extracted out of ElderlyGames.tsx once ElderlyActivities.tsx needed the
// same category colors for its "why this game" tag — a single shared copy
// instead of two that can drift apart.
export const CATEGORY_ORDER: GameCategory[] = ['MEMORY', 'FOCUS', 'REACTION', 'PATTERN', 'CULTURAL', 'ROUTINE', 'GENTLE', 'ADVANCED'];

export const CATEGORY_META: Record<GameCategory, { labelKey: string; color: string; icon: string }> = {
  MEMORY: { labelKey: 'game.category.memory', color: '#E91E63', icon: '🧠' },
  FOCUS: { labelKey: 'game.category.focus', color: '#2E7D8B', icon: '🎯' },
  REACTION: { labelKey: 'game.category.reaction', color: '#E8A63A', icon: '⚡' },
  PATTERN: { labelKey: 'game.category.pattern', color: '#9C27B0', icon: '🔷' },
  CULTURAL: { labelKey: 'game.category.cultural', color: '#FF7043', icon: '🎨' },
  ROUTINE: { labelKey: 'game.category.routine', color: '#4CAF50', icon: '📅' },
  GENTLE: { labelKey: 'game.category.gentle', color: '#26A69A', icon: '🟢' },
  ADVANCED: { labelKey: 'game.category.advanced', color: '#5C6BC0', icon: '🚀' },
};

/** Same palette used for the cognitive-profile ScoreRings on the caregiver dashboard, kept consistent app-wide. */
export const DOMAIN_META: Record<CognitiveDomain, { label: string; icon: string; color: string }> = {
  memory: { label: 'Memory', icon: '🧠', color: '#E91E63' },
  attention: { label: 'Attention', icon: '🎯', color: '#2196F3' },
  recognition: { label: 'Recognition', icon: '👁️', color: '#FF9800' },
  pattern: { label: 'Pattern', icon: '🔷', color: '#9C27B0' },
  routine: { label: 'Routine', icon: '📅', color: '#4CAF50' },
};
