import { Pressable, Text, View } from 'react-native';
import { colors, fonts, radii } from '@/constants/theme';
import { GoldStar } from '@/components/brand/GoldStar';

/** Dashed, gentle prompt to grow the tree. */
export function AddRelativeCard({ onPress, size = 92 }: { onPress?: () => void; size?: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add a family member"
      style={({ pressed }) => ({ alignItems: 'center', gap: 10, width: size + 40, opacity: pressed ? 0.85 : 1 })}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: colors.softGold,
        }}
      >
        <GoldStar size={size * 0.3} />
      </View>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.deepUmber, fontWeight: '600', textAlign: 'center' }}>
        Add family
      </Text>
    </Pressable>
  );
}
