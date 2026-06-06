import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { APP_BASE_URL } from '@/constants/urls';

/** OAuth redirect target registered in Supabase Auth → URL configuration. */
export function getOAuthRedirectUrl(): string {
  if (Platform.OS === 'web') {
    return `${APP_BASE_URL}/auth/callback`;
  }
  return Linking.createURL('auth/callback');
}
