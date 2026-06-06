import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Body, Display } from '@/components/ui/Typography';
import { ClaimTreeReveal, neighborsForReveal } from '@/components/family-tree/ClaimTreeReveal';
import { spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { useAppState } from '@/state/AppState';

export default function ClaimRevealScreen() {
  const router = useRouter();
  const { nodeId } = useLocalSearchParams<{ nodeId?: string }>();
  const { nodes, relationships, getNode, clearPendingClaimReveal, pendingClaimReveal } = useAppState();

  const claimedId = nodeId ?? pendingClaimReveal?.nodeId;
  const claimedNode = claimedId ? getNode(claimedId) : undefined;

  const relatedNodes = useMemo(() => {
    if (!claimedId) return [];
    return neighborsForReveal(claimedId, nodes, relationships);
  }, [claimedId, nodes, relationships]);

  const textFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(textFade, {
      toValue: 1,
      duration: 900,
      delay: 2400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [textFade]);

  useEffect(() => {
    if (!claimedId && !pendingClaimReveal) {
      router.replace('/(onboarding)/claim');
    }
  }, [claimedId, pendingClaimReveal, router]);

  if (!claimedNode) {
    return null;
  }

  const onContinue = () => {
    clearPendingClaimReveal();
    router.replace('/(tabs)/family-tree');
  };

  return (
    <ScreenContainer
      center
      footer={<Button label={copy.claimReveal.cta} variant="gold" onPress={onContinue} />}
    >
      <View style={{ alignItems: 'center', gap: spacing.xl }}>
        <ClaimTreeReveal claimedNode={claimedNode} relatedNodes={relatedNodes} />

        <Animated.View style={{ opacity: textFade, alignItems: 'center', gap: spacing.sm }}>
          <Display align="center" style={{ fontSize: 34 }}>
            {copy.claimReveal.title}
          </Display>
          <Body align="center" style={{ maxWidth: 340, fontSize: 18 }}>
            {copy.claimReveal.body}
          </Body>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}
