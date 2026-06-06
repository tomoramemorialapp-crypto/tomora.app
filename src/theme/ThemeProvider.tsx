import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform, View } from 'react-native';

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
  appearancePreference: 'system',
  setAppearancePreference: () => {},
});

function readStoredPreference(): AppearancePreference {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  }
  return 'system';
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

function resolveMode(pref: AppearancePreference, system: 'light' | 'dark' | null): ThemeMode {
  if (pref === 'system') return system === 'dark' ? 'dark' : 'light';
  return pref;
}

/** Coerce RN's ColorSchemeName ('light' | 'dark' | 'unspecified' | null) to ours. */
function normalizeScheme(scheme: string | null | undefined): 'light' | 'dark' {
  return scheme === 'dark' ? 'dark' : 'light';
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
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [appearancePreference, setPref] = useState<AppearancePreference>(() => readStoredPreference());
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(() => normalizeScheme(Appearance.getColorScheme()));

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(normalizeScheme(colorScheme)));
    return () => sub.remove();
  }, []);

  const themeMode = resolveMode(appearancePreference, systemScheme);

  // Apply the palette synchronously so children render with correct colors.
  applyPalette(themeMode);

  useEffect(() => {
    syncWebDocument(themeMode);
  }, [themeMode]);

  const setAppearancePreference = useCallback((value: AppearancePreference) => {
    persistPreference(value);
    setPref(value);
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
