import { useContext } from 'react';
import { AppContext } from '../store/AppContext';
import { translations } from './translations';
import type { Language } from '../types';

export function t(key: string, lang: Language = 'en'): string {
  const dict = translations[lang];
  if (dict && dict[key]) return dict[key];
  // Fallback to English
  const en = translations['en'];
  if (en && en[key]) return en[key];
  return key;
}

export function useTranslation() {
  const ctx = useContext(AppContext);
  const lang: Language = ctx?.language ?? 'en';
  return {
    t: (key: string) => t(key, lang),
    lang,
  };
}
