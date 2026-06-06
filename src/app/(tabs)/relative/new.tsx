import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { RelationshipPicker } from '@/components/onboarding/RelationshipPicker';
import { TextField } from '@/components/ui/TextField';
import { Toggle } from '@/components/ui/Toggle';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { DisconnectedNodeBridgePrompt } from '@/components/family-tree/DisconnectedNodeBridgePrompt';
import { colors, spacing } from '@/constants/theme';
import { relationshipChoices } from '@/constants/copy';
import { useAppState } from '@/state/AppState';
import type { RelationshipType } from '@/types/models';

type Choice = (typeof relationshipChoices)[number];

export default function NewRelative() {
  const router = useRouter();
  const { addRelative } = useAppState();

  const [choice, setChoice] = useState<Choice | undefined>(undefined);
  const [name, setName] = useState('');
  const [isRemembered, setIsRemembered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = !!choice && name.trim().length > 0 && !busy;
  const isPet = choice?.relationshipType === 'pet';
  const isUnsure = choice?.relationshipType === 'other';

  const onSave = async () => {
    if (!choice) return;
    setError(null);
    setBusy(true);
    try {
      await addRelative({
        name: name.trim(),
        relationshipType: choice.relationshipType as RelationshipType,
        isRemembered,
        tags: isUnsure ? ['Unknown link'] : undefined,
      });
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not add this family member. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer
      maxWidth={620}
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button label="Add to my Family Tree" variant="gold" disabled={!canSave} loading={busy} onPress={onSave} />
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>Grow your Family Tree</Caption>
          <Display style={{ fontSize: 32 }}>Add a family member</Display>
          <Body style={{ fontSize: 17 }}>Who would you like to add?</Body>
        </View>

        <RelationshipPicker
          selectedId={choice?.id}
          onSelect={(next) => {
            setChoice(next);
            if (next.relationshipType === 'pet') setIsRemembered(false);
          }}
        />

        {choice ? (
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            <View style={{ gap: spacing.sm }}>
              <Title style={{ fontSize: 22 }}>What is their name?</Title>
              <TextField
                value={name}
                onChangeText={setName}
                placeholder={choice.label}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => canSave && onSave()}
              />
            </View>

            {!isPet && !isUnsure ? (
              <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
                <Toggle
                  value={isRemembered}
                  onValueChange={setIsRemembered}
                  label="In loving memory"
                  description="Turn this on if they’ve passed away. Their node never needs to be claimed."
                />
              </Card>
            ) : null}

            <DisconnectedNodeBridgePrompt
              relationshipType={choice.relationshipType as RelationshipType}
              relationshipLabel={choice.label}
            />
          </View>
        ) : null}

        {error ? <Caption style={{ color: colors.error, fontSize: 14 }}>{error}</Caption> : null}
      </View>
    </ScreenContainer>
  );
}
