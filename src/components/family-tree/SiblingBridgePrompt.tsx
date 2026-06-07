import { Modal, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { siblingBridgeCopy } from '@/constants/copy';
import type { SiblingBridgeMode } from '@/lib/siblingAdd';

type Props = {
  visible: boolean;
  busy?: boolean;
  onChoose: (mode: SiblingBridgeMode) => void | Promise<void>;
  onDismiss: () => void;
};

export function SiblingBridgePrompt({ visible, busy, onChoose, onDismiss }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          padding: spacing.lg,
        }}
        onPress={onDismiss}
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
          <Display style={{ fontSize: 26 }}>{siblingBridgeCopy.title}</Display>
          <Body style={{ fontSize: 17, color: colors.deepUmber }}>{siblingBridgeCopy.body}</Body>

          <View style={{ gap: spacing.sm }}>
            <Button
              label={siblingBridgeCopy.addParent}
              variant="gold"
              disabled={busy}
              onPress={() => onChoose('add_parent_now')}
            />
            <Button
              label={siblingBridgeCopy.unknownParent}
              variant="secondary"
              disabled={busy}
              onPress={() => onChoose('shared_unknown_parent')}
            />
            <Caption style={{ color: colors.ashTaupe, paddingHorizontal: spacing.xs }}>
              {siblingBridgeCopy.unknownNote}
            </Caption>
            <Button
              label={siblingBridgeCopy.unbridged}
              variant="secondary"
              disabled={busy}
              onPress={() => onChoose('unbridged')}
            />
            <Caption style={{ color: colors.ashTaupe, paddingHorizontal: spacing.xs }}>
              {siblingBridgeCopy.unbridgedNote}
            </Caption>
            <Button label="Cancel" variant="ghost" disabled={busy} onPress={onDismiss} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
