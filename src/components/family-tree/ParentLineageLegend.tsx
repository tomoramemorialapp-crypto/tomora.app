import { View } from 'react-native';
import { Caption } from '@/components/ui/Typography';
import { colors, radii, shadows, spacing } from '@/constants/theme';

function Swatch({ dash, color }: { dash?: string; color: string }) {
  return (
    <View style={{ width: 28, height: 0, borderTopWidth: 2, borderTopColor: color, borderStyle: dash ? 'dashed' : 'solid', opacity: 0.9 }} />
  );
}

/** Compact key for biological vs step vs in-law parent lines on the tree canvas. */
export function ParentLineageLegend() {
  return (
    <View
      style={{
        backgroundColor: colors.paper,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.mistBeige,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        gap: 4,
        ...shadows.card,
      }}
    >
      <Caption style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: colors.ashTaupe }}>
        Parent lines
      </Caption>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Swatch color={colors.guardianGold} />
          <Caption style={{ fontSize: 11 }}>Biological</Caption>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Swatch color={colors.deepUmber} dash="14,7" />
          <Caption style={{ fontSize: 11 }}>Step</Caption>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Swatch color={colors.ashTaupe} dash="2,7" />
          <Caption style={{ fontSize: 11 }}>In-law</Caption>
        </View>
      </View>
    </View>
  );
}
