/** Suppress AppState auth hydration while probing duplicate sign-ups (avoids partial tree writes). */
let authHydrationSuppressed = 0;

export function isAuthHydrationSuppressed(): boolean {
  return authHydrationSuppressed > 0;
}

export async function suppressAuthHydration<T>(fn: () => Promise<T>): Promise<T> {
  authHydrationSuppressed += 1;
  try {
    return await fn();
  } finally {
    authHydrationSuppressed -= 1;
  }
}
