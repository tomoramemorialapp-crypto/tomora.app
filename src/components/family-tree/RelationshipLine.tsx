import { Text, View } from 'react-native';
import { colors, fonts, radii } from '@/constants/theme';

/** A thin gold line connecting two nodes, with an optional relationship chip. */
export function RelationshipLine({
  label,
  orientation = 'vertical',
  length = 56,
}: {
  label?: string;
  orientation?: 'vertical' | 'horizontal';
  length?: number;
}) {
  const isVertical = orientation === 'vertical';
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        height: isVertical ? length : undefined,
        width: isVertical ? undefined : length,
        flexDirection: isVertical ? 'column' : 'row',
      }}
    >
      <View
        style={{
          width: isVertical ? 2 : length,
          height: isVertical ? length : 2,
          backgroundColor: colors.guardianGold,
          opacity: 0.7,
          position: 'absolute',
        }}
      />
      {label ? (
        <View
          style={{
            backgroundColor: colors.candlelight,
            borderColor: colors.softGold,
            borderWidth: 1,
            borderRadius: radii.pill,
            paddingHorizontal: 12,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.deepUmber, fontWeight: '600' }}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
