import { APP_BASE_URL } from '@/constants/urls';

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:19006',
  'http://127.0.0.1:19006',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
] as const;

/** Production hosts that should accept OAuth callbacks (apex redirects to www). */
const PRODUCTION_AUTH_ORIGINS = ['https://www.tomora.app', 'https://tomora.app'] as const;

function authOrigins(appBaseUrl: string, extraOrigins: string[]): string[] {
  const origins = new Set<string>([...DEFAULT_DEV_ORIGINS, ...extraOrigins, appBaseUrl]);

  if (appBaseUrl.includes('tomora.app')) {
    for (const origin of PRODUCTION_AUTH_ORIGINS) origins.add(origin);
  }

  return [...origins];
}

/**
 * Redirect URLs to allow in Supabase Dashboard → Authentication → URL configuration.
 * Prefer the wildcard entry so query params (next=reset-password, etc.) are accepted.
 */
export function getSupabaseAuthRedirectAllowList(extraOrigins: string[] = []): string[] {
  const urls: string[] = [];
  for (const origin of authOrigins(APP_BASE_URL, extraOrigins)) {
    urls.push(`${origin}/auth/callback`);
    urls.push(`${origin}/auth/callback?next=reset-password`);
    urls.push(`${origin}/auth/callback?next=claim`);
    urls.push(`${origin}/auth/callback?next=onboarding`);
    urls.push(`${origin}/**`);
  }
  return [...new Set(urls)];
}
