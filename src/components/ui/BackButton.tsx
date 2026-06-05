import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';

/** A calm, brand-styled back affordance (drawn chevron, no icon dependency). */
export function BackButton({ onPress, color = colors.deepUmber }: { onPress?: () => void; color?: string }) {
  const router = useRouter();
  const handlePress =
    onPress ??
    (() => {
      if (router.canGoBack()) router.back();
    });

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={10}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.candlelight : 'transparent',
      })}
    >
      <View
        style={{
          width: 11,
          height: 11,
          borderTopWidth: 2.5,
          borderLeftWidth: 2.5,
          borderColor: color,
          transform: [{ rotate: '-45deg' }],
          marginLeft: 3,
        }}
      />
    </Pressable>
  );
}
