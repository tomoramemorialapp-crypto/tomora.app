import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

import { TomoraEmblem } from '@/components/brand/TomoraEmblem';
import { colors, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';

/** OAuth return route — session is parsed from the URL by the Supabase client on web. */
export default function AuthCallback() {
  const router = useRouter();
  const { loading, isOnboarded } = useAppState();

  useEffect(() => {
    if (!loading) {
      router.replace(isOnboarded ? '/(tabs)' : '/welcome');
    }
  }, [loading, isOnboarded, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
      <TomoraEmblem size={96} />
      <ActivityIndicator color={colors.guardianGold} />
    </View>
  );
}
