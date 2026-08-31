import type { ReactNode } from 'react';
import { useState } from 'react';
import { ArrowLeft, Flame, Pause, Play, RotateCcw } from 'lucide-react';
import { voiceService } from '../../services/voice/VoiceService';
import { useTranslation } from '../../i18n/useTranslation';
import { ElderlyNav } from '../ElderlyNav/ElderlyNav';
import type { GameDefinition } from '../../games/types';
import type { Difficulty } from '../../types';

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: 'var(--color-success)',
  medium: 'var(--color-accent)',
  challenging: 'var(--color-danger)',
};

interface GameShellProps {
  gameDefinition: GameDefinition;
  difficultyLabel: string;
  /** Drives the difficulty pill's color — falls back to the accent color if omitted. */
  difficulty?: Difficulty;
  /** e.g. "Activity 2 today" — open-ended, since Today's Activity isn't a fixed-length curriculum. */
  progressLabel: string;
  /** Consecutive recent results at ≥70% accuracy — renders a small streak chip when ≥2. Optional/additive. */
  streakCount?: number;
  onExit: () => void;
  onRestart: () => void;
  children: ReactNode;
}

/**
 * The one chrome every activity renders inside — back/exit, progress,
 * title, pause, and restart. Each game still owns its own instruction text
 * and voice narration internally (via QuestionNarrator), so this shell
 * never duplicates that; "Pause" here is a separate, coarser "I need a
 * moment" control that also silences any in-progress narration, layered on
 * top of the game's own Hear Again/Pause/Stop voice controls rather than
 * replacing them.
 */
export function GameShell({
  gameDefinition, difficultyLabel, difficulty, progressLabel, streakCount, onExit, onRestart, children,
}: GameShellProps) {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const difficultyColor = difficulty ? DIFFICULTY_COLOR[difficulty] : 'var(--color-accent)';

  const togglePause = () => {
    if (!paused) {
      voiceService.stop();
      setPaused(true);
    } else {
      setPaused(false);
    }
  };

  return (
    <div className="elderly-layout" style={{ paddingBottom: 90 }}>
      <div className="game-shell__header">
        <button className="btn btn--ghost btn--sm" onClick={onExit} aria-label={t('game.exit')} style={{ padding: 8, color: 'white' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="game-shell__title">
            {gameDefinition.emoji} {gameDefinition.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              {progressLabel}
            </span>
            {!!streakCount && streakCount >= 2 && (
              <span className="game-shell__streak-chip">
                <Flame size={12} /> {streakCount} in a row
              </span>
            )}
          </div>
        </div>
        <span className="game-shell__difficulty-pill" style={{ background: difficultyColor }}>
          {difficultyLabel}
        </span>
      </div>

      <div style={{ padding: 20, position: 'relative' }}>
        {children}

        {paused && (
          <div className="game-shell__pause-overlay">
            <div className="game-shell__pause-card animate-bounce-in">
              <div style={{ fontSize: 40, marginBottom: 8 }}>⏸</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Paused</div>
              <button className="btn btn--primary" onClick={togglePause} style={{ height: 52, fontSize: 16, borderRadius: 14, gap: 8 }}>
                <Play size={18} /> {t('game.continue_playing')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className="btn btn--outline btn--sm" onClick={togglePause} style={{ gap: 6 }}>
          {paused ? <Play size={16} /> : <Pause size={16} />} {paused ? t('game.continue_playing') : t('game.pause')}
        </button>
        <button className="btn btn--outline btn--sm" onClick={onRestart} style={{ gap: 6 }}>
          <RotateCcw size={16} /> {t('game.restart')}
        </button>
      </div>

      <ElderlyNav />
    </div>
  );
}
