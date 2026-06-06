import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { parentPairingCopy } from '@/constants/copy';
import {
  buildParentPartnershipEdge,
  type ParentPairingOpportunity,
  type ParentPartnershipChoice,
  type PartnershipLifecycle,
} from '@/lib/parentPairing';
import type { FamilyNode } from '@/types/models';

type Props = {
  visible: boolean;
  opportunity: ParentPairingOpportunity | null;
  nodes: FamilyNode[];
  busy?: boolean;
  onConfirm: (params: {
    choice: ParentPartnershipChoice;
    lifecycle: PartnershipLifecycle;
    husbandParentId?: string;
  }) => void | Promise<void>;
  onDismiss: () => void;
};

const LIFECYCLE_OPTIONS: { id: PartnershipLifecycle; label: string }[] = [
  { id: 'current', label: 'Current' },
  { id: 'separated', label: 'Separated' },
];

export function ParentPairingPrompt({
  visible,
  opportunity,
  nodes,
  busy,
  onConfirm,
  onDismiss,
}: Props) {
  const [choice, setChoice] = useState<ParentPartnershipChoice | null>(null);
  const [lifecycle, setLifecycle] = useState<PartnershipLifecycle>('current');
  const [husbandParentId, setHusbandParentId] = useState<string | undefined>(undefined);

  if (!opportunity) return null;

  const reset = () => {
    setChoice(null);
    setLifecycle('current');
    setHusbandParentId(undefined);
  };

  const close = () => {
    reset();
    onDismiss();
  };

  const onPickChoice = (next: ParentPartnershipChoice) => {
    if (next === 'co_parent_only') {
      void onConfirm({ choice: next, lifecycle: 'current' });
      reset();
      return;
    }
    setChoice(next);
    if (next === 'spouse' && !husbandParentId) {
      setHusbandParentId(opportunity.parentAId);
    }
  };

  const onSavePartnership = async () => {
    if (!choice || choice === 'co_parent_only') {
      close();
      return;
    }
    await onConfirm({
      choice,
      lifecycle,
      husbandParentId: choice === 'spouse' ? husbandParentId : undefined,
    });
    reset();
  };

  const previewEdge =
    choice && choice !== 'co_parent_only'
      ? buildParentPartnershipEdge({
          fromParentId: opportunity.parentAId,
          toParentId: opportunity.parentBId,
          choice,
          husbandParentId,
          nodes,
        })
      : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(44,36,32,0.45)',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
        onPress={close}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.ivory,
            borderRadius: radii.lg,
            padding: spacing.lg,
            gap: spacing.md,
            maxWidth: 440,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <Display style={{ fontSize: 26 }}>{parentPairingCopy.title}</Display>
          <Body style={{ fontSize: 17, color: colors.deepUmber }}>
            {parentPairingCopy.body(opportunity.parentAName, opportunity.parentBName, opportunity.childName)}
          </Body>
          <Caption style={{ color: colors.ashTaupe }}>{parentPairingCopy.note}</Caption>

          {!choice ? (
            <View style={{ gap: spacing.sm }}>
              <Button
                label={parentPairingCopy.spouses}
                variant="gold"
                disabled={busy}
                onPress={() => onPickChoice('spouse')}
              />
              <Button
                label={parentPairingCopy.partners}
                variant="secondary"
                disabled={busy}
                onPress={() => onPickChoice('partner')}
              />
              <Button
                label={parentPairingCopy.coParentsOnly}
                variant="secondary"
                disabled={busy}
                onPress={() => onPickChoice('co_parent_only')}
              />
              <Button label={parentPairingCopy.notNow} variant="ghost" disabled={busy} onPress={close} />
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              {choice === 'spouse' ? (
                <View style={{ gap: spacing.sm }}>
                  <Caption style={{ color: colors.deepUmber }}>{parentPairingCopy.husbandPrompt}</Caption>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {[opportunity.parentAId, opportunity.parentBId].map((id) => {
                      const name = id === opportunity.parentAId ? opportunity.parentAName : opportunity.parentBName;
                      const active = husbandParentId === id;
                      return (
                        <Pressable
                          key={id}
                          onPress={() => setHusbandParentId(id)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: radii.pill,
                            borderWidth: 1.5,
                            borderColor: active ? colors.guardianGold : colors.mistBeige,
                            backgroundColor: active ? 'rgba(184,135,47,0.12)' : colors.white,
                          }}
                        >
                          <Body style={{ fontWeight: '600', color: active ? colors.guardianGold : colors.ink }}>
                            {name}
                          </Body>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <View style={{ gap: spacing.sm }}>
                <Caption style={{ color: colors.deepUmber }}>{parentPairingCopy.statusPrompt}</Caption>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {LIFECYCLE_OPTIONS.map((opt) => {
                    const active = lifecycle === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => setLifecycle(opt.id)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: radii.pill,
                          borderWidth: 1.5,
                          borderColor: active ? colors.guardianGold : colors.mistBeige,
                          backgroundColor: active ? 'rgba(184,135,47,0.12)' : colors.white,
                        }}
                      >
                        <Body style={{ fontWeight: '600', color: active ? colors.guardianGold : colors.ink }}>
                          {opt.label}
                        </Body>
                      </Pressable>
                    );
                  })}
                </View>
                {lifecycle === 'separated' ? (
                  <Caption style={{ color: colors.ashTaupe }}>{parentPairingCopy.separatedNote}</Caption>
                ) : null}
              </View>

              {previewEdge ? (
                <Caption style={{ color: colors.deepUmber }}>
                  {parentPairingCopy.preview(
                    nodes.find((n) => n.id === previewEdge.fromNodeId)?.displayName ?? 'Parent',
                    nodes.find((n) => n.id === previewEdge.toNodeId)?.displayName ?? 'Parent',
                    previewEdge.relationshipType,
                  )}
                </Caption>
              ) : null}

              <View style={{ gap: spacing.sm }}>
                <Button
                  label={busy ? 'Saving…' : parentPairingCopy.confirm}
                  variant="gold"
                  disabled={busy || (choice === 'spouse' && !husbandParentId)}
                  loading={busy}
                  onPress={onSavePartnership}
                />
                <Button label="Back" variant="ghost" disabled={busy} onPress={() => setChoice(null)} />
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
