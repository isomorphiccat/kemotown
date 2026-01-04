/**
 * i18n Configuration
 * Internationalization setup for Korean and English
 */

export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ko';

export const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
};

// Simple translation function for client-side
export function getTranslation(locale: Locale) {
  // Dynamic import of translation files
  if (locale === 'ko') {
    return import('./messages/ko.json');
  }
  return import('./messages/en.json');
}
