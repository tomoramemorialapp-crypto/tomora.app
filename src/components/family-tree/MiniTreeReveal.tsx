import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import type { FamilyNode } from '@/types/models';
import { FamilyNodeCircle } from './FamilyNodeCircle';

/**
 * Signature onboarding motion (soft, slow, meaningful):
 *   self light appears → gold line draws toward them → loved one light appears.
 *
 * The loved one is placed by generation relative to you:
 *   offset -1 → above you, 0 → beside you (right), +1 → below you.
 */
export function MiniTreeReveal({
  selfNode,
  lovedOneNode,
  relationshipLabel,
  offset = 1,
  lineLength = 64,
}: {
  selfNode: FamilyNode;
  lovedOneNode: FamilyNode;
  relationshipLabel?: string;
  offset?: -1 | 0 | 1;
  lineLength?: number;
}) {
  const selfOpacity = useRef(new Animated.Value(0)).current;
  const selfRise = useRef(new Animated.Value(14)).current;
  const lineGrow = useRef(new Animated.Value(0)).current;
  const lovedOpacity = useRef(new Animated.Value(0)).current;
  const lovedRise = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(selfOpacity, { toValue: 1, duration: 700, easing: ease, useNativeDriver: false }),
        Animated.timing(selfRise, { toValue: 0, duration: 700, easing: ease, useNativeDriver: false }),
      ]),
      Animated.timing(lineGrow, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), delay: 120, useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(lovedOpacity, { toValue: 1, duration: 800, easing: ease, useNativeDriver: false }),
        Animated.timing(lovedRise, { toValue: 0, duration: 800, easing: ease, useNativeDriver: false }),
      ]),
    ]).start();
  }, [lineGrow, lovedOpacity, lovedRise, selfOpacity, selfRise]);

  const self = (
    <Animated.View style={{ opacity: selfOpacity, transform: [{ translateY: selfRise }] }}>
      <FamilyNodeCircle node={selfNode} size={88} showBadge={false} />
    </Animated.View>
  );
  const loved = (
    <Animated.View style={{ opacity: lovedOpacity, transform: [{ translateY: lovedRise }] }}>
      <FamilyNodeCircle node={lovedOneNode} size={88} showBadge={false} />
    </Animated.View>
  );

  const labelBadge = relationshipLabel ? (
    <Animated.View
      style={{
        opacity: lineGrow,
        backgroundColor: colors.candlelight,
        borderColor: colors.softGold,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
      }}
    >
      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.deepUmber, fontWeight: '600' }}>
        {relationshipLabel}
      </Text>
    </Animated.View>
  ) : null;

  // Beside you (same generation): a horizontal connector to the right.
  if (offset === 0) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        {self}
        <View style={{ width: lineLength, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              height: 2,
              width: lineGrow.interpolate({ inputRange: [0, 1], outputRange: [0, lineLength] }),
              backgroundColor: colors.guardianGold,
              opacity: 0.8,
            }}
          />
          {labelBadge ? <View style={{ position: 'absolute', top: -26 }}>{labelBadge}</View> : null}
        </View>
        {loved}
      </View>
    );
  }

  // Vertical connector. Above you → loved one on top; below you → loved one beneath.
  const connector = (
    <View style={{ height: lineLength, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          width: 2,
          height: lineGrow.interpolate({ inputRange: [0, 1], outputRange: [0, lineLength] }),
          backgroundColor: colors.guardianGold,
          opacity: 0.8,
        }}
      />
      {labelBadge ? <View style={{ position: 'absolute' }}>{labelBadge}</View> : null}
    </View>
  );

  return (
    <View style={{ alignItems: 'center' }}>
      {offset === -1 ? loved : self}
      {connector}
      {offset === -1 ? self : loved}
    </View>
  );
}
