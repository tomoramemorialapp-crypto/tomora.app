import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Caption } from '@/components/ui/Typography';
import { GoldStar } from '@/components/brand/GoldStar';
import { colors, fonts, radii, spacing } from '@/constants/theme';

function LineSwatch({ dash, color }: { dash?: string; color: string }) {
  return (
    <View
      style={{
        width: 28,
        height: 0,
        borderTopWidth: 2,
        borderTopColor: color,
        borderStyle: dash ? 'dashed' : 'solid',
        opacity: 0.9,
      }}
    />
  );
}

function NodeSwatch({
  ringColor,
  bg,
  dashed,
  star,
  paw,
}: {
  ringColor: string;
  bg: string;
  dashed?: boolean;
  star?: boolean;
  paw?: boolean;
}) {
  const size = 22;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: 2,
          borderColor: ringColor,
          borderStyle: dashed ? 'dashed' : 'solid',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: fonts.display, fontSize: 9, color: colors.deepUmber, fontWeight: '600' }}>A</Text>
      </View>
      {star ? (
        <View style={{ position: 'absolute', top: -4, right: -2 }}>
          <GoldStar size={10} />
        </View>
      ) : null}
      {paw ? (
        <View style={{ position: 'absolute', bottom: -3, right: -2 }}>
          <Text style={{ fontSize: 9 }}>🐾</Text>
        </View>
      ) : null}
    </View>
  );
}

function LegendSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Caption style={{ color: colors.ashTaupe, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Caption>
      {children}
    </View>
  );
}

/** Line and node visual keys — shown inside the Filters sheet, not on the canvas. */
export function FamilyTreeLegend() {
  return (
    <View
      style={{
        gap: spacing.md,
        backgroundColor: colors.paper,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.mistBeige,
        padding: spacing.sm,
      }}
    >
      <LegendSection title="Parent lines">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <LineSwatch color={colors.guardianGold} />
            <Caption style={{ fontSize: 12 }}>Biological</Caption>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <LineSwatch color={colors.deepUmber} dash="14,7" />
            <Caption style={{ fontSize: 12 }}>Step</Caption>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <LineSwatch color={colors.ashTaupe} dash="2,7" />
            <Caption style={{ fontSize: 12 }}>In-law</Caption>
          </View>
        </View>
      </LegendSection>

      <LegendSection title="Node lights">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <NodeSwatch ringColor={colors.guardianGold} bg={colors.paper} />
            <Caption style={{ fontSize: 12 }}>Claimed</Caption>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <NodeSwatch ringColor={colors.softGold} bg={colors.candlelight} star />
            <Caption style={{ fontSize: 12 }}>In memory</Caption>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <NodeSwatch ringColor={colors.ashTaupe} bg={colors.mistBeige} dashed />
            <Caption style={{ fontSize: 12 }}>Placeholder</Caption>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <NodeSwatch ringColor={colors.ashTaupe} bg={colors.mistBeige} />
            <Caption style={{ fontSize: 12 }}>Unclaimed</Caption>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <NodeSwatch ringColor={colors.guardianGold} bg={colors.candlelight} paw />
            <Caption style={{ fontSize: 12 }}>Pet</Caption>
          </View>
        </View>
      </LegendSection>
    </View>
  );
}
