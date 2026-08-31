// ============================================================
// Sahaaya – Type Definitions
// ============================================================

export type UserRole = 'elderly' | 'caregiver' | 'healthcare';
export type Language = 'en' | 'as';
export type GameType =
  | 'memory_match' | 'object_recognition' | 'attention' | 'pattern' | 'routine_recall' | 'family_faces'
  | 'color_focus' | 'quick_response' | 'number_focus' | 'block_memory' | 'dual_memory' | 'go_no_go' | 'find_the_change'
  | 'peripheral_awareness' | 'memory_span' | 'cultural_memory'
  | 'daily_sequence' | 'face_name_match' | 'sound_match' | 'odd_one_out';
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
  onboardingComplete: boolean;
  elderAccessId?: string;
}

export type VoiceSpeed = 'slow' | 'normal' | 'fast';

// ============================================================
// Onboarding section types — captured by caregiver on elder's behalf.
// All fields are optional so sections can be saved incrementally.
// ============================================================

export interface PersonAudioClips {
  greeting?: string; // e.g. "Good morning Ma, wishing you a lovely day!"
  reminder?: string; // e.g. "Ma, it's time to take your morning medicine!"
  reward?: string;   // e.g. "Shabash Ma, you did wonderfully today!"
}

export interface OnboardingPerson {
  name: string;         // Name as the elder calls them (e.g. "Amma")
  callsBy: string;      // What the elder calls this person
  relationship: string; // e.g. "Daughter", "Son-in-law"
  photoUrl?: string;    // base64 data-URI or null
  greetingAudioUrl?: string; // backwards compatibility
  audioClips?: PersonAudioClips;
  askedForOften?: boolean; // elder asks for/mentions this person most
  aiVoiceEnabled?: boolean; // caregiver opted-in to online AI voice synthesis
  voiceProfileId?: string; // optional remote ID from voice clone provider
}

export interface OnboardingPeopleSection {
  people: OnboardingPerson[];
}

export type ThemeCategory = 'food' | 'festival' | 'nature' | 'hobby' | 'fruit' | 'vegetable';

export interface ThemePreference {
  category: ThemeCategory;
  subOption: string;
  themeAssetId: string;
}

export interface OnboardingFavoritesSection {
  food?: string;
  colour?: string;  // hex or CSS color string
  music?: string;
  place?: string;
  themePreference?: ThemePreference;
}

export interface OnboardingRoutineSection {
  wakeTime?: string;      // HH:MM
  breakfastTime?: string;
  lunchTime?: string;
  dinnerTime?: string;
  sleepTime?: string;
  rituals?: string;       // free text e.g. "Morning prayer"
  activityPhrase?: string; // custom wording for "brain activity" nudge
}

export interface OnboardingCulturalSection {
  festivals?: string[];           // e.g. ["Bihu", "Durga Puja"]
  traditionalObjects?: string[];  // e.g. ["Jaapi", "Mekhela"]
  dialect?: string;               // regional language / dialect notes
}

export interface OnboardingHealthSection {
  medicines?: Array<{ name: string; time: string }>;
  mobilityIssues?: string;
  diet?: string;
}

export interface OnboardingEmotionalSection {
  calming?: string;    // what calms them when anxious
  sounds?: string;     // e.g. "nature", "music", "silence"
  images?: string;     // description of calming images
  phrases?: string[];  // comforting phrases
}

export interface OnboardingData {
  people?: OnboardingPeopleSection | null;
  favorites?: OnboardingFavoritesSection | null;
  routine?: OnboardingRoutineSection | null;
  cultural?: OnboardingCulturalSection | null;
  health?: OnboardingHealthSection | null;
  emotional?: OnboardingEmotionalSection | null;
}

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
  aiVoiceEnabled?: boolean; // caregiver master toggle for online voice cloning
  // Onboarding data — caregiver-populated, not directly editable by the elder
  onboarding?: OnboardingData;
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
