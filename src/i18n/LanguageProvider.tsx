import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { dictionaries, en, LANGUAGES, RTL_CODES, type TranslationKey } from './translations';

const STORAGE_KEY = 'tomora.language';

type Vars = Record<string, string | number>;

interface LanguageContextValue {
  language: string;
  isRTL: boolean;
  setLanguage: (code: string) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
  languages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStored(): string {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && dictionaries[raw]) return raw;
  }
  return 'en';
}

function persist(code: string): void {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
  }
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/**
 * Provides the active UI language + a `t()` translator. English is the fallback
 * for any untranslated key, so the app is always fully labeled. Switching the
 * language re-renders the subtree via a keyed boundary placed below the data
 * provider, so changing language never reloads the user's tree.
 */
export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage?: string;
}) {
  const [language, setLang] = useState<string>(() => initialLanguage && dictionaries[initialLanguage] ? initialLanguage : readStored());

  // Adopt a server-provided language (e.g. after the account loads) once.
  useEffect(() => {
    if (initialLanguage && dictionaries[initialLanguage] && initialLanguage !== language) {
      setLang(initialLanguage);
      persist(initialLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLanguage]);

  const setLanguage = useCallback((code: string) => {
    if (!dictionaries[code]) return;
    persist(code);
    setLang(code);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Vars): string => {
      const dict = dictionaries[language] ?? {};
      const value = dict[key] ?? en[key] ?? key;
      return interpolate(value, vars);
    },
    [language],
  );

  const isRTL = RTL_CODES.has(language);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, isRTL, setLanguage, t, languages: LANGUAGES }),
    [language, isRTL, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

/** Shorthand hook returning just the translator. */
export function useT(): LanguageContextValue['t'] {
  return useLanguage().t;
}
