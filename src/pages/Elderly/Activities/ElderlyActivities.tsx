import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';
import { useApp } from '../../../store/AppContext';
import { useTranslation } from '../../../i18n/useTranslation';
import {
  computeNextDifficulty, generateRecommendation, getDomainFromGame
} from '../../../engines/adaptiveDifficulty';
import { playFeedbackForAccuracy } from '../../../services/soundService';
import type { Difficulty, GameType, CognitiveDomain } from '../../../types';
import { ArrowLeft, CheckCircle, ChevronRight, Volume2 } from 'lucide-react';
import MemoryMatchGame from './games/MemoryMatchGame';
import ObjectRecognitionGame from './games/ObjectRecognitionGame';
import AttentionGame from './games/AttentionGame';
import PatternGame from './games/PatternGame';
import RoutineRecallGame from './games/RoutineRecallGame';
import FamilyFacesGame from './games/FamilyFacesGame';

const BASE_GAME_SEQUENCE: GameType[] = [
  'memory_match', 'object_recognition', 'attention', 'pattern', 'routine_recall'
];

const GAME_INFO: Record<GameType, { emoji: string; label: string; domain: CognitiveDomain; color: string; description: string }> = {
  memory_match: { emoji: '🧩', label: 'Memory Match', domain: 'memory', color: '#E91E63', description: 'Remember familiar objects' },
  object_recognition: { emoji: '👁️', label: 'Object Recognition', domain: 'recognition', color: '#FF9800', description: 'Name what you see' },
  attention: { emoji: '🎯', label: 'Attention', domain: 'attention', color: '#2196F3', description: 'Spot the right items' },
  pattern: { emoji: '🔷', label: 'Pattern Recognition', domain: 'pattern', color: '#9C27B0', description: "What comes next?" },
  routine_recall: { emoji: '📋', label: 'Daily Routine Recall', domain: 'routine', color: '#4CAF50', description: 'Order your morning' },
  family_faces: { emoji: '👨‍👩‍👧', label: 'Family & Faces', domain: 'memory', color: '#F4511E', description: 'Recognize your loved ones' },
};

interface GameResult {
  gameType: GameType;
  accuracy: number;
  responseTime: number;
  mistakes: number;
  completed: boolean;
}

type Screen = 'select' | 'playing' | 'result' | 'recommendation' | 'complete';

export default function ElderlyActivities() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const { cognitiveProfile, addSession, memories } = useApp();

  const familyMemoryCount = useMemo(() => memories.filter((m) => m.category === 'family' && m.relationship).length, [memories]);
  const GAME_SEQUENCE = useMemo(
    () => (familyMemoryCount >= 2 ? [...BASE_GAME_SEQUENCE, 'family_faces' as GameType] : BASE_GAME_SEQUENCE),
    [familyMemoryCount],
  );

  const [screen, setScreen] = useState<Screen>('select');
  const [currentGameIdx, setCurrentGameIdx] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('easy');
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [recommendation, setRecommendation] = useState<ReturnType<typeof generateRecommendation> | null>(null);
  const [difficultyReason, setDifficultyReason] = useState('');
  const [startTime, setStartTime] = useState(Date.now());

  const currentGameType = GAME_SEQUENCE[currentGameIdx];
  const currentGameInfo = GAME_INFO[currentGameType];
  const totalGames = GAME_SEQUENCE.length;

  const handleGameComplete = useCallback((accuracy: number, mistakes: number, responseTime?: number) => {
    const rt = responseTime ?? (Date.now() - startTime) / 1000;
    const result: GameResult = {
      gameType: currentGameType,
      accuracy,
      responseTime: rt,
      mistakes,
      completed: true,
    };
    setLastResult(result);
    setGameResults((prev) => [...prev, result]);
    playFeedbackForAccuracy(accuracy);

    // Compute next difficulty
    const domain = getDomainFromGame(currentGameType);
    const nextDiff = computeNextDifficulty({
      accuracy,
      responseTime: rt,
      mistakes,
      completionRate: 1,
      currentDifficulty,
      domain,
      recentDomains: gameResults.map(r => getDomainFromGame(r.gameType)),
    });

    const reason = nextDiff !== currentDifficulty
      ? `${nextDiff === 'easy' ? '🤗 Reducing' : '🚀 Increasing'} difficulty: accuracy was ${accuracy}%.`
      : `✅ Maintaining difficulty: accuracy was ${accuracy}%.`;
    setDifficultyReason(reason);

    // Save session — the API (or the offline queue, if unreachable) recomputes
    // the cognitive profile and returns a recommendation.
    addSession({
      gameType: currentGameType,
      difficulty: currentDifficulty,
      score: accuracy,
      accuracy,
      responseTime: rt,
      mistakes,
      completed: true,
      domain,
    });

    setCurrentDifficulty(nextDiff);
    setScreen('result');
  }, [currentGameType, currentDifficulty, startTime, gameResults, addSession]);

  const handleNextGame = () => {
    if (currentGameIdx < totalGames - 1) {
      setCurrentGameIdx((prev) => prev + 1);
      setStartTime(Date.now());
      setScreen('playing');
    } else {
      // All done — show recommendation
      const domainScores = {
        memory: cognitiveProfile.memoryScore,
        attention: cognitiveProfile.attentionScore,
        recognition: cognitiveProfile.recognitionScore,
        pattern: cognitiveProfile.patternScore,
        routine: cognitiveProfile.routineScore,
      };
      const rec = generateRecommendation(
        domainScores,
        gameResults.map(r => getDomainFromGame(r.gameType)),
        lastResult?.accuracy ?? 75,
      );
      setRecommendation(rec);
      setScreen('recommendation');
    }
  };

  if (screen === 'select') {
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
            {lang === 'as' ? t('game.today_activity') : "Today's Activity"}
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{totalGames} activities to keep your mind active</p>
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {GAME_SEQUENCE.map((gt, idx) => {
            const info = GAME_INFO[gt];
            const isNext = idx === currentGameIdx;
            const isDone = gameResults.some(r => r.gameType === gt);
            return (
              <button
                key={gt}
                className="game-card-tap"
                onClick={() => {
                  setCurrentGameIdx(idx);
                  setStartTime(Date.now());
                  setScreen('playing');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px',
                  background: isDone ? 'var(--color-success-light)' : 'white',
                  border: `2px solid ${isDone ? 'var(--color-success)' : isNext ? info.color : 'var(--border-color)'}`,
                  borderRadius: 20, cursor: 'pointer',
                  boxShadow: isNext ? 'var(--shadow-md)' : 'none',
                  transition: 'all 0.2s',
                  animation: `slide-up 0.4s ease ${idx * 0.06}s both`,
                }}
              >
                <span style={{
                  fontSize: 32, width: 60, height: 60, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 16, background: `${info.color}1A`,
                }}>
                  {info.emoji}
                </span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{info.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {info.description} · {currentDifficulty}
                  </div>
                </div>
                {isDone
                  ? <CheckCircle size={24} color="var(--color-success)" />
                  : isNext
                    ? <ChevronRight size={24} color={info.color} />
                    : <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>#{idx + 1}</span>
                }
              </button>
            );
          })}
        </div>

        <div style={{ padding: '20px' }}>
          <button
            className="btn btn--primary"
            onClick={() => { setStartTime(Date.now()); setScreen('playing'); }}
            style={{ width: '100%', height: 64, fontSize: 20, borderRadius: 18, fontWeight: 800 }}
          >
            {currentGameIdx === 0 ? '🚀 Start Activities' : `▶️ Continue — Game ${currentGameIdx + 1}`}
          </button>
        </div>
        <ElderlyNav />
      </div>
    );
  }

  if (screen === 'playing') {
    return (
      <div className="elderly-layout" style={{ paddingBottom: 90 }}>
        {/* Game Header */}
        <div style={{
          background: 'white', borderBottom: '1px solid var(--border-color)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setScreen('select')}
            style={{ padding: '8px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {currentGameInfo.emoji} {currentGameInfo.label}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {GAME_SEQUENCE.map((_, i) => (
                <div key={i} style={{
                  height: 4, flex: 1, borderRadius: 2,
                  background: i < currentGameIdx ? 'var(--color-success)' :
                    i === currentGameIdx ? 'var(--color-primary)' : 'var(--border-color)',
                }} />
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>
              {lang === 'as' ? t('game.difficulty') : 'Difficulty'}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: currentDifficulty === 'easy' ? 'var(--color-success)' :
                currentDifficulty === 'medium' ? 'var(--color-accent)' : 'var(--color-danger)',
            }}>
              {currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {currentGameType === 'memory_match' && <MemoryMatchGame difficulty={currentDifficulty} onComplete={handleGameComplete} />}
          {currentGameType === 'object_recognition' && <ObjectRecognitionGame difficulty={currentDifficulty} onComplete={handleGameComplete} />}
          {currentGameType === 'attention' && <AttentionGame difficulty={currentDifficulty} onComplete={handleGameComplete} />}
          {currentGameType === 'pattern' && <PatternGame difficulty={currentDifficulty} onComplete={handleGameComplete} />}
          {currentGameType === 'routine_recall' && <RoutineRecallGame difficulty={currentDifficulty} onComplete={handleGameComplete} />}
          {currentGameType === 'family_faces' && <FamilyFacesGame difficulty={currentDifficulty} memories={memories} onComplete={handleGameComplete} />}
        </div>
        <ElderlyNav />
      </div>
    );
  }

  if (screen === 'result' && lastResult) {
    const improved = lastResult.accuracy >= 80;
    const maintained = lastResult.accuracy >= 50;
    return (
      <div className="elderly-layout" style={{ paddingBottom: 90, padding: '40px 20px' }}>
        <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {improved && (
              <div className="confetti-burst">
                {['🎉', '⭐', '🎊', '✨', '🌟', '🎈'].map((e, i) => (
                  <span key={i} className="confetti-piece" style={{ ['--i' as string]: i }}>{e}</span>
                ))}
              </div>
            )}
            <div style={{ fontSize: 80, marginBottom: 16, animation: 'bounce-in 0.5s ease' }}>
              {improved ? '🌟' : maintained ? '👍' : '💪'}
            </div>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
            {lang === 'as' ? t('game.great_work') : 'Great work!'}
          </h2>

          {/* Score Card */}
          <div className="card" style={{ borderRadius: 20, marginBottom: 20, padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)' }}>{lastResult.accuracy}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>ACCURACY</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-accent)' }}>{lastResult.mistakes}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>MISTAKES</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-success)' }}>
                  {Math.round(lastResult.responseTime)}s
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>TIME</div>
              </div>
            </div>

            {/* Difficulty adjustment */}
            <div style={{
              background: '#F8FAFB', borderRadius: 12, padding: '12px 16px',
              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                🤖 AI Adjustment
              </div>
              {difficultyReason}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              className="btn btn--primary"
              onClick={handleNextGame}
              style={{ height: 64, fontSize: 20, borderRadius: 18, fontWeight: 800 }}
            >
              {currentGameIdx < totalGames - 1 ? `Next Activity →` : 'See Recommendations'}
            </button>
            <button
              className="btn btn--outline"
              onClick={() => setScreen('select')}
              style={{ height: 52, fontSize: 16 }}
            >
              Back to Activities
            </button>
          </div>
        </div>
        <ElderlyNav />
      </div>
    );
  }

  if (screen === 'recommendation' && recommendation) {
    const avgAccuracy = Math.round(gameResults.reduce((a, r) => a + r.accuracy, 0) / gameResults.length);
    return (
      <div className="elderly-layout" style={{ paddingBottom: 90, padding: '40px 20px' }}>
        <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>All Activities Done!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Today's average accuracy: <strong>{avgAccuracy}%</strong>
          </p>

          {/* Summary */}
          <div className="card" style={{ borderRadius: 20, marginBottom: 20, padding: '20px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Today's Performance</h3>
            {gameResults.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: i < gameResults.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {GAME_INFO[r.gameType].emoji} {GAME_INFO[r.gameType].label}
                </span>
                <span style={{
                  fontWeight: 700, color: r.accuracy >= 80 ? 'var(--color-success)' :
                    r.accuracy >= 50 ? 'var(--color-primary)' : 'var(--color-danger)'
                }}>{r.accuracy}%</span>
              </div>
            ))}
          </div>

          {/* AI Recommendation */}
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
