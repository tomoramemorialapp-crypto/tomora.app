import { Platform, Share } from 'react-native';

/** Native / web share sheet for a public profile link. */
export async function sharePublicProfileLink(displayName: string, link: string): Promise<void> {
  const message = `See ${displayName}'s public profile on Tomora`;
  const payload = `${message}\n\n${link}`;

  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: displayName, text: message, url: link });
      return;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
    }
  }

  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { message: payload, url: link, title: displayName }
        : { message: payload, title: displayName },
    );
  } catch {
    // user dismissed
  }
}
