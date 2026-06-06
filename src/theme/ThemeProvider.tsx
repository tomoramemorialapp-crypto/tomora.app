import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';

import { applyPalette, colors, darkColors, lightColors, type ThemeMode } from '@/constants/theme';

export type AppearancePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'tomora.appearancePreference';

interface ThemeContextValue {
  themeMode: ThemeMode;
  appearancePreference: AppearancePreference;
  setAppearancePreference: (value: AppearancePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'light',
  appearancePreference: 'light',
  setAppearancePreference: () => {},
});

/** Legacy `system` and unknown values resolve to light — dark only when explicitly chosen. */
function normalizePreference(value: AppearancePreference | string | null | undefined): AppearancePreference {
  return value === 'dark' ? 'dark' : 'light';
}

function readStoredPreference(): AppearancePreference {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizePreference(raw);
  }
  return 'light';
}

function persistPreference(value: AppearancePreference): void {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }
}

function resolveMode(pref: AppearancePreference): ThemeMode {
  return pref === 'dark' ? 'dark' : 'light';
}

/** Reflect the resolved theme onto the web document (data-theme, CSS vars, body bg). */
function syncWebDocument(mode: ThemeMode): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  const palette = mode === 'dark' ? darkColors : lightColors;
  root.style.setProperty('--bg-primary', palette.ivory);
  root.style.setProperty('--bg-secondary', palette.paper);
  root.style.setProperty('--text-primary', palette.ink);
  root.style.setProperty('--brand-gold', palette.guardianGold);
  root.style.backgroundColor = palette.ivory;
  if (document.body) {
    document.body.style.backgroundColor = palette.ivory;
    document.body.style.color = palette.ink;
  }
}

/**
 * Tomora theme provider: Light / Night / System with a persisted preference and
 * live system-appearance tracking. On change it swaps the shared palette in
 * place and re-renders the whole subtree, so every screen reading `colors.x`
 * updates without per-component wiring. Transitions are kept calm and quick.
 */
export function ThemeProvider({
  children,
  /** When signed in, hydrate from the account's saved theme preference. */
  accountPreference,
}: {
  children: React.ReactNode;
  accountPreference?: AppearancePreference | null;
}) {
  const [appearancePreference, setPref] = useState<AppearancePreference>(() => readStoredPreference());

  useEffect(() => {
    if (accountPreference === 'light' || accountPreference === 'dark' || accountPreference === 'system') {
      const normalized = normalizePreference(accountPreference);
      persistPreference(normalized);
      setPref(normalized);
    }
  }, [accountPreference]);

  const themeMode = resolveMode(appearancePreference);

  // Apply the palette synchronously so children render with correct colors.
  applyPalette(themeMode);

  useLayoutEffect(() => {
    syncWebDocument(themeMode);
  }, [themeMode]);

  const setAppearancePreference = useCallback((value: AppearancePreference) => {
    const normalized = normalizePreference(value);
    persistPreference(normalized);
    setPref(normalized);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ themeMode, appearancePreference, setAppearancePreference }),
    [themeMode, appearancePreference, setAppearancePreference],
  );

  // Keying the wrapper on `themeMode` remounts the UI subtree when the resolved
  // theme flips, guaranteeing every screen re-reads the freshly-swapped palette.
  // The data layer (AppStateProvider) sits ABOVE this provider, so toggling the
  // theme never reloads the user's tree or loses their session.
  return (
    <ThemeContext.Provider value={value}>
      <View key={themeMode} style={{ flex: 1, backgroundColor: colors.ivory }}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/** Convenience accessor for the live palette (also importable directly). */
export function useThemeColors() {
  // Touch context so consumers re-render on theme changes.
  useTheme();
  return colors;
}
