import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { TomoraEmblem } from '@/components/brand/TomoraEmblem';
import { TomoraLogo } from '@/components/brand/TomoraLogo';
import { LightDivider } from '@/components/brand/LightDivider';
import { AppFooter } from '@/components/brand/AppFooter';
import { Body, Caption } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import { useT } from '@/i18n';

// Brand lockup proportions (emblem → wordmark → divider → tagline), per brand sketch.
const EMBLEM_SIZE = 176;
const WORDMARK_HEIGHT = 48;
const WORDMARK_WIDTH = WORDMARK_HEIGHT * (2626 / 400);
const DIVIDER_LINE = Math.round(WORDMARK_WIDTH * 0.36);

export default function Welcome() {
  const router = useRouter();
  const t = useT();
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
      <Animated.View style={{ alignItems: 'center', opacity: fade, transform: [{ translateY: rise }] }}>
        {/* Brand lockup — emblem, wordmark, divider, tagline */}
        <View style={{ alignItems: 'center', width: '100%', maxWidth: WORDMARK_WIDTH + 40 }}>
          <View style={{ alignItems: 'center', justifyContent: 'center', height: EMBLEM_SIZE + 48, marginBottom: spacing.lg }}>
            <Animated.View
              style={{
                position: 'absolute',
                width: EMBLEM_SIZE * 1.45,
                height: EMBLEM_SIZE * 1.45,
                borderRadius: EMBLEM_SIZE,
                backgroundColor: colors.candlelight,
                opacity: glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.25, 0.6] }),
                transform: [{ scale: glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.92, 1.08] }) }],
              }}
            />
            <TomoraEmblem size={EMBLEM_SIZE} glow={false} />
          </View>

          <TomoraLogo size={WORDMARK_HEIGHT} showEmblem={false} layout="vertical" />

          <View style={{ marginTop: spacing.md }}>
            <LightDivider width={DIVIDER_LINE} />
          </View>

          <Caption
            align="center"
            style={{
              marginTop: spacing.sm,
              fontSize: 11,
              letterSpacing: 3.2,
              color: colors.ink,
              fontWeight: '500',
            }}
          >
            {t('welcome.tagline')}
          </Caption>
        </View>

        <Body align="center" style={{ maxWidth: 360, fontSize: 18, marginTop: spacing.xl }}>
          {t('welcome.body')}
        </Body>
      </Animated.View>

      <View style={{ height: spacing.xxl }} />

      <View style={{ gap: spacing.md, width: '100%' }}>
        <Button label={t('welcome.primaryCta')} variant="gold" onPress={() => router.push('/(onboarding)/add-self')} />
        <Button label={t('welcome.secondaryCta')} variant="secondary" onPress={() => router.push('/(onboarding)/claim')} />
        <Button label={t('welcome.login')} variant="ghost" onPress={() => router.push('/login')} />
      </View>

      <AppFooter showLogo={false} />
    </ScreenContainer>
  );
}
