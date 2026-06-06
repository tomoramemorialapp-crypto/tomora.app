import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';
import { BackButton } from './BackButton';
import { FadeIn } from './FadeIn';

/**
 * Ivory full-bleed screen wrapper. Centers content and caps width on wide/web
 * screens so the experience stays calm and spacious. Optionally scrollable.
 */
export function ScreenContainer({
  children,
  scroll = true,
  center = false,
  maxWidth = 560,
  background = colors.ivory,
  contentStyle,
  footer,
  showBack = false,
  onBack,
  animate = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  center?: boolean;
  maxWidth?: number;
  background?: string;
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  /** Calm fade-in entrance for the screen content. */
  animate?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const body = animate ? <FadeIn>{children}</FadeIn> : children;

  const inner: ViewStyle = {
    width: '100%',
    maxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: insets.top + (showBack ? 56 : spacing.lg),
    paddingBottom: spacing.xl,
    flexGrow: 1,
    ...(center ? { justifyContent: 'center' } : null),
    ...contentStyle,
  };

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      {showBack ? (
        <View style={{ position: 'absolute', top: insets.top + spacing.xs, left: spacing.sm, zIndex: 10 }}>
          <BackButton onPress={onBack} />
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={inner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        <View style={inner}>{body}</View>
      )}
      {footer ? (
        <View
          style={{
            width: '100%',
            maxWidth,
            alignSelf: 'center',
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
            paddingTop: spacing.sm,
          }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}
