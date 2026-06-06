import { View } from 'react-native';
import { colors } from '@/constants/theme';

/** A thin gold hairline broken by a small solid gold dot at its center. */
export function LightDivider({ width = 120, dotSize = 6 }: { width?: number; dotSize?: number }) {
  return (
    <View
      accessible={false}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
    >
      <View style={{ height: 1, width, backgroundColor: colors.softGold, opacity: 0.65 }} />
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: colors.guardianGold,
        }}
      />
      <View style={{ height: 1, width, backgroundColor: colors.softGold, opacity: 0.65 }} />
    </View>
  );
}
