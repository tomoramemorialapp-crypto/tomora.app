import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing } from '@/constants/theme';

/** Soft, rounded paper card. Becomes pressable when onPress is provided. */
export function Card({
  children,
  onPress,
  style,
  padded = true,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  accessibilityLabel?: string;
}) {
  const base: ViewStyle = {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    padding: padded ? spacing.lg : 0,
    borderWidth: 1,
    borderColor: colors.hairline,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [base, shadows.card, { opacity: pressed ? 0.9 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[base, shadows.card, style]}>{children}</View>;
}
