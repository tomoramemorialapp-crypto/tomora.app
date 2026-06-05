import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { MiniTreeReveal } from '@/components/family-tree/MiniTreeReveal';
import { Button } from '@/components/ui/Button';
import { Body, Display } from '@/components/ui/Typography';
import { spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { useAppState } from '@/state/AppState';
import { generationOffset, nodeStatusFor, isLivingFor, relationshipLabel } from '@/lib/relationshipUtils';
import type { FamilyNode } from '@/types/models';

export default function Reveal() {
  const router = useRouter();
  const { draft } = useAppState();

  // Preview nodes built from the local draft (not yet persisted to the DB).
  const { selfNode, lovedOneNode } = useMemo(() => {
    const now = new Date().toISOString();
    const self: FamilyNode = {
      id: 'preview_self',
      familyTreeId: 'preview',
      ownerAccountId: 'preview',
      displayName: draft.selfName.trim() || 'You',
      status: 'claimed',
      isLiving: true,
      defaultVisibility: 'family_tree',
      profile: {},
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
    const loved: FamilyNode = {
      id: 'preview_loved',
      familyTreeId: 'preview',
      displayName: draft.lovedOneName.trim() || 'Loved one',
      status: nodeStatusFor(draft.lovedOneRelationship, draft.lovedOneIsRemembered),
      isLiving: isLivingFor(draft.lovedOneRelationship, draft.lovedOneIsRemembered),
      defaultVisibility: 'family_tree',
      profile: {},
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
    return { selfNode: self, lovedOneNode: loved };
  }, [draft]);

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

  if (!draft.lovedOneName.trim()) {
    router.replace('/(onboarding)/add-loved-one');
    return null;
  }

  return (
    <ScreenContainer
      center
      showBack
      footer={
        <Button label={copy.reveal.primaryCta} variant="gold" onPress={() => router.push('/(onboarding)/save')} />
      }
    >
      <View style={{ alignItems: 'center', gap: spacing.xl }}>
        <MiniTreeReveal
          selfNode={selfNode}
          lovedOneNode={lovedOneNode}
          offset={generationOffset(draft.lovedOneRelationship)}
          relationshipLabel={relationshipLabel(draft.lovedOneRelationship)}
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
