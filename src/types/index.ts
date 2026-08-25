// ============================================================
// Sahaaya – Type Definitions
// ============================================================

export type UserRole = 'elderly' | 'caregiver' | 'healthcare';
export type Language = 'en' | 'as';
export type GameType = 'memory_match' | 'object_recognition' | 'attention' | 'pattern' | 'routine_recall' | 'family_faces';
export type Difficulty = 'easy' | 'medium' | 'challenging';
export type CognitiveDomain = 'memory' | 'attention' | 'recognition' | 'pattern' | 'routine';
export type ReminderType = 'medicine' | 'hydration' | 'activity' | 'appointment';
export type ReminderStatus = 'scheduled' | 'completed' | 'skipped' | 'delayed';
export type AlertSeverity = 'low' | 'medium' | 'high';
export type SyncStatus = 'pending' | 'synced' | 'failed';
export type MemoryCategory = 'family' | 'places' | 'favorites' | 'routine' | 'dates';
export type MoodType = 'good' | 'okay' | 'notgood';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  language: Language;
  createdAt: string;
  avatar?: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  name: string;
  age: number;
  language: Language;
  region: string;
  preferences: PatientPreferences;
  caregiverId: string;
  healthcareWorkerId?: string;
  caregiverName: string;
  createdAt: string;
}

export type VoiceSpeed = 'slow' | 'normal' | 'fast';

export interface PatientPreferences {
  preferredLanguage: Language;
  preferredActivityTime: string;
  favoriteCategory: MemoryCategory;
  favoriteContent: string;
  difficulty: Difficulty | 'adaptive';
  voiceEnabled: boolean;
  voiceLanguage?: Language;
  voiceSpeed?: VoiceSpeed;
  voiceVolume?: number;
  spokenFeedback?: boolean;
}

export interface CognitiveSession {
  id: string;
  patientId: string;
  gameType: GameType;
  difficulty: Difficulty;
  score: number;
  accuracy: number;
  responseTime: number; // average seconds per answer
  mistakes: number;
  completed: boolean;
  domain: CognitiveDomain;
  timestamp: string;
}

export interface CognitiveProfile {
  patientId: string;
  memoryScore: number;
  attentionScore: number;
  recognitionScore: number;
  patternScore: number;
  routineScore: number;
  overallEngagement: number;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  patientId: string;
  type: ReminderType;
  title: string;
  description: string;
  time: string; // HH:MM
  status: ReminderStatus;
  date?: string; // YYYY-MM-DD, if undefined = daily
  adherenceRate?: number;
}

export interface Memory {
  id: string;
  patientId: string;
  category: MemoryCategory;
  title: string;
  description: string;
  imageUrl?: string;
  audioUrl?: string;
  voiceText?: string;
  relationship?: string;
  notes?: string;
  createdAt: string;
}

export interface DailyActivity {
  id: string;
  patientId: string;
  activity: string;
  emoji: string;
  scheduledTime: string; // HH:MM
  status: 'pending' | 'completed' | 'skipped';
  date: string; // YYYY-MM-DD
}

export interface Alert {
  id: string;
  patientId: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  detail?: string;
  action?: string;
  createdAt: string;
  resolved: boolean;
}

export interface SyncQueueItem {
  id: string;
  patientId: string;
  actionType: string;
  payload: Record<string, unknown>;
  status: SyncStatus;
  createdAt: string;
}

export interface TrendDataPoint {
  date: string;
  memory: number;
  attention: number;
  recognition: number;
  pattern: number;
  routine: number;
  overall: number;
}

export interface GameResult {
  correct: boolean;
  responseTime: number;
  answer: string;
}

export interface AdaptiveRecommendation {
  nextDifficulty: Difficulty;
  nextDomain: CognitiveDomain;
  reason: string;
  insight: string;
}

export interface VoiceCommand {
  id: string;
  text: string;
  response: string;
  action?: string;
}

export interface CulturalItem {
  id: string;
  name: string;
  nameAs?: string; // Assamese name
  category: string;
  emoji: string;
  description: string;
  region: string;
  difficulty: Difficulty;
  audioLabel?: string;
}

export interface InsightItem {
  id: string;
  domain?: CognitiveDomain;
  title: string;
  insight: string;
  reason: string;
  action: string;
  type: 'positive' | 'neutral' | 'attention';
}
