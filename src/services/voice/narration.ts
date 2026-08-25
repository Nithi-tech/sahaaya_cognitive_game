import type { Language } from '../../types';
import { t } from '../../i18n/useTranslation';

// Turns structured quiz state into the exact sentence Sahaaya should speak.
// Every sentence comes from the localization dictionary — never raw question
// JSON, ids, or labels — so voice output is always natural, translated
// phrasing rather than a readout of internal data.

export function narrateMemoryLook(lang: Language): string {
  return t('voice.memory.look', lang);
}

export function narrateMemoryRecall(lang: Language): string {
  return t('voice.memory.recall', lang);
}

export function narrateAttentionInstruction(lang: Language): string {
  return t('voice.attention.instruction', lang);
}

export function narratePattern(lang: Language): string {
  return `${t('voice.pattern.look', lang)} ${t('voice.pattern.ask', lang)}`;
}

export function narrateObjectRecognition(lang: Language): string {
  return t('voice.object_recognition.ask', lang);
}

export function narrateRoutineInstruction(lang: Language): string {
  return t('voice.routine.instruction', lang);
}

export function narrateFamilyFacesAsk(lang: Language, relationship: string): string {
  return t('voice.family_faces.ask', lang).replace('{relationship}', relationship.toLowerCase());
}

export function narrateFeedback(lang: Language, correct: boolean): string {
  return correct ? t('voice.feedback.correct', lang) : t('voice.feedback.incorrect', lang);
}

export function narrateSample(lang: Language): string {
  return t('voice.settings.sample', lang);
}
