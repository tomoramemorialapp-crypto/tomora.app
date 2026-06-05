import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { TomoraEmblem } from '@/components/brand/TomoraEmblem';
import { LightDivider } from '@/components/brand/LightDivider';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, fonts, spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';

export default function Welcome() {
  const router = useRouter();
  const glow = useRef(new Animated.Value(0.4)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(rise, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0.4, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fade, glow, rise]);

  return (
    <ScreenContainer center>
      <Animated.View style={{ alignItems: 'center', opacity: fade, transform: [{ translateY: rise }], gap: spacing.lg }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <Animated.View
            style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: 200,
              backgroundColor: colors.candlelight,
              opacity: glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.25, 0.6] }),
              transform: [{ scale: glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.92, 1.08] }) }],
            }}
          />
          <TomoraEmblem size={132} glow={false} />
        </View>

        <Caption style={{ fontFamily: fonts.display, fontSize: 26, letterSpacing: 2, color: colors.ink }}>
          tomora
        </Caption>

        <Display align="center" style={{ fontSize: 44 }}>
          {copy.welcome.tagline}
        </Display>

        <LightDivider width={90} />

        <Body align="center" style={{ maxWidth: 360, fontSize: 18 }}>
          {copy.welcome.body}
        </Body>
      </Animated.View>

      <View style={{ height: spacing.xxl }} />

      <View style={{ gap: spacing.md, width: '100%' }}>
        <Button label={copy.welcome.primaryCta} variant="gold" onPress={() => router.push('/(onboarding)/choose-path')} />
        <Button label={copy.welcome.secondaryCta} variant="secondary" onPress={() => router.push('/(onboarding)/choose-path')} />
      </View>
    </ScreenContainer>
  );
}
