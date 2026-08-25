import type { UserRole } from '../types';

export interface DemoAccount {
  role: UserRole;
  email: string;
  label: string;
  emoji: string;
  sub: string;
}

// Shared by the landing page's quick-login buttons and the elderly "Switch
// Role" flow — one list, so both stay in sync with what's actually seeded.
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'elderly', email: 'maya@sahaaya.demo', label: 'landing.elderly', emoji: '👴', sub: 'Demo: Maya Devi, 72' },
  { role: 'caregiver', email: 'priya@sahaaya.demo', label: 'landing.caregiver', emoji: '❤️', sub: 'Demo: Priya Devi' },
  { role: 'healthcare', email: 'akhil@sahaaya.demo', label: 'landing.healthcare', emoji: '🏥', sub: 'Demo: Dr. Akhil Sharma' },
];

export const DEMO_PASSWORD = 'demo1234';
