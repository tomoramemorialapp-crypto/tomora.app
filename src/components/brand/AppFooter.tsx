import { View, type ViewStyle } from 'react-native';
import { TomoraLogo } from './TomoraLogo';
import { Caption } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import { APP_VERSION, COPYRIGHT } from '@/constants/app';

/**
 * Quiet brand footer: the Tomora wordmark above the app version and copyright.
 * Shown at the bottom of the You tab, settings, and the welcome / login screens.
 */
export function AppFooter({ showLogo = true, style }: { showLogo?: boolean; style?: ViewStyle }) {
  return (
    <View style={[{ alignItems: 'center', gap: 4, paddingTop: spacing.xl, paddingBottom: spacing.lg }, style]}>
      {showLogo ? <TomoraLogo size="sm" showEmblem={false} /> : null}
      <Caption style={{ color: colors.ashTaupe, fontSize: 12, marginTop: showLogo ? spacing.sm : 0 }}>{APP_VERSION}</Caption>
      <Caption style={{ color: colors.ashTaupe, fontSize: 12 }}>{COPYRIGHT}</Caption>
    </View>
  );
}
