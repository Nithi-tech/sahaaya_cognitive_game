import { useEffect, useRef } from 'react';
import { useAuth } from '../store/AuthContext';
import { useApp } from '../store/AppContext';
import { api } from '../api/client';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
// Checked periodically rather than re-armed on every single event — far
// cheaper than a setTimeout/clearTimeout pair per mousemove, and 15s of
// slack on a 5-minute threshold is not user-visible.
const CHECK_INTERVAL_MS = 15 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'] as const;

/**
 * Reports to the caregiver/healthcare dashboards when the elder has the app
 * open but hasn't touched/clicked/scrolled it for 5 minutes — a "are they
 * actually using this?" signal, not a medical one. Mounted once at the app
 * root (see App.tsx) so navigating between elderly pages doesn't reset it;
 * it no-ops entirely for non-elderly roles.
 *
 * Fires at most once per idle stretch: after alerting, it waits for real
 * activity to resume before it will alert again, so a caregiver isn't
 * flooded with a new alert every 5 minutes the elder stays idle.
 */
export function useIdleAlert() {
  const { user } = useAuth();
  const { currentPatient } = useApp();
  const lastActivityRef = useRef(Date.now());
  const alertedRef = useRef(false);

  const isElderly = user?.role === 'elderly';
  const patientId = currentPatient?.id;

  useEffect(() => {
    if (!isElderly || !patientId) return;

    const markActive = () => {
      lastActivityRef.current = Date.now();
      alertedRef.current = false;
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));

    const interval = setInterval(() => {
      if (alertedRef.current) return;
      if (Date.now() - lastActivityRef.current < IDLE_TIMEOUT_MS) return;
      alertedRef.current = true;
      // Best-effort — an idle notification that fails to send (offline,
      // server hiccup) isn't worth queuing for later replay; the moment
      // it's describing has already passed.
      api.post(`/alerts/${patientId}/idle`).catch(() => { /* ignore */ });
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActive));
      clearInterval(interval);
    };
  }, [isElderly, patientId]);
}
