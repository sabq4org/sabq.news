import { useLanguage } from '@/contexts/LanguageContext';
import arTranslations from '@/i18n/ar.json';
import enTranslations from '@/i18n/en.json';

type Translations = typeof arTranslations;
type TranslationKey = string;

const translations: Record<'ar' | 'en', Translations> = {
  ar: arTranslations,
  en: enTranslations,
};

export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key is not a string: ${key}`);
      return key;
    }

    if (params) {
      return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
        return acc.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      }, value);
    }

    return value;
  };

  return { t, language };
}
