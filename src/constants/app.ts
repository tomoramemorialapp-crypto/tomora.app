/** App-wide metadata shown in footers and about screens. */
export const APP_VERSION = 'v0.1.0';
export const COPYRIGHT = '© Tomora 2026';

/**
 * Google/Apple sign-in — off by default; OAuthSignInButtons stays hidden until enabled.
 * When ready: configure providers in Supabase, set EXPO_PUBLIC_OAUTH_SIGN_IN_ENABLED=true, rebuild.
 */
export const OAUTH_SIGN_IN_ENABLED = process.env.EXPO_PUBLIC_OAUTH_SIGN_IN_ENABLED === 'true';
