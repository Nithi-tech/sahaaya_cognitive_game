import { useState, useEffect } from 'react';
import { getActivityNotifications, getMomentJoyHistory, subscribeToMomentJoy } from '../../services/momentJoy/momentJoyService';
import type { ActivityNotification, MomentJoyActionType } from '../../types';
import { Bell, Check, Clock, Sparkles } from 'lucide-react';

interface Props {
  patientId?: string;
  patientName?: string;
  limit?: number;
}

export function CaregiverActivityFeed({ patientId, patientName = 'Ganga', limit = 20 }: Props) {
  const [notifications, setNotifications] = useState<ActivityNotification[]>(() => {
    const list = getActivityNotifications(patientId);
    if (list.length > 0) return list;
    const hist = getMomentJoyHistory(patientId);
    return hist.map((e) => {
      const pName = e.patientName || patientName;
      return {
        id: `feed_${e.id}`,
        patientId: e.patientId,
        patientName: pName,
        actionType: e.actionType,
        title: e.title,
        message: `${pName.split(' ')[0]} completed ${e.title} (+${e.coinsAwarded || 10} 🪙) ✔`,
        timestamp: e.timestamp,
        status: 'synced' as const,
        iconEmoji: e.actionType === 'game' ? '🎮' : e.actionType === 'medicine' ? '💊' : e.actionType === 'hydration' ? '💧' : '🔄',
      };
    });
  });
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    // Initial load
    let notifs = getActivityNotifications(patientId);
    if (notifs.length === 0) {
      const hist = getMomentJoyHistory(patientId);
      if (hist.length > 0) {
        notifs = hist.map((e) => {
          const pName = e.patientName || patientName;
          return {
            id: `feed_${e.id}`,
            patientId: e.patientId,
            patientName: pName,
            actionType: e.actionType,
            title: e.title,
            message: `${pName.split(' ')[0]} completed ${e.title} (+${e.coinsAwarded || 10} 🪙) ✔`,
            timestamp: e.timestamp,
            status: 'synced' as const,
            iconEmoji: e.actionType === 'game' ? '🎮' : e.actionType === 'medicine' ? '💊' : e.actionType === 'hydration' ? '💧' : '🔄',
          };
        });
      }
    }
    setNotifications(notifs);

    // Subscribe to live in-app MomentJoy triggers
    const unsubscribe = subscribeToMomentJoy((_event, notification) => {
      if (!patientId || notification.patientId === patientId || notification.patientId === 'default_patient') {
        setNotifications((prev) => [notification, ...prev.filter((n) => n.id !== notification.id)].slice(0, 50));
      }
    });

    // Also listen for custom DOM events
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ notification: ActivityNotification }>;
      if (customEvent.detail?.notification) {
        const notif = customEvent.detail.notification;
        if (!patientId || notif.patientId === patientId || notif.patientId === 'default_patient') {
          setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)].slice(0, 50));
        }
      }
    };

    window.addEventListener('sahaaya:momentjoy:event', handleCustomEvent);
    return () => {
      unsubscribe();
      window.removeEventListener('sahaaya:momentjoy:event', handleCustomEvent);
    };
  }, [patientId]);

  const filteredNotifs = notifications
    .filter((n) => {
      if (selectedFilter === 'all') return true;
      return n.actionType === selectedFilter;
    })
    .slice(0, limit);

  const formatRelativeTime = (isoString: string): string => {
    try {
      const diffSecs = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSecs < 60) return 'Just now';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getActionColor = (type: MomentJoyActionType): { bg: string; border: string; text: string } => {
    switch (type) {
      case 'game':
        return { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' };
      case 'medicine':
        return { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' };
      case 'hydration':
        return { bg: '#ECFEFF', border: '#A5F3FC', text: '#0E7490' };
      case 'routine':
        return { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' };
      default:
        return { bg: '#F8FAFC', border: '#E2E8F0', text: '#334155' };
    }
  };

  return (
    <div className="card" style={{ borderRadius: 20, padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Bell size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Live Activity & Micro-Notifications
            </h3>
            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
              Real-time MomentJoy updates for {patientName || 'your elder'}
            </p>
          </div>
        </div>

        {notifications.length > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#F0FDF4', color: '#16A34A', fontSize: 11, fontWeight: 800,
            padding: '4px 10px', borderRadius: 99, border: '1px solid #BBF7D0',
          }}>
            <Sparkles size={12} /> {notifications.length} logged
          </span>
        )}
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Updates' },
          { id: 'game', label: '🎮 Games' },
          { id: 'medicine', label: '💊 Medicine' },
          { id: 'hydration', label: '💧 Hydration' },
          { id: 'routine', label: '🔄 Routine' },
        ].map((f) => {
          const active = selectedFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              style={{
                background: active ? '#0284C7' : '#F1F5F9',
                color: active ? '#FFFFFF' : '#475569',
                border: `1px solid ${active ? '#0284C7' : '#E2E8F0'}`,
                borderRadius: 999,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Notification Stream */}
      {filteredNotifs.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '24px 16px', background: '#F8FAFC',
          borderRadius: 14, border: '1.5px dashed #E2E8F0',
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🔔</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>
            No recent activity updates yet
          </div>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>
            Activity events will appear here the moment {patientName || 'the elder'} plays a game, takes medicine, or completes a routine.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
          {filteredNotifs.map((notif) => {
            const colors = getActionColor(notif.actionType);
            return (
              <div
                key={notif.id}
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 14,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'transform 0.15s ease',
                }}
              >
                <div style={{ fontSize: 20, flexShrink: 0 }}>
                  {notif.iconEmoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{notif.message}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{formatRelativeTime(notif.timestamp)}</span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>{notif.actionType}</span>
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  {notif.status === 'synced' ? (
                    <span
                      title="Synced to server"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        color: '#16A34A', fontSize: 11, fontWeight: 800,
                        background: '#DCFCE7', padding: '2px 7px', borderRadius: 99,
                      }}
                    >
                      <Check size={11} strokeWidth={3} /> Synced
                    </span>
                  ) : (
                    <span
                      title="Queued locally, will sync automatically on reconnect"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        color: '#D97706', fontSize: 11, fontWeight: 800,
                        background: '#FEF3C7', padding: '2px 7px', borderRadius: 99,
                      }}
                    >
                      <Clock size={11} strokeWidth={3} /> Queued
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
