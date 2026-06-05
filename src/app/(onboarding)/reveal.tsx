import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { MiniTreeReveal } from '@/components/family-tree/MiniTreeReveal';
import { Button } from '@/components/ui/Button';
import { Body, Display } from '@/components/ui/Typography';
import { spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { useAppState } from '@/state/AppState';
import { relationshipLabel } from '@/lib/relationshipUtils';

export default function Reveal() {
  const router = useRouter();
  const { nodes, relationships } = useAppState();

  const selfNode = nodes.find((n) => n.ownerAccountId) ?? nodes[0];
  const lovedOneNode = nodes.find((n) => n.id !== selfNode?.id);
  const rel = relationships[0];

  // copy fades in after the line draws
  const textFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(textFade, {
      toValue: 1,
      duration: 900,
      delay: 2200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [textFade]);

  if (!selfNode || !lovedOneNode) {
    // safety: nothing committed yet
    router.replace('/(onboarding)/add-self');
    return null;
  }

  return (
    <ScreenContainer
      center
      footer={
        <View style={{ gap: spacing.md }}>
          <Button label={copy.reveal.primaryCta} variant="gold" onPress={() => router.push('/(onboarding)/save')} />
          <Button
            label={copy.reveal.secondaryCta}
            variant="ghost"
            onPress={() => router.push('/(tabs)/family-tree')}
          />
        </View>
      }
    >
      <View style={{ alignItems: 'center', gap: spacing.xl }}>
        <MiniTreeReveal
          selfNode={selfNode}
          lovedOneNode={lovedOneNode}
          relationshipLabel={rel ? relationshipLabel(rel.relationshipType) : undefined}
        />

        <Animated.View style={{ opacity: textFade, alignItems: 'center', gap: spacing.sm }}>
          <Display align="center" style={{ fontSize: 36 }}>
            {copy.reveal.title}
          </Display>
          <Body align="center" style={{ maxWidth: 340, fontSize: 18 }}>
            {copy.reveal.body}
          </Body>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}
