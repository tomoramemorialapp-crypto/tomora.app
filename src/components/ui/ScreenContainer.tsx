import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

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
}: {
  children: React.ReactNode;
  scroll?: boolean;
  center?: boolean;
  maxWidth?: number;
  background?: string;
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  const inner: ViewStyle = {
    width: '100%',
    maxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: insets.top + spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
    ...(center ? { justifyContent: 'center' } : null),
    ...contentStyle,
  };

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={inner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={inner}>{children}</View>
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
