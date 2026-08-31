import type { ReactNode } from 'react';
import { useState } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';
import { voiceService } from '../../services/voice/VoiceService';
import { useTranslation } from '../../i18n/useTranslation';
import { ElderlyNav } from '../ElderlyNav/ElderlyNav';
import type { GameDefinition } from '../../games/types';

interface GameShellProps {
  gameDefinition: GameDefinition;
  difficultyLabel: string;
  /** e.g. "Activity 2 today" — open-ended, since Today's Activity isn't a fixed-length curriculum. */
  progressLabel: string;
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
export function GameShell({ gameDefinition, difficultyLabel, progressLabel, onExit, onRestart, children }: GameShellProps) {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);

  const togglePause = () => {
    if (!paused) {
      voiceService.stop();
      setPaused(true);
    } else {
      setPaused(false);
    }
  };

  return (
    <div className="elderly-layout" style={{ paddingBottom: 90, minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Elder-Friendly Game Header */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '2px solid #F1F5F9',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      }}>
        <button
          onClick={onExit}
          aria-label={t('game.exit')}
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            border: '2px solid #E2E8F0',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1E293B',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          }}
        >
          <ArrowLeft size={22} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 24 }}>{gameDefinition.emoji}</span>
            <span>{gameDefinition.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#E0F2FE',
              color: '#0369A1',
              padding: '2px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
            }}>
              {progressLabel}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 2,
        }}>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Level
          </span>
          <span style={{
            display: 'inline-block',
            background: difficultyLabel.toLowerCase() === 'easy' ? '#DCFCE7' : difficultyLabel.toLowerCase() === 'medium' ? '#FEF3C7' : '#FEE2E2',
            color: difficultyLabel.toLowerCase() === 'easy' ? '#15803D' : difficultyLabel.toLowerCase() === 'medium' ? '#B45309' : '#B91C1C',
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
          }}>
            {difficultyLabel}
          </span>
        </div>
      </div>

      {/* Main Play Arena Card */}
      <div style={{ padding: '20px 16px', position: 'relative', maxWidth: 520, margin: '0 auto' }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 28,
          padding: '26px 20px',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)',
          border: '2px solid #E2E8F0',
          position: 'relative',
        }}>
          {children}

          {paused && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 26,
              zIndex: 10,
              padding: 24,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: '#E0F2FE',
                  color: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  margin: '0 auto 16px',
                }}>
                  ⏸
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                  Game Paused
                </div>
                <p style={{ fontSize: 15, color: '#64748B', marginBottom: 20, fontWeight: 500 }}>
                  Take your time, relax your eyes, and resume when ready!
                </p>
                <button
                  onClick={togglePause}
                  style={{
                    height: 56,
                    padding: '0 28px',
                    fontSize: 17,
                    borderRadius: 999,
                    fontWeight: 800,
                    color: 'white',
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
                  }}
                >
                  <Play size={20} fill="white" /> {t('game.continue_playing')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Senior-Friendly Bottom Pause & Restart Controls */}
      <div style={{
        padding: '0 20px 24px',
        display: 'flex',
        gap: 12,
        justifyContent: 'center',
        maxWidth: 420,
        margin: '0 auto',
      }}>
        <button
          onClick={togglePause}
          style={{
            flex: 1,
            height: 48,
            borderRadius: 999,
            border: '2px solid #CBD5E1',
            background: '#FFFFFF',
            color: '#334155',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          {paused ? <Play size={17} /> : <Pause size={17} />}
          <span>{paused ? t('game.continue_playing') : t('game.pause')}</span>
        </button>

        <button
          onClick={onRestart}
          style={{
            flex: 1,
            height: 48,
            borderRadius: 999,
            border: '2px solid #CBD5E1',
            background: '#FFFFFF',
            color: '#334155',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <RotateCcw size={17} />
          <span>{t('game.restart')}</span>
        </button>
      </div>

      <ElderlyNav />
    </div>
  );
}
