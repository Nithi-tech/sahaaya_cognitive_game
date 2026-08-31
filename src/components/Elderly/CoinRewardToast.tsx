import { useState, useEffect } from 'react';
import type { MomentJoyEvent } from '../../types';

interface ToastData {
  id: string;
  coins: number;
  title: string;
}

export function CoinRewardToast() {
  const [activeToast, setActiveToast] = useState<ToastData | null>(null);

  useEffect(() => {
    const handleMomentJoy = (e: Event) => {
      const customEvent = e as CustomEvent<{
        event: MomentJoyEvent;
        coinsAwarded?: number;
      }>;

      if (customEvent.detail) {
        const coins = customEvent.detail.coinsAwarded || customEvent.detail.event?.coinsAwarded || 5;
        const title = customEvent.detail.event?.title || 'Activity Completed';

        setActiveToast({
          id: `toast_${Date.now()}`,
          coins,
          title,
        });

        const timer = setTimeout(() => {
          setActiveToast(null);
        }, 2000);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('sahaaya:momentjoy:event', handleMomentJoy);
    return () => {
      window.removeEventListener('sahaaya:momentjoy:event', handleMomentJoy);
    };
  }, []);

  if (!activeToast) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1200,
        pointerEvents: 'none',
        animation: 'coinFloatUp 2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #FEF08A 0%, #FDE047 40%, #EAB308 100%)',
          color: '#78350F',
          borderRadius: 999,
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 12px 28px rgba(234, 179, 8, 0.45)',
          border: '2px solid #FFFFFF',
          fontSize: 16,
          fontWeight: 900,
          letterSpacing: '-0.01em',
        }}
      >
        <span style={{ fontSize: 22, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>🪙</span>
        <span>+{activeToast.coins} Coins!</span>
      </div>
      <style>{`
        @keyframes coinFloatUp {
          0% {
            opacity: 0;
            transform: translate(-50%, 20px) scale(0.85);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.05);
          }
          25% {
            transform: translate(-50%, -2px) scale(1);
          }
          75% {
            opacity: 1;
            transform: translate(-50%, -10px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -28px) scale(0.95);
          }
        }
      `}</style>
    </div>
  );
}
