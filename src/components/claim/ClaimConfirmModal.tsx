import { Modal, Pressable, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { relationshipLabel } from '@/lib/relationshipUtils';
import type { InvitePreview } from '@/services/inviteService';
import type { RelationshipType } from '@/types/models';

type Props = {
  visible: boolean;
  preview: InvitePreview;
  busy?: boolean;
  onConfirm: () => void;
  onNotMe: () => void;
  onHelp: () => void;
  onClose: () => void;
};

export function ClaimConfirmModal({ visible, preview, busy, onConfirm, onNotMe, onHelp, onClose }: Props) {
  const rel =
    preview.relationshipType && preview.relationshipType !== 'other'
      ? relationshipLabel(preview.relationshipType as RelationshipType)
      : 'Family member';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg }}>
        <Pressable
          onPress={(e) => e.stopPropagation?.()}
          style={[
            {
              backgroundColor: colors.paper,
              borderRadius: radii.xl,
              padding: spacing.lg,
              maxWidth: 440,
              width: '100%',
              alignSelf: 'center',
              gap: spacing.lg,
            },
            shadows.soft,
          ]}
        >
          <Title style={{ fontSize: 22 }}>You are about to claim this node</Title>
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <Avatar name={preview.displayName ?? 'You'} size={64} />
            <View style={{ flex: 1, gap: 6 }}>
              <Body>
                <Body style={{ fontWeight: '700' }}>Name: </Body>
                {preview.displayName}
              </Body>
              <Body>
                <Body style={{ fontWeight: '700' }}>Family Tree: </Body>
                {preview.treeName ?? 'Family Tree'}
              </Body>
              <Body>
                <Body style={{ fontWeight: '700' }}>Invited by: </Body>
                {preview.inviterName}
              </Body>
              <Body>
                <Body style={{ fontWeight: '700' }}>Relationship: </Body>
                {rel}
              </Body>
            </View>
          </View>
          <Caption style={{ color: colors.deepUmber }}>Is this you?</Caption>
          <Button label={busy ? 'Claiming…' : 'Yes, claim my node'} variant="gold" disabled={busy} onPress={onConfirm} />
          <Button label="This is not me" variant="secondary" disabled={busy} onPress={onNotMe} />
          <Button label="Ask a Guardian for help" variant="ghost" disabled={busy} onPress={onHelp} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
