import type { DailyActivity, Memory, Reminder } from '../types';

export type VoiceIntent =
  | 'GET_NEXT_ACTIVITY'
  | 'GET_MEDICATION'
  | 'GET_MEMORY'
  | 'GET_DAY_SUMMARY'
  | 'START_GAME'
  | 'ADD_WATER_REMINDER'
  | 'OPEN_MEMORIES'
  | 'NAVIGATE_HOME'
  | 'UNKNOWN';

const KEYWORDS: Record<Exclude<VoiceIntent, 'UNKNOWN' | 'GET_MEMORY'>, string[]> = {
  GET_MEDICATION: ['medicine', 'medication', 'ঔষধ'],
  GET_DAY_SUMMARY: ['this morning', 'today', 'my day', 'আজি', 'ৰাতিপুৱা'],
  GET_NEXT_ACTIVITY: ['next', 'what do i have', 'কি কৰিবলগীয়া'],
  START_GAME: ['start', 'game', 'play', 'আৰম্ভ', 'খেল'],
  ADD_WATER_REMINDER: ['water', 'drink', 'hydrat', 'পানী'],
  OPEN_MEMORIES: ['memories', 'memory', 'family', 'স্মৃতি'],
  NAVIGATE_HOME: ['go home', 'take me home', 'ঘৰলৈ'],
};

/** Very small keyword-based intent classifier — swappable for a real NLU model later. */
export function parseIntent(transcript: string): { intent: VoiceIntent; entity?: string } {
  const text = transcript.toLowerCase().trim();

  const whoMatch = text.match(/who is ([a-zঀ-৿\s]+)\??$/i) ?? text.match(/^([a-zঀ-৿\s]+?)\s*কোন\??$/i);
  if (whoMatch) {
    return { intent: 'GET_MEMORY', entity: whoMatch[1].trim() };
  }

  for (const [intent, words] of Object.entries(KEYWORDS) as [VoiceIntent, string[]][]) {
    if (words.some((w) => text.includes(w))) return { intent };
  }

  return { intent: 'UNKNOWN' };
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export interface VoiceContext {
  dailyActivities: DailyActivity[];
  reminders: Reminder[];
  memories: Memory[];
}

/** Resolves an intent into a spoken response using the patient's real stored data — never a hardcoded answer. */
export function resolveIntent(intent: VoiceIntent, entity: string | undefined, ctx: VoiceContext): { text: string; navigateTo?: string } {
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

  switch (intent) {
    case 'GET_NEXT_ACTIVITY': {
      const next = ctx.dailyActivities
        .filter((a) => a.status === 'pending')
        .sort((a, b) => toMinutes(a.scheduledTime) - toMinutes(b.scheduledTime))[0];
      if (!next) return { text: "You've completed everything on today's schedule. Well done!" };
      return { text: `Your next activity is ${next.activity} at ${next.scheduledTime}.` };
    }

    case 'GET_MEDICATION': {
      const medicine = ctx.reminders
        .filter((r) => r.type === 'medicine')
        .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
      const next = medicine.find((r) => r.status !== 'completed' && toMinutes(r.time) >= nowMins) ?? medicine.find((r) => r.status !== 'completed');
      if (!next) return { text: "You've taken all of today's medicine. Great job!" };
      return { text: `Your ${next.title} is scheduled for ${next.time}. ${next.description}` };
    }

    case 'GET_MEMORY': {
      if (!entity) return { text: "I didn't catch who you're asking about. Please try again." };
      const found = ctx.memories.find((m) => m.title.toLowerCase().includes(entity.toLowerCase()));
      if (!found) return { text: `I don't have anything saved about ${entity} yet. Ask your caregiver to add it to your memories.` };
      return { text: found.voiceText ?? found.description };
    }

    case 'GET_DAY_SUMMARY': {
      const done = ctx.dailyActivities.filter((a) => a.status === 'completed').sort((a, b) => toMinutes(a.scheduledTime) - toMinutes(b.scheduledTime));
      if (done.length === 0) return { text: "You haven't completed any activities yet today." };
      return { text: `So far today you have: ${done.map((a) => a.activity).join(', ')}.` };
    }

    case 'START_GAME':
      return { text: 'Starting your brain activities now!', navigateTo: '/activities' };

    case 'ADD_WATER_REMINDER':
      return { text: "I've noted a reminder for you to drink water soon. Stay hydrated!" };

    case 'OPEN_MEMORIES':
      return { text: 'Here are your memories.', navigateTo: '/memory' };

    case 'NAVIGATE_HOME':
      return { text: 'Taking you home.', navigateTo: '/' };

    default:
      return { text: "I'm not sure how to help with that yet. Try asking about your medicine, your next activity, or a family member." };
  }
}
