import { Pressable, type ViewStyle } from 'react-native';

import { colors, radii } from '@/constants/theme';

/** Compact icon-only control for secondary actions (share, QR, etc.). */
export function IconButton({
  onPress,
  accessibilityLabel,
  children,
  size = 44,
  style,
}: {
  onPress?: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: radii.pill,
          borderWidth: 1,
          borderColor: colors.mistBeige,
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
