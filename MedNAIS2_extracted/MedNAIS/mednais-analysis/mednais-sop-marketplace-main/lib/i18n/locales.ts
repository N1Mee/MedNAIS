export const locales = ['en', 'es', 'fr', 'de', 'zh', 'ar', 'pt', 'pl', 'ru', 'uk'] as const;
export type Locale = typeof locales[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  zh: '中文',
  ar: 'العربية',
  pt: 'Português',
  pl: 'Polski',
  ru: 'Русский',
  uk: 'Українська',
};

export const defaultLocale: Locale = 'en';
