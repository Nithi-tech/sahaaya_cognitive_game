import { describe, it, expect } from 'vitest';
import {
  narrateMemoryLook, narrateMemoryRecall, narrateAttentionInstruction, narratePattern,
  narrateObjectRecognition, narrateRoutineInstruction, narrateFamilyFacesAsk, narrateFeedback,
} from './narration';

describe('narration', () => {
  it('never leaks raw data — family faces narration is built from a translated template, not JSON', () => {
    const text = narrateFamilyFacesAsk('en', 'Daughter');
    expect(text).toBe('Who is your daughter?');
    expect(text).not.toContain('{relationship}');
  });

  it('produces localized sentences in both supported languages', () => {
    expect(narrateMemoryLook('en')).toMatch(/remember/i);
    expect(narrateMemoryLook('as')).not.toBe(narrateMemoryLook('en'));

    expect(narrateAttentionInstruction('en')).toMatch(/flowers/i);
    expect(narrateAttentionInstruction('as')).not.toBe(narrateAttentionInstruction('en'));
  });

  it('combines the pattern look+ask narration into one natural sentence', () => {
    const text = narratePattern('en');
    expect(text).toBe('Look at the pattern. What comes next?');
  });

  it('never uses shaming language for incorrect feedback', () => {
    const incorrect = narrateFeedback('en', false).toLowerCase();
    expect(incorrect).not.toMatch(/wrong|incorrect|fail/);
    expect(narrateFeedback('en', true)).toBe('Well done!');
  });

  it('has distinct, non-empty narration for every game type', () => {
    const lang = 'en';
    const sentences = [
      narrateMemoryLook(lang),
      narrateMemoryRecall(lang),
      narrateAttentionInstruction(lang),
      narratePattern(lang),
      narrateObjectRecognition(lang),
      narrateRoutineInstruction(lang),
    ];
    sentences.forEach((s) => expect(s.length).toBeGreaterThan(0));
    expect(new Set(sentences).size).toBe(sentences.length);
  });
});
