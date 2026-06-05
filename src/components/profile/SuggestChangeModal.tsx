import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Body, Caption } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import type { FamilyNode } from '@/types/models';
import type { ProfileFieldKey } from '@/types/profile';
import { PROFILE_FIELD_KEYS, PROFILE_FIELD_LABELS } from '@/types/profile';
import { formatDateValue, formatGenderSex, formatPlace } from '@/lib/profile';

function currentValueText(node: FamilyNode, key: ProfileFieldKey): string {
  const p = node.profile;
  switch (key) {
    case 'fullName':
      return p.fullName?.value ?? node.displayName;
    case 'alternateNames':
      return (p.alternateNames?.value ?? []).join(', ');
    case 'dateOfBirth':
      return formatDateValue(p.dateOfBirth?.value);
    case 'dateOfDeath':
      return formatDateValue(p.dateOfDeath?.value);
    case 'placeOfBirth':
      return formatPlace(p.placeOfBirth?.value);
    case 'placeOfDeath':
      return formatPlace(p.placeOfDeath?.value);
    case 'genderSex':
      return formatGenderSex(p.genderSex?.value);
    case 'languages':
      return (p.languages?.value ?? []).join(', ');
    case 'notesHistory':
      return p.notesHistory?.value?.notes ?? '';
    default:
      return '';
  }
}

/** Lets a non-owner propose a change to a single field for the owner to review. */
export function SuggestChangeModal({
  visible,
  node,
  onClose,
}: {
  visible: boolean;
  node: FamilyNode;
  onClose: () => void;
}) {
  const { submitSuggestedEdit } = useAppState();
  const [fieldKey, setFieldKey] = useState<ProfileFieldKey>('fullName');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setFieldKey('fullName');
    setValue('');
    setReason('');
    setSubmitting(false);
    setDone(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  async function submit() {
    if (!value.trim()) return;
    setSubmitting(true);
    try {
      await submitSuggestedEdit({
        nodeId: node.id,
        fieldKey,
        currentValueSnapshot: currentValueText(node, fieldKey),
        suggestedValue: value.trim(),
        reason: reason.trim() || undefined,
      });
      setDone(true);
    } catch (e) {
      console.warn('[tomora] suggest edit failed', e);
      setSubmitting(false);
    }
  }

  // Photo is not suggestible via plain text here.
  const fields = PROFILE_FIELD_KEYS.filter((k) => k !== 'profilePhoto');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={close} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.ivory,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          padding: spacing.lg,
          maxHeight: '88%',
        }}
      >
        {done ? (
          <View style={{ gap: spacing.md, paddingVertical: spacing.lg }}>
            <SectionHeader title="Suggestion sent" overline="Thank you" />
            <Body>Your suggestion has been sent for review.</Body>
            <Button label="Done" variant="gold" onPress={close} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
            <SectionHeader title="Suggest a Change" overline={node.displayName} />
            <Caption>Add context for this suggested change. The owner can approve or decline it.</Caption>

            <View style={{ gap: 6 }}>
              <Caption style={{ color: colors.ashTaupe }}>Which detail?</Caption>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {fields.map((k) => {
                  const active = k === fieldKey;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setFieldKey(k)}
                      style={{
                        backgroundColor: active ? 'rgba(184,135,47,0.14)' : colors.white,
                        borderColor: active ? colors.guardianGold : colors.mistBeige,
                        borderWidth: 1.5,
                        borderRadius: radii.pill,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <Body style={{ fontSize: 13, color: active ? colors.guardianGold : colors.charcoal }}>
                        {PROFILE_FIELD_LABELS[k]}
                      </Body>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Card padded>
              <Caption style={{ color: colors.ashTaupe }}>Current</Caption>
              <Body>{currentValueText(node, fieldKey) || '—'}</Body>
            </Card>

            <TextField label="Suggested value" value={value} onChangeText={setValue} placeholder="What should it say?" />
            <TextField label="Why? (optional)" value={reason} onChangeText={setReason} placeholder="Add context" multiline />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="secondary" onPress={close} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={submitting ? 'Sending…' : 'Send suggestion'}
                  variant="gold"
                  disabled={submitting || !value.trim()}
                  onPress={submit}
                />
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
