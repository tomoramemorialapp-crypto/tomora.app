import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { RelationshipPicker } from '@/components/onboarding/RelationshipPicker';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Body, Display, Title } from '@/components/ui/Typography';
import { spacing } from '@/constants/theme';
import { copy, relationshipChoices } from '@/constants/copy';
import { useAppState } from '@/state/AppState';
import type { RelationshipType } from '@/types/models';

type Choice = (typeof relationshipChoices)[number];

export default function AddLovedOne() {
  const router = useRouter();
  const { draft, setDraft } = useAppState();
  const [choice, setChoice] = useState<Choice | undefined>(
    relationshipChoices.find((c) => c.relationshipType === draft.lovedOneRelationship),
  );
  const [name, setName] = useState(draft.lovedOneName);

  const canContinue = !!choice && name.trim().length > 0;

  const onContinue = () => {
    if (!choice) return;
    // Persist to the local draft; the tree is saved to Supabase at the Save step
    // (once the account exists), or right after email confirmation.
    setDraft({
      lovedOneName: name.trim(),
      lovedOneRelationship: choice.relationshipType as RelationshipType,
      lovedOneIsRemembered: choice.id === 'remembered',
    });
    router.push('/(onboarding)/reveal');
  };

  return (
    <ScreenContainer
      showBack
      footer={<Button label={copy.addLovedOne.cta} variant="gold" disabled={!canContinue} onPress={onContinue} />}
    >
      <View style={{ gap: spacing.lg }}>
        <OnboardingProgress step={3} total={6} />
        <View style={{ gap: spacing.xs }}>
          <Display style={{ fontSize: 32 }}>{copy.addLovedOne.prompt}</Display>
          <Body style={{ fontSize: 17 }}>{copy.addLovedOne.body}</Body>
        </View>

        <RelationshipPicker selectedId={choice?.id} onSelect={setChoice} />

        {choice ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            <Title style={{ fontSize: 22 }}>{copy.addLovedOne.namePrompt}</Title>
            <TextField
              value={name}
              onChangeText={setName}
              placeholder={choice.label}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => canContinue && onContinue()}
            />
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
