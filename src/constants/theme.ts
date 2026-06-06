import { Platform } from 'react-native';

/**
 * Tomora brand design tokens.
 * Warm ivory, gold, black, soft motion. Architected so fonts/colors can be
 * swapped later without touching screens.
 */

/**
 * Tomora's two palettes share identical keys, so every screen that reads
 * `colors.x` themes automatically — the active palette is swapped in place by
 * the ThemeProvider (see src/theme). Light = warm paper & candlelight; Night =
 * a midnight archive lit by soft gold.
 */
export const lightColors = {
  ivory: '#F7EFE6',
  paper: '#FBF6EF',
  guardianGold: '#B8872F',
  softGold: '#D2AE67',
  ink: '#1E2224',
  charcoal: '#2B2B2B',
  mistBeige: '#E8DED2',
  ashTaupe: '#B9AA99',
  candlelight: '#FFF3D8',
  deepUmber: '#5A3E25',
  success: '#6F8A5B',
  warning: '#C28A2E',
  error: '#A65345',
  info: '#607D8B',
  disabled: '#CFC5BA',
  // derived helpers
  goldGlow: 'rgba(184, 135, 47, 0.18)',
  hairline: 'rgba(30, 34, 36, 0.08)',
  overlay: 'rgba(30, 34, 36, 0.45)',
  white: '#FFFFFF',
};

export type Palette = Record<keyof typeof lightColors, string>;

/** Night Mode: warm charcoal + brighter gold, never pure black/neon. */
export const darkColors: Palette = {
  ivory: '#101112', // main background (Midnight Ink)
  paper: '#181A1B', // cards / panels (Deep Charcoal)
  guardianGold: '#D2AE67', // brighter on dark for contrast
  softGold: '#F0D9A0', // candle glow
  ink: '#F7EFE6', // primary text (Warm Ivory)
  charcoal: '#D8CEC2', // body copy (Soft Linen)
  mistBeige: '#222426', // inputs / tracks (Warm Graphite)
  ashTaupe: '#A99E91', // captions (Ash Taupe)
  candlelight: '#1C1B18', // warm dark surface
  deepUmber: '#D8CEC2', // secondary text on dark
  success: '#9BAF85',
  warning: '#E2B866',
  error: '#D98A7A',
  info: '#9EB7C2',
  disabled: '#5E5A54',
  goldGlow: 'rgba(210, 174, 103, 0.14)',
  hairline: 'rgba(247, 239, 230, 0.10)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  white: '#222426', // "white" surfaces become an elevated graphite
};

export type ThemeMode = 'light' | 'dark';

/** The live palette every component reads. Mutated in place on theme change. */
export const colors: Palette = { ...lightColors };

/** Swap the active palette in place (keeps the same object reference). */
export function applyPalette(mode: ThemeMode): void {
  Object.assign(colors, mode === 'dark' ? darkColors : lightColors);
}

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * React Native shadow equivalents (the brief's CSS shadow strings are kept as
 * reference in comments). Use these objects on RN/Web components.
 */
export const shadows = {
  // 0 8px 32px rgba(30, 34, 36, 0.08)
  soft: Platform.select({
    web: { boxShadow: '0 8px 32px rgba(30, 34, 36, 0.08)' },
    default: {
      shadowColor: '#1E2224',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 6,
    },
  }) as object,
  // 0 4px 18px rgba(30, 34, 36, 0.06)
  card: Platform.select({
    web: { boxShadow: '0 4px 18px rgba(30, 34, 36, 0.06)' },
    default: {
      shadowColor: '#1E2224',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 9,
      elevation: 3,
    },
  }) as object,
  // 0 0 24px rgba(184, 135, 47, 0.18)
  goldGlow: Platform.select({
    web: { boxShadow: '0 0 24px rgba(184, 135, 47, 0.18)' },
    default: {
      shadowColor: '#B8872F',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 14,
      elevation: 8,
    },
  }) as object,
} as const;

/**
 * Typography. System fonts initially for speed; on web a Google Fonts stack is
 * loaded via global.css so the serif feels premium. Swap to custom fonts later
 * by changing these tokens only.
 */
export const fonts = {
  display: Platform.select({
    web: "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif",
    ios: 'Georgia',
    default: 'serif',
  }) as string,
  body: Platform.select({
    web: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    ios: 'System',
    default: 'sans-serif',
  }) as string,
};

export const fontSize = {
  caption: 13,
  body: 16,
  bodyLg: 18,
  title: 22,
  h3: 26,
  h2: 32,
  h1: 40,
  hero: 52,
} as const;

export const theme = { colors, radii, spacing, shadows, fonts, fontSize };
export type Theme = typeof theme;
