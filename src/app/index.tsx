import { useLayoutEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import {
  capturePasswordRecoveryFromCurrentUrl,
  isPasswordRecoveryPendingSync,
} from '@/lib/passwordRecovery';
import { useAppState } from '@/state/AppState';
import { TomoraEmblem } from '@/components/brand/TomoraEmblem';
import { colors, spacing } from '@/constants/theme';

/** Entry point — wait for the session check, then route accordingly. */
export default function Index() {
  const { loading, isOnboarded, passwordRecoveryPending } = useAppState();

  useLayoutEffect(() => {
    capturePasswordRecoveryFromCurrentUrl();
  }, []);

  if (passwordRecoveryPending || isPasswordRecoveryPendingSync()) {
    return <Redirect href="/reset-password" />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
        <TomoraEmblem size={96} />
        <ActivityIndicator color={colors.guardianGold} />
      </View>
    );
  }

  return <Redirect href={isOnboarded ? '/(tabs)' : '/welcome'} />;
}
