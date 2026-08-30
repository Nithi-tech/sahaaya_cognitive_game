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

export function narrateColorFocus(lang: Language): string {
  return t('voice.color_focus.instruction', lang);
}

export function narrateQuickResponse(lang: Language): string {
  return t('voice.quick_response.instruction', lang);
}

export function narrateNumberFocus(lang: Language): string {
  return t('voice.number_focus.instruction', lang);
}

export function narrateBlockMemory(lang: Language): string {
  return `${t('voice.block_memory.look', lang)} ${t('voice.block_memory.repeat', lang)}`;
}

export function narrateDualMemory(lang: Language): string {
  return t('voice.dual_memory.instruction', lang);
}

export function narrateGoNoGo(lang: Language): string {
  return t('voice.go_no_go.instruction', lang);
}

export function narrateFindTheChange(lang: Language): string {
  return t('voice.find_the_change.instruction', lang);
}

export function narratePeripheralAwareness(lang: Language): string {
  return t('voice.peripheral_awareness.instruction', lang);
}

export function narrateMemorySpan(lang: Language): string {
  return t('voice.memory_span.instruction', lang);
}

export function narrateBreathing(lang: Language): string {
  return t('voice.breathing.instruction', lang);
}

export function narrateCulturalMemoryAsk(lang: Language): string {
  return t('voice.cultural_memory.ask', lang);
}
