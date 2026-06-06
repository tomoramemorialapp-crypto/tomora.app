import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { FamilyNode, Relationship } from '@/types/models';
import { FamilyNodeCircle } from './FamilyNodeCircle';

/**
 * Post-claim reveal: claimed node glows in, connector draws, nearby nodes fade in.
 */
export function ClaimTreeReveal({
  claimedNode,
  relatedNodes,
  lineLength = 56,
}: {
  claimedNode: FamilyNode;
  relatedNodes: FamilyNode[];
  lineLength?: number;
}) {
  const glow = useRef(new Animated.Value(0)).current;
  const claimedOpacity = useRef(new Animated.Value(0)).current;
  const claimedRise = useRef(new Animated.Value(16)).current;
  const lineGrow = useRef(new Animated.Value(0)).current;
  const relatedAnims = useMemo(
    () => relatedNodes.map(() => ({ opacity: new Animated.Value(0), rise: new Animated.Value(12) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one anim set per related node count
    [relatedNodes.length],
  );

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    const seq: Animated.CompositeAnimation[] = [
      Animated.parallel([
        Animated.timing(glow, { toValue: 1, duration: 900, easing: ease, useNativeDriver: false }),
        Animated.timing(claimedOpacity, { toValue: 1, duration: 800, easing: ease, useNativeDriver: false }),
        Animated.timing(claimedRise, { toValue: 0, duration: 800, easing: ease, useNativeDriver: false }),
      ]),
      Animated.timing(lineGrow, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ];

    relatedAnims.forEach((anim, i) => {
      seq.push(
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 650,
            delay: i * 180,
            easing: ease,
            useNativeDriver: false,
          }),
          Animated.timing(anim.rise, {
            toValue: 0,
            duration: 650,
            delay: i * 180,
            easing: ease,
            useNativeDriver: false,
          }),
        ]),
      );
    });

    Animated.sequence(seq).start();
  }, [claimedOpacity, claimedRise, glow, lineGrow, relatedAnims]);

  const anchor = relatedNodes[0];

  return (
    <View style={{ alignItems: 'center', gap: lineLength / 2 }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: colors.guardianGold,
          opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }),
          transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] }) }],
        }}
      />

      {anchor ? (
        <Animated.View style={{ opacity: relatedAnims[0]?.opacity ?? 1, transform: [{ translateY: relatedAnims[0]?.rise ?? 0 }] }}>
          <FamilyNodeCircle node={anchor} size={80} showBadge={false} />
        </Animated.View>
      ) : null}

      {anchor ? (
        <View style={{ height: lineLength, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              width: 2,
              height: lineGrow.interpolate({ inputRange: [0, 1], outputRange: [0, lineLength] }),
              backgroundColor: colors.guardianGold,
              opacity: 0.85,
            }}
          />
        </View>
      ) : null}

      <Animated.View style={{ opacity: claimedOpacity, transform: [{ translateY: claimedRise }] }}>
        <FamilyNodeCircle node={claimedNode} size={96} showBadge={false} />
      </Animated.View>

      {relatedNodes.length > 1 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20, marginTop: 24 }}>
          {relatedNodes.slice(1).map((node, i) => {
            const anim = relatedAnims[i + 1];
            return (
              <Animated.View
                key={node.id}
                style={{ opacity: anim?.opacity ?? 1, transform: [{ translateY: anim?.rise ?? 0 }] }}
              >
                <FamilyNodeCircle node={node} size={64} showBadge={false} />
              </Animated.View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** Pick nodes to show in the reveal (claimed node + up to 4 neighbors). */
export function neighborsForReveal(
  claimedNodeId: string,
  nodes: FamilyNode[],
  relationships: Relationship[],
  limit = 5,
): FamilyNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const neighborIds = new Set<string>();
  for (const r of relationships) {
    if (r.fromNodeId === claimedNodeId) neighborIds.add(r.toNodeId);
    if (r.toNodeId === claimedNodeId) neighborIds.add(r.fromNodeId);
  }
  const neighbors = [...neighborIds]
    .map((id) => byId.get(id))
    .filter((n): n is FamilyNode => !!n)
    .slice(0, limit);
  return neighbors;
}
