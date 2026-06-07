import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { parentPairingCopy } from '@/constants/copy';
import {
  buildParentPartnershipEdge,
  partnershipUsesFormerDetail,
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
  { id: 'current', label: parentPairingCopy.statusCurrent },
  { id: 'separated', label: parentPairingCopy.statusSeparated },
  { id: 'divorced', label: parentPairingCopy.statusDivorced },
  { id: 'widowed', label: parentPairingCopy.statusWidowed },
  { id: 'unknown', label: parentPairingCopy.statusUnknown },
];

function OptionChip({
  label,
  active,
  onPress,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: radii.pill,
        borderWidth: 1.5,
        borderColor: active ? colors.guardianGold : colors.mistBeige,
        backgroundColor: active ? colors.goldGlow : colors.paper,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Body style={{ fontWeight: '600', color: active ? colors.guardianGold : colors.ink }}>{label}</Body>
    </Pressable>
  );
}

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
    if (next === 'former_partner') {
      setLifecycle('separated');
    }
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
      lifecycle: choice === 'former_partner' ? 'separated' : lifecycle,
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
          lifecycle: choice === 'former_partner' ? 'separated' : lifecycle,
          husbandParentId,
          nodes,
        })
      : null;

  const showStatusStep = choice === 'spouse' || choice === 'partner';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
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
                label={parentPairingCopy.formerPartner}
                variant="secondary"
                disabled={busy}
                onPress={() => onPickChoice('former_partner')}
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
                      return (
                        <OptionChip
                          key={id}
                          label={name}
                          active={husbandParentId === id}
                          onPress={() => setHusbandParentId(id)}
                          disabled={busy}
                        />
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {showStatusStep ? (
                <View style={{ gap: spacing.sm }}>
                  <Caption style={{ color: colors.deepUmber }}>{parentPairingCopy.statusPrompt}</Caption>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {LIFECYCLE_OPTIONS.map((opt) => (
                      <OptionChip
                        key={opt.id}
                        label={opt.label}
                        active={lifecycle === opt.id}
                        onPress={() => setLifecycle(opt.id)}
                        disabled={busy}
                      />
                    ))}
                  </View>
                  {partnershipUsesFormerDetail(choice, lifecycle) ? (
                    <Caption style={{ color: colors.ashTaupe }}>{parentPairingCopy.separatedNote}</Caption>
                  ) : null}
                </View>
              ) : null}

              {previewEdge ? (
                <Caption style={{ color: colors.deepUmber }}>
                  {parentPairingCopy.preview(
                    nodes.find((n) => n.id === previewEdge.fromNodeId)?.displayName ?? 'Parent',
                    nodes.find((n) => n.id === previewEdge.toNodeId)?.displayName ?? 'Parent',
                    previewEdge.relationshipDetail?.startsWith('former_')
                      ? 'former partner'
                      : previewEdge.relationshipType,
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
