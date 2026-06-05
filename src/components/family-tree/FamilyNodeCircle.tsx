import { Pressable, Text, View } from 'react-native';
import { colors, fonts, shadows } from '@/constants/theme';
import type { FamilyNode } from '@/types/models';
import { NodeStatusBadge } from '@/components/ui/Badge';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * A person rendered as a light. Visual state reflects node status:
 * - claimed: solid warm ring
 * - placeholder/invited: dashed, awaiting a real person
 * - managed/memory_light: candlelight ring (cared for / remembered)
 */
export function FamilyNodeCircle({
  node,
  size = 92,
  onPress,
  showBadge = true,
  showName = true,
}: {
  node: FamilyNode;
  size?: number;
  onPress?: () => void;
  showBadge?: boolean;
  showName?: boolean;
}) {
  const memorial = node.status === 'memory_light' || node.status === 'memorial_pending' || node.isLiving === false;
  const awaiting = node.status === 'placeholder' || node.status === 'invited';

  const ringColor = memorial ? colors.softGold : node.status === 'claimed' ? colors.guardianGold : colors.ashTaupe;
  const bg = memorial ? colors.candlelight : node.status === 'claimed' ? colors.paper : colors.mistBeige;

  const circle = (
    <View style={{ alignItems: 'center', gap: 10, width: size + 40 }}>
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bg,
            borderWidth: 2,
            borderColor: ringColor,
            borderStyle: awaiting ? 'dashed' : 'solid',
          },
          node.status === 'claimed' || memorial ? shadows.goldGlow : shadows.card,
        ]}
      >
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: size * 0.34,
            color: memorial ? colors.guardianGold : colors.deepUmber,
            fontWeight: '600',
          }}
        >
          {initials(node.displayName)}
        </Text>
      </View>

      {showName ? (
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.display, fontSize: 18, color: colors.ink, fontWeight: '600' }}
        >
          {node.displayName}
        </Text>
      ) : null}
      {showBadge ? <NodeStatusBadge status={node.status} /> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${node.displayName}, open Life Profile`}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {circle}
      </Pressable>
    );
  }
  return circle;
}
