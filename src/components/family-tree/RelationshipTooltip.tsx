import { Pressable, View } from 'react-native';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

/** A calm card explaining how the selected node connects to the anchor. */
export function RelationshipTooltip({
  name,
  label,
  explanation,
  onOpenProfile,
  onClose,
}: {
  name: string;
  label?: string;
  explanation?: string;
  onOpenProfile?: () => void;
  onClose?: () => void;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.paper,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.softGold,
          padding: spacing.md,
          gap: spacing.sm,
        },
        shadows.card,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
        <Title style={{ fontSize: 20 }}>{name}</Title>
        {label ? (
          <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.2, color: colors.deepUmber }}>{label}</Caption>
        ) : null}
      </View>
      {explanation ? <Body style={{ fontSize: 15, color: colors.deepUmber }}>{explanation}</Body> : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {onOpenProfile ? (
          <View style={{ flex: 1 }}>
            <Button label="Open Life Profile" variant="gold" onPress={onOpenProfile} />
          </View>
        ) : null}
        {onClose ? (
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={{ paddingHorizontal: spacing.md, justifyContent: 'center' }}
          >
            <Body style={{ color: colors.deepUmber, fontWeight: '600' }}>Close</Body>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
