import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

/** Copy text to the system clipboard (web + native). */
export async function copyToClipboard(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;

  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(trimmed);
      return true;
    }
    await Clipboard.setStringAsync(trimmed);
    return true;
  } catch {
    return false;
  }
}
