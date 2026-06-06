import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

import { TomoraLogo } from './TomoraLogo';
import { Caption } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import { APP_VERSION, COPYRIGHT } from '@/constants/app';
import { footer } from '@/constants/copy';
import { clearAppCache, confirmClearCache } from '@/lib/clearCache';

/**
 * Quiet brand footer: the Tomora wordmark above the app version, copyright, and
 * an optional clear-cache control for picking up freshly deployed builds.
 */
export function AppFooter({
  showLogo = true,
  style,
}: {
  showLogo?: boolean;
  style?: ViewStyle;
}) {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  const onClearCache = async () => {
    if (clearing) return;
    const ok = await confirmClearCache();
    if (!ok) return;

    setClearing(true);
    try {
      await clearAppCache();
      if (Platform.OS !== 'web') {
        router.replace('/welcome');
      }
    } catch {
      setClearing(false);
    }
  };

  return (
    <View style={[{ alignItems: 'center', gap: 4, paddingTop: spacing.xl, paddingBottom: spacing.lg }, style]}>
      {showLogo ? <TomoraLogo size="sm" showEmblem={false} /> : null}
      <Caption style={{ color: colors.ashTaupe, fontSize: 12, marginTop: showLogo ? spacing.sm : 0 }}>{APP_VERSION}</Caption>
      <Caption style={{ color: colors.ashTaupe, fontSize: 12 }}>{COPYRIGHT}</Caption>

      <Pressable
        onPress={onClearCache}
        disabled={clearing}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={footer.clearCache}
        style={{ marginTop: spacing.sm, paddingVertical: 4, paddingHorizontal: spacing.sm }}
      >
        {clearing ? (
          <ActivityIndicator size="small" color={colors.guardianGold} />
        ) : (
          <Caption style={{ color: colors.guardianGold, fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' }}>
            {footer.clearCache}
          </Caption>
        )}
      </Pressable>
    </View>
  );
}
