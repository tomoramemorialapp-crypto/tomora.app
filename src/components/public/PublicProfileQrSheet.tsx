import { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button } from '@/components/ui/Button';
import { Caption, Title } from '@/components/ui/Typography';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { publicProfileUrl } from '@/constants/urls';
import { copyToClipboard } from '@/lib/clipboard';
import { sharePublicProfileLink } from '@/lib/share';

export function PublicProfileQrSheet({
  visible,
  onClose,
  username,
  displayName,
}: {
  visible: boolean;
  onClose: () => void;
  username: string;
  displayName: string;
}) {
  const link = publicProfileUrl(username);
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyToClipboard(link);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            alignSelf: 'center',
            width: '100%',
            maxWidth: 380,
            backgroundColor: colors.paper,
            borderRadius: radii.lg,
            padding: spacing.lg,
            gap: spacing.md,
            ...shadows.card,
          }}
        >
          <Title style={{ textAlign: 'center' }}>Share your public profile</Title>
          <Caption align="center" style={{ color: colors.deepUmber }}>
            Scan at meetups so people can open your page instantly — no Tomora account needed.
          </Caption>
          <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
            <QRCode value={link} size={200} color={colors.ink} backgroundColor={colors.white} />
          </View>
          <Caption align="center" numberOfLines={2} style={{ color: colors.guardianGold, fontWeight: '700' }}>
            {link}
          </Caption>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm }}>
            <Button label={copied ? 'Copied' : 'Copy link'} variant="secondary" fullWidth={false} onPress={onCopy} />
            {Platform.OS !== 'web' ? (
              <Button
                label="Share"
                variant="secondary"
                fullWidth={false}
                onPress={() => void sharePublicProfileLink(displayName, link)}
              />
            ) : null}
            <Button label="Done" variant="gold" fullWidth={false} onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
