import { Pressable, Text, View } from 'react-native';
import { colors, fonts, shadows } from '@/constants/theme';
import { GoldStar } from '@/components/brand/GoldStar';
import { NODE_RADIUS } from '@/lib/kinship/constants';
import type { RenderNode } from '@/lib/kinship/types';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** A single light in the kinship canvas. Visual state reflects node status. */
export function FamilyTreeNode({
  node,
  selected = false,
  highlighted = false,
  onPress,
}: {
  node: RenderNode;
  selected?: boolean;
  highlighted?: boolean;
  onPress?: () => void;
}) {
  const size = NODE_RADIUS * 2;
  const isAnchor = !!node.isAnchor;
  const isPlaceholder = node.status === 'placeholder' || node.nodeType === 'placeholder';
  const isMemorial =
    node.nodeType === 'deceased' || node.status === 'memory_light' || node.status === 'memorial_pending';
  const isPet = node.nodeType === 'pet';
  const isClaimed = node.status === 'claimed' || isAnchor;

  const ringColor = isPlaceholder
    ? colors.ashTaupe
    : isMemorial
      ? colors.softGold
      : isClaimed
        ? colors.guardianGold
        : colors.ashTaupe;
  const bg = isPlaceholder
    ? colors.mistBeige
    : isMemorial || isPet
      ? colors.candlelight
      : isClaimed
        ? colors.paper
        : colors.mistBeige;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${node.displayName}${node.relationshipLabelFromAnchor ? `, ${node.relationshipLabelFromAnchor}` : ''}`}
      style={({ pressed }) => ({ alignItems: 'center', width: 132, opacity: pressed ? 0.85 : 1 })}
    >
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bg,
            borderWidth: isAnchor || selected ? 3 : 2,
            borderColor: selected || highlighted ? colors.guardianGold : ringColor,
            borderStyle: isPlaceholder ? 'dashed' : 'solid',
            opacity: isPlaceholder ? 0.8 : 1,
          },
          isClaimed || isMemorial || selected ? shadows.goldGlow : shadows.card,
        ]}
      >
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: size * 0.32,
            color: isMemorial ? colors.guardianGold : isPlaceholder ? colors.ashTaupe : colors.deepUmber,
            fontWeight: '600',
          }}
        >
          {initials(node.displayName)}
        </Text>
        {isMemorial ? (
          <View style={{ position: 'absolute', top: -6, right: -2 }}>
            <GoldStar size={16} />
          </View>
        ) : null}
        {isPet ? (
          <View style={{ position: 'absolute', bottom: -4, right: -2 }}>
            <Text style={{ fontSize: 14 }}>🐾</Text>
          </View>
        ) : null}
      </View>

      <Text
        numberOfLines={1}
        style={{ fontFamily: fonts.display, fontSize: 16, color: colors.ink, fontWeight: '600', marginTop: 8 }}
      >
        {node.displayName}
      </Text>
      {node.relationshipLabelFromAnchor && !isAnchor ? (
        <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 12, color: colors.deepUmber }}>
          {node.relationshipLabelFromAnchor}
        </Text>
      ) : null}
    </Pressable>
  );
}
