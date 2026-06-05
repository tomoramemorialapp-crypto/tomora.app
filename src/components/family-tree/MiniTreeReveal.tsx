import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import type { FamilyNode } from '@/types/models';
import { FamilyNodeCircle } from './FamilyNodeCircle';

/**
 * Signature onboarding motion (soft, slow, meaningful):
 *   self light appears → gold line draws down → loved one light appears.
 * No confetti, no bounce. Gentle fades and an organic line draw.
 */
export function MiniTreeReveal({
  selfNode,
  lovedOneNode,
  relationshipLabel,
  lineLength = 64,
}: {
  selfNode: FamilyNode;
  lovedOneNode: FamilyNode;
  relationshipLabel?: string;
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

  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View style={{ opacity: selfOpacity, transform: [{ translateY: selfRise }] }}>
        <FamilyNodeCircle node={selfNode} size={88} showBadge={false} />
      </Animated.View>

      {/* drawing gold line */}
      <View style={{ height: lineLength, alignItems: 'center', justifyContent: 'flex-start' }}>
        <Animated.View
          style={{
            width: 2,
            height: lineGrow.interpolate({ inputRange: [0, 1], outputRange: [0, lineLength] }),
            backgroundColor: colors.guardianGold,
            opacity: 0.8,
          }}
        />
        {relationshipLabel ? (
          <Animated.View
            style={{
              position: 'absolute',
              top: lineLength / 2 - 14,
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
        ) : null}
      </View>

      <Animated.View style={{ opacity: lovedOpacity, transform: [{ translateY: lovedRise }] }}>
        <FamilyNodeCircle node={lovedOneNode} size={88} showBadge={false} />
      </Animated.View>
    </View>
  );
}
