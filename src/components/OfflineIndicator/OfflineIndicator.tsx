import { useOffline } from '../../store/OfflineContext';
import { useTranslation } from '../../i18n/useTranslation';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';

export function OfflineIndicator() {
  const { isOnline, isSyncing, syncComplete, toggleOnline, syncQueue } = useOffline();
  const { t } = useTranslation();

  if (isOnline && !isSyncing && !syncComplete) return null;

  return (
    <div className={`offline-indicator ${
      !isOnline ? 'offline-indicator--offline' :
      isSyncing ? 'offline-indicator--syncing' :
      'offline-indicator--synced'
    }`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!isOnline && <><WifiOff size={16} /> {t('offline.offline')}</>}
        {isSyncing && <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('offline.syncing')}</>}
        {syncComplete && <><CheckCircle size={16} /> {t('offline.synced')}</>}
        {!isOnline && syncQueue.length > 0 && (
          <span style={{ opacity: 0.8, fontSize: 12 }}>
            ({syncQueue.filter(i => i.status === 'pending').length} pending)
          </span>
        )}
      </div>
      <button
        onClick={toggleOnline}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.4)',
          color: 'white',
          borderRadius: 20,
          padding: '2px 10px',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {isOnline ? 'Go Offline' : 'Go Online'}
      </button>
    </div>
  );
}

export function NetworkToggle() {
  const { isOnline, isSyncing, syncComplete, toggleOnline } = useOffline();
  return (
    <div className="card" style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
          {isOnline ? <Wifi size={16} color="var(--color-success)" /> : <WifiOff size={16} color="var(--color-danger)" />}
          <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
          {isSyncing && <span style={{ color: 'var(--color-accent)' }}>Syncing...</span>}
          {syncComplete && <span style={{ color: 'var(--color-success)' }}>Synced ✓</span>}
        </div>
        <button
          onClick={toggleOnline}
          className={`btn btn--sm ${isOnline ? 'btn--outline' : 'btn--primary'}`}
        >
          {isOnline ? 'Simulate Offline' : 'Go Online'}
        </button>
      </div>
    </div>
  );
}

// Add spin keyframe inline via style tag
const spinStyle = document.createElement('style');
spinStyle.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
document.head.appendChild(spinStyle);
