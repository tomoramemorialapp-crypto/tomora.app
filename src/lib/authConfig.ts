import { APP_BASE_URL } from '@/constants/urls';

const DEFAULT_DEV_ORIGINS = ['http://localhost:8081', 'http://127.0.0.1:8081'] as const;

/**
 * Redirect URLs to allow in Supabase Dashboard → Authentication → URL configuration.
 * Prefer the wildcard entry so query params (next=reset-password, etc.) are accepted.
 */
export function getSupabaseAuthRedirectAllowList(extraOrigins: string[] = []): string[] {
  const origins = new Set<string>([APP_BASE_URL, ...DEFAULT_DEV_ORIGINS, ...extraOrigins]);

  const urls: string[] = [];
  for (const origin of origins) {
    urls.push(`${origin}/auth/callback`);
    urls.push(`${origin}/auth/callback?next=reset-password`);
    urls.push(`${origin}/auth/callback?next=claim`);
    urls.push(`${origin}/auth/callback?next=onboarding`);
    urls.push(`${origin}/**`);
  }
  return [...new Set(urls)];
}
