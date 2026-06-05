import React from 'react';
import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from 'react-native';
import { colors, fonts, radii, shadows, spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold';

/**
 * Calm, premium button with large tap targets (accessibility). Soft press
 * feedback instead of loud bounces.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  leftIcon,
  style,
  fullWidth = true,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}) {
  const isDisabled = disabled || loading;

  const palette: Record<Variant, { bg: string; text: string; border?: string; shadow?: object }> = {
    primary: { bg: colors.ink, text: colors.paper, shadow: shadows.soft },
    gold: { bg: colors.guardianGold, text: colors.paper, shadow: shadows.goldGlow },
    secondary: { bg: 'transparent', text: colors.ink, border: colors.ashTaupe },
    ghost: { bg: 'transparent', text: colors.deepUmber },
  };
  const p = palette[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        {
          minHeight: 54,
          borderRadius: radii.pill,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.sm,
          backgroundColor: isDisabled ? colors.disabled : p.bg,
          borderWidth: p.border ? 1.5 : 0,
          borderColor: p.border,
          opacity: pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'center',
          width: fullWidth ? '100%' : undefined,
        },
        !isDisabled && variant !== 'secondary' && variant !== 'ghost' ? p.shadow : undefined,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.text} />
      ) : (
        <>
          {leftIcon ? <View>{leftIcon}</View> : null}
          <Text
            style={{
              color: isDisabled ? colors.charcoal : p.text,
              fontFamily: fonts.body,
              fontSize: 17,
              fontWeight: '600',
              letterSpacing: 0.2,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
