import { useCallback, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useTranslation } from '../i18n/useTranslation';
import { computeNextDifficulty } from '../engines/adaptiveDifficulty';
import { playFeedbackForAccuracy } from '../services/soundService';
import { toSessionPayload } from '../games/resultMapping';
import { api } from '../api/client';
import type { CognitiveGameResult, GameDefinition } from '../games/types';
import type { AdaptiveRecommendation, CognitiveDomain, Difficulty } from '../types';

interface AiRecommendation extends AdaptiveRecommendation {
  source: 'ai' | 'rule-based';
}

export type SessionScreen = 'idle' | 'playing' | 'result';

/**
 * Owns the one piece of logic every "play a game" entry point in the app
 * needs — launch, adaptive difficulty on completion, persistence via the
 * existing addSession pipeline, restart/exit. Extracted out of
 * ElderlyActivities.tsx (which had this inline) once a second consumer
 * (the Games library hub) needed the exact same behavior — duplicating it
 * would mean a future fix (like the go_no_go display bug found last pass)
 * has to be made twice and can silently drift out of sync between entry
 * points.
 */
export function useGameSession(onResult?: (result: CognitiveGameResult) => void) {
  const { cognitiveProfile, addSession, memories, currentPatient } = useApp();
  const { t: translate } = useTranslation();

  const [screen, setScreen] = useState<SessionScreen>('idle');
  const [activeGame, setActiveGame] = useState<GameDefinition | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('easy');
  const [restartKey, setRestartKey] = useState(0);
  const [gameStartedAt, setGameStartedAt] = useState(Date.now());
  const [lastResult, setLastResult] = useState<CognitiveGameResult | null>(null);
  const [difficultyReason, setDifficultyReason] = useState('');
  const [latestServerRecommendation, setLatestServerRecommendation] = useState<AdaptiveRecommendation | null>(null);
  const [recentDomains, setRecentDomains] = useState<CognitiveDomain[]>([]);

  // Difficulty is deliberately NOT reset here — it's one adapting value that
  // carries across every game played in this hook's lifetime (matching the
  // original ElderlyActivities behavior), not a fresh pick per game.
  const start = useCallback((game: GameDefinition) => {
    setActiveGame(game);
    setRestartKey(0);
    setGameStartedAt(Date.now());
    setScreen('playing');
  }, []);

  const exit = useCallback(() => setScreen('idle'), []);
  const restart = useCallback(() => {
    setRestartKey((p) => p + 1);
    setGameStartedAt(Date.now());
  }, []);

  const handleComplete = useCallback((accuracy: number, mistakes: number, responseTime?: number) => {
    if (!activeGame) return;
    const now = new Date().toISOString();
    const rt = responseTime ?? (Date.now() - gameStartedAt) / 1000;
    const domain = activeGame.cognitiveDomains[0];

    const result: CognitiveGameResult = {
      patientId: '',
      gameId: activeGame.id,
      domain,
      difficulty: currentDifficulty,
      score: accuracy,
      accuracy,
      responseTime: rt,
      mistakes,
      completionRate: 1,
      replayCount: restartKey,
      startedAt: new Date(gameStartedAt).toISOString(),
      completedAt: now,
      assistanceUsed: false,
    };
    setLastResult(result);
    setRecentDomains((prev) => [...prev, domain]);
    playFeedbackForAccuracy(accuracy);
    onResult?.(result);

    const nextDiff = computeNextDifficulty({
      accuracy,
      responseTime: rt,
      mistakes,
      completionRate: 1,
      currentDifficulty,
      domain,
      recentDomains,
    });

    const reason = nextDiff !== currentDifficulty
      ? nextDiff === 'easy'
        ? `🤗 ${translate('game.gentle_mode_message')}`
        : `🚀 Great work! Increasing the challenge a little — accuracy was ${accuracy}%.`
      : `✅ Keeping the same level for now — accuracy was ${accuracy}%.`;
    setDifficultyReason(reason);

    addSession(toSessionPayload(result))
      .then((rec) => { if (rec) setLatestServerRecommendation(rec); })
      .then(() => {
        // Soft, non-blocking upgrade: try Groq for a better-reasoned "AI
        // Adjustment" message. Never awaited, never shown loading — the
        // canned reason set above already covers the instant case, and
        // this silently replaces it in place if it resolves in time
        // (typically well within how long a user reads the result screen).
        // Zero-config (no Groq key) or offline: this simply never resolves
        // with source 'ai', so nothing changes.
        if (!currentPatient) return;
        api.post<AiRecommendation>(`/ai/recommend/${currentPatient.id}`)
          .then((aiRec) => {
            if (aiRec.source === 'ai') setDifficultyReason(aiRec.reason);
          })
          .catch(() => { /* offline or AI unavailable — canned reason stands */ });
      })
      .catch(() => { /* addSession's own offline fallback already applied locally */ });

    setCurrentDifficulty(nextDiff);
    setScreen('result');
  }, [activeGame, currentDifficulty, gameStartedAt, restartKey, recentDomains, addSession, translate, onResult, currentPatient]);

  return {
    screen,
    activeGame,
    currentDifficulty,
    restartKey,
    lastResult,
    difficultyReason,
    latestServerRecommendation,
    memories,
    cognitiveProfile,
    start,
    exit,
    restart,
    handleComplete,
  };
}
