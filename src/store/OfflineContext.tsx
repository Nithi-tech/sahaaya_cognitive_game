import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { SyncQueueItem } from '../types';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  syncComplete: boolean;
  toggleOnline: () => void;
  syncQueue: SyncQueueItem[];
  addToQueue: (item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'status'>) => void;
}

export const OfflineContext = createContext<OfflineContextType | null>(null);

const QUEUE_KEY = 'sahaaya_sync_queue';

interface SyncResult {
  id: string;
  status: 'synced' | 'failed';
  error?: string;
}

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [manualOffline, setManualOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
    } catch {
      return [];
    }
  });
  const draining = useRef(false);
  // Mirrors syncQueue so drainQueue can read the latest value without taking
  // a dependency on it (which would recreate the callback — and re-fire the
  // effect that calls it — on every queue change).
  const syncQueueRef = useRef(syncQueue);
  useEffect(() => {
    syncQueueRef.current = syncQueue;
  }, [syncQueue]);

  const persistQueue = (items: SyncQueueItem[]) => {
    setSyncQueue(items);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  };

  const addToQueue = useCallback((item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'status'>) => {
    const newItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setSyncQueue((prev) => {
      const updated = [...prev, newItem];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const drainQueue = useCallback(async () => {
    if (draining.current || !isAuthenticated) return;
    const pending = syncQueueRef.current.filter((i) => i.status === 'pending');
    if (pending.length === 0) return;

    draining.current = true;
    setIsSyncing(true);
    setSyncComplete(false);

    try {
      const { results } = await api.post<{ results: SyncResult[] }>('/sync', {
        items: pending.map((p) => ({ id: p.id, patientId: p.patientId, actionType: p.actionType, payload: p.payload })),
      });
      const resultById = new Map(results.map((r) => [r.id, r]));
      const remaining = syncQueueRef.current.filter((item) => {
        const result = resultById.get(item.id);
        return !(result && result.status === 'synced');
      });
      persistQueue(remaining);
      setSyncComplete(true);
      setTimeout(() => setSyncComplete(false), 3000);
    } catch {
      // Still offline or server unreachable — leave items pending, retry on next reconnect.
    } finally {
      setIsSyncing(false);
      draining.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const effectiveOnline = isOnline && !manualOffline;

  useEffect(() => {
    if (effectiveOnline) drainQueue();
  }, [effectiveOnline, drainQueue]);

  const toggleOnline = useCallback(() => {
    setManualOffline((prev) => !prev);
  }, []);

  return (
    <OfflineContext.Provider
      value={{ isOnline: effectiveOnline, isSyncing, syncComplete, toggleOnline, syncQueue, addToQueue }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be used within OfflineProvider');
  return ctx;
}
