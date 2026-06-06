import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';

type Props = {
  visible: boolean;
  nodeName: string;
  busy?: boolean;
  onSubmit: (email: string) => Promise<void>;
  onClose: () => void;
};

export function NodeTransferModal({ visible, nodeName, busy, onSubmit, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = /\S+@\S+\.\S+/.test(email.trim()) && !busy;

  const onSend = async () => {
    setError(null);
    try {
      await onSubmit(email.trim());
      setEmail('');
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not start the transfer. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation?.()}
          style={[
            {
              backgroundColor: colors.paper,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              padding: spacing.lg,
              gap: spacing.md,
              maxWidth: 520,
              width: '100%',
              alignSelf: 'center',
            },
            shadows.soft,
          ]}
        >
          <Title style={{ fontSize: 22 }}>{copy.transfer.title}</Title>
          <Body style={{ color: colors.deepUmber }}>{copy.transfer.body.replace('{name}', nodeName)}</Body>
          <Caption style={{ color: colors.ashTaupe }}>{copy.transfer.note}</Caption>
          <TextField
            label="New owner’s email"
            value={email}
            onChangeText={setEmail}
            placeholder="cousin@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {error ? <Caption style={{ color: colors.error }}>{error}</Caption> : null}
          <Button label={busy ? 'Sending…' : copy.transfer.cta} variant="gold" disabled={!canSubmit} onPress={onSend} />
          <Button label="Cancel" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
