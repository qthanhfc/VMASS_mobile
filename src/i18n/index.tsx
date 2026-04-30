import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { en } from './locales/en';
import { vi } from './locales/vi';

export const LANGUAGE_STORAGE_KEY = 'currentLanguage';

export const languageOptions = [
  { key: 'vi', label: 'VN', name: 'Tiếng Việt', dateLocale: 'vi-VN' },
  { key: 'en', label: 'EN', name: 'English', dateLocale: 'en-US' },
] as const;

export type LanguageCode = (typeof languageOptions)[number]['key'];
export type TranslationKey = keyof typeof vi;

type TranslationParams = Record<string, string | number>;

type LanguageContextValue = {
  locale: LanguageCode;
  dateLocale: string;
  setLocale: (locale: LanguageCode) => Promise<void>;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

const dictionaries: Record<LanguageCode, Record<TranslationKey, string>> = {
  vi,
  en,
};

const isLanguageCode = (value: string | null): value is LanguageCode =>
  languageOptions.some((language) => language.key === value);

const interpolate = (message: string, params?: TranslationParams) => {
  if (!params) return message;

  return Object.entries(params).reduce(
    (current, [key, value]) => current.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    message
  );
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LanguageCode>('vi');

  useEffect(() => {
    let isMounted = true;

    const loadLanguage = async () => {
      const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isMounted && isLanguageCode(stored)) {
        setLocaleState(stored);
      }
    };

    loadLanguage();

    return () => {
      isMounted = false;
    };
  }, []);

  const setLocale = useCallback(async (nextLocale: LanguageCode) => {
    setLocaleState(nextLocale);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      const message = dictionaries[locale][key] || dictionaries.vi[key] || key;
      return interpolate(message, params);
    },
    [locale]
  );

  const value = useMemo(() => {
    const option = languageOptions.find((language) => language.key === locale) || languageOptions[0];

    return {
      locale,
      dateLocale: option.dateLocale,
      setLocale,
      t,
    };
  }, [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return context;
}
