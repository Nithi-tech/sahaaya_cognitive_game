import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';
import { GameShell } from '../../../components/GameShell/GameShell';
import { GameResultScreen } from '../../../components/GameShell/GameResultScreen';
import { useApp } from '../../../store/AppContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { generateRecommendation } from '../../../engines/adaptiveDifficulty';
import { GAME_REGISTRY } from '../../../games/registry';
import { pickTodaysGame } from '../../../games/recommend';
import { useGameSession } from '../../../hooks/useGameSession';
import type { CognitiveGameResult } from '../../../games/types';
import type { AdaptiveRecommendation } from '../../../types';
import { ArrowLeft, Volume2, Sparkles } from 'lucide-react';

type PageScreen = 'today' | 'recommendation';

export default function ElderlyActivities() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cognitiveProfile, memories, sessions } = useApp();

  const familyMemoryCount = useMemo(() => memories.filter((m) => m.category === 'family' && m.relationship).length, [memories]);
  const availableGames = useMemo(
    () => GAME_REGISTRY.filter((g) => g.id !== 'family_faces' || familyMemoryCount >= 2),
    [familyMemoryCount],
  );

  const [pageScreen, setPageScreen] = useState<PageScreen>('today');
  const [gameResults, setGameResults] = useState<CognitiveGameResult[]>([]);
  const [seededToday, setSeededToday] = useState(false);
  const [recommendation, setRecommendation] = useState<AdaptiveRecommendation | null>(null);

  const session = useGameSession((result) => setGameResults((prev) => [...prev, result]));

  // Today's already-played results start empty every remount even though
  // they were already saved server-side — seed from real sessions once so a
  // recommendation right after opening the app isn't blind to today's play.
  useEffect(() => {
    if (seededToday) return;
    const today = new Date().toISOString().split('T')[0];
    const todaysSessions = sessions.filter((s) => s.timestamp.startsWith(today));
    if (todaysSessions.length === 0) { setSeededToday(true); return; }
    setGameResults(
      todaysSessions.map((s): CognitiveGameResult => ({
        patientId: s.patientId,
        gameId: s.gameType,
        domain: s.domain,
        difficulty: s.difficulty,
        score: s.score,
        accuracy: s.accuracy,
        responseTime: s.responseTime,
        mistakes: s.mistakes,
        completionRate: s.completed ? 1 : 0,
        replayCount: 0,
        startedAt: s.timestamp,
        completedAt: s.timestamp,
        assistanceUsed: false,
      })),
    );
    setSeededToday(true);
  }, [sessions, seededToday]);

  // Recomputed on every render that depends on it — always reflects the
  // most recently completed activity, so "Today's Activity" never feels
  // stuck recommending something just played.
  const todaysRecommendation = useMemo(() => {
    const domainScores = {
      memory: cognitiveProfile.memoryScore,
      attention: cognitiveProfile.attentionScore,
      recognition: cognitiveProfile.recognitionScore,
      pattern: cognitiveProfile.patternScore,
      routine: cognitiveProfile.routineScore,
    };
    const recentDomains = [...gameResults].reverse().map((r) => r.domain).concat(sessions.slice(0, 3).map((s) => s.domain));
    const lastAccuracy = gameResults[gameResults.length - 1]?.accuracy ?? sessions[0]?.accuracy ?? 75;
    return generateRecommendation(domainScores, recentDomains, lastAccuracy);
  }, [cognitiveProfile, gameResults, sessions]);

  const todaysPick = useMemo(() => {
    const recentGameIds = [...gameResults].reverse().map((r) => r.gameId).concat(sessions.slice(0, 3).map((s) => s.gameType));
    return pickTodaysGame(todaysRecommendation.nextDomain, recentGameIds, availableGames);
  }, [todaysRecommendation, gameResults, sessions, availableGames]);

  const handleFinishForToday = () => {
    const domainScores = {
      memory: cognitiveProfile.memoryScore,
      attention: cognitiveProfile.attentionScore,
      recognition: cognitiveProfile.recognitionScore,
      pattern: cognitiveProfile.patternScore,
      routine: cognitiveProfile.routineScore,
    };
    const rec = session.latestServerRecommendation ?? generateRecommendation(
      domainScores,
      gameResults.map((r) => r.domain),
      session.lastResult?.accuracy ?? 75,
    );
    setRecommendation(rec);
    setPageScreen('recommendation');
  };

  const completedTodayCount = gameResults.length;

  // ============================================================
  // PLAYING / RESULT — shared across every "play a game" entry point; see
  // useGameSession.ts. Checked before this page's own screens so a game
  // started from "today" renders here regardless of pageScreen.
  // ============================================================
  if (session.screen === 'playing' && session.activeGame) {
    const Component = session.activeGame.component;
    return (
      <GameShell
        gameDefinition={session.activeGame}
        difficultyLabel={session.currentDifficulty.charAt(0).toUpperCase() + session.currentDifficulty.slice(1)}
        progressLabel={`Activity ${completedTodayCount + 1} today`}
        onExit={session.exit}
        onRestart={session.restart}
      >
        <Component
          key={`${session.activeGame.id}-${session.restartKey}`}
          difficulty={session.currentDifficulty}
          onComplete={session.handleComplete}
          memories={session.memories}
        />
      </GameShell>
    );
  }

  if (session.screen === 'result' && session.lastResult) {
    return (
      <GameResultScreen
        result={session.lastResult}
        difficultyReason={session.difficultyReason}
        primaryAction={{ label: '▶️ Next Activity', onClick: session.exit }}
        secondaryAction={{ label: 'I\'m Done for Today', onClick: handleFinishForToday }}
      />
    );
  }

  // ============================================================
  // TODAY'S ACTIVITY — the default screen. One AI-picked activity, not the
  // full list, per the product rule: don't show every game immediately.
  // ============================================================
  if (pageScreen === 'today') {
    return (
      <div className="elderly-layout" style={{ paddingBottom: 90 }}>
        <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn--ghost" onClick={() => navigate('/')} style={{ gap: 6, color: 'var(--text-secondary)', paddingLeft: 0 }}>
            <ArrowLeft size={20} /> Back
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => navigate('/voice-settings')}
            aria-label="Voice Settings"
            style={{ color: 'var(--text-secondary)', gap: 6 }}
          >
            <Volume2 size={18} /> Voice
          </button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            {t('game.today_pick')}
          </h1>
          {completedTodayCount > 0 && (
            <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
              {completedTodayCount} {completedTodayCount === 1 ? 'activity' : 'activities'} completed today · nice work
            </p>
          )}
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <div className="todays-activity-card">
            <div style={{ fontSize: 56, marginBottom: 8 }}>{todaysPick.emoji}</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{todaysPick.name}</h2>
            <p style={{ opacity: 0.9, fontSize: 15, marginBottom: 20 }}>~{todaysPick.estimatedDuration} minutes</p>
            <button
              className="btn"
              onClick={() => session.start(todaysPick)}
              style={{
                width: '100%', height: 60, fontSize: 18, fontWeight: 800, borderRadius: 16,
                background: 'white', color: 'var(--color-primary)', border: 'none',
              }}
            >
              {completedTodayCount === 0 ? '🚀 Start' : '▶️ Continue'}
            </button>
          </div>

          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16,
            background: '#F8FAFB', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--border-color)',
          }}>
            <Sparkles size={18} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: 2 }} />
            {/* .insight, not .reason — .reason embeds a raw accuracy percentage
                ("Your accuracy was 50%..."), which reads as a judgment to the
                elderly user themselves rather than useful context; that level
                of detail belongs on the caregiver dashboard, where it already
                appears appropriately. */}
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{todaysRecommendation.insight}</p>
          </div>
        </div>

        <div style={{ padding: '0 20px' }}>
          <button
            className="btn btn--outline"
            onClick={() => navigate('/games')}
            style={{ width: '100%', height: 52, fontSize: 16, borderRadius: 14, marginBottom: 10 }}
          >
            {t('game.explore')}
          </button>
          {completedTodayCount > 0 && (
            <button
              className="btn btn--ghost"
              onClick={handleFinishForToday}
              style={{ width: '100%', height: 44, fontSize: 14, color: 'var(--text-tertiary)' }}
            >
              I'm done for today
            </button>
          )}
        </div>
        <ElderlyNav />
      </div>
    );
  }

  if (pageScreen === 'recommendation' && recommendation) {
    const avgAccuracy = gameResults.length
      ? Math.round(gameResults.reduce((a, r) => a + r.accuracy, 0) / gameResults.length)
      : 0;
    return (
      <div className="elderly-layout" style={{ padding: '40px 20px 90px' }}>
        <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Great Session!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Today's average accuracy: <strong>{avgAccuracy}%</strong>
          </p>

          <div className="card" style={{ borderRadius: 20, marginBottom: 20, padding: '20px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Today's Performance</h3>
            {gameResults.map((r, i) => {
              const def = GAME_REGISTRY.find((g) => g.id === r.gameId);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: i < gameResults.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {def?.emoji ?? '🎮'} {def?.name ?? r.gameId}
                  </span>
                  <span style={{
                    fontWeight: 700, color: r.accuracy >= 80 ? 'var(--color-success)' :
                      r.accuracy >= 50 ? 'var(--color-primary)' : 'var(--color-danger)'
                  }}>{r.accuracy}%</span>
                </div>
              );
            })}
          </div>

          <div className="card card--warm" style={{ borderRadius: 20, marginBottom: 24, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              🤖 Sahaaya Recommends
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
              {recommendation.insight}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{recommendation.reason}</p>
          </div>

          <button className="btn btn--primary" onClick={() => navigate('/')} style={{ width: '100%', height: 64, fontSize: 20, borderRadius: 18, fontWeight: 800 }}>
            Back to Home
          </button>
        </div>
        <ElderlyNav />
      </div>
    );
  }

  return null;
}
