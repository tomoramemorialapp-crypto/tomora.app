import { View } from 'react-native';
import { colors } from '@/constants/theme';
import { GoldStar } from './GoldStar';

/** A thin gold hairline with a small light at its center. */
export function LightDivider({ width = 120 }: { width?: number }) {
  return (
    <View
      accessible={false}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
    >
      <View style={{ height: 1, width, backgroundColor: colors.softGold, opacity: 0.6 }} />
      <GoldStar size={10} />
      <View style={{ height: 1, width, backgroundColor: colors.softGold, opacity: 0.6 }} />
    </View>
  );
}
