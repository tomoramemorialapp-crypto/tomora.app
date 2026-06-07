import { Modal, Pressable, ScrollView, View } from 'react-native';

import { SocialIcon, SOCIAL_LABELS, type SocialNetwork } from '@/components/brand/SocialIcon';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { ADDABLE_SOCIAL_NETWORKS } from '@/lib/socialLinks';

const PICKER_NETWORKS: SocialNetwork[] = ['email', 'sms', ...ADDABLE_SOCIAL_NETWORKS];

/** Visual grid for choosing a social link icon / platform. */
export function SocialIconPickerModal({
  visible,
  title = 'Choose an icon',
  onClose,
  onSelect,
  excludeNetworks = [],
}: {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onSelect: (network: SocialNetwork) => void;
  excludeNetworks?: SocialNetwork[];
}) {
  const excluded = new Set(excludeNetworks);
  const options = PICKER_NETWORKS.filter((n) => !excluded.has(n));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(28,22,18,0.45)',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            alignSelf: 'center',
            width: '100%',
            maxWidth: 420,
            maxHeight: '80%',
            backgroundColor: colors.paper,
            borderRadius: radii.lg,
            padding: spacing.lg,
            gap: spacing.md,
            ...shadows.soft,
          }}
        >
          <Title style={{ fontSize: 20 }}>{title}</Title>
          <Caption style={{ color: colors.deepUmber }}>Tap an icon to add or change a link.</Caption>
          <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {options.map((network) => (
              <Pressable
                key={network}
                onPress={() => {
                  onSelect(network);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={SOCIAL_LABELS[network]}
                style={({ pressed }) => ({
                  width: 96,
                  alignItems: 'center',
                  gap: spacing.xs,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.xs,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.mistBeige,
                  backgroundColor: pressed ? colors.candlelight : colors.white,
                })}
              >
                <SocialIcon network={network} tile size={22} />
                <Caption style={{ textAlign: 'center', color: colors.deepUmber, fontSize: 11 }} numberOfLines={2}>
                  {SOCIAL_LABELS[network]}
                </Caption>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={onClose} style={{ alignSelf: 'flex-end', padding: spacing.sm }}>
            <Body style={{ color: colors.guardianGold, fontWeight: '700' }}>Cancel</Body>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
