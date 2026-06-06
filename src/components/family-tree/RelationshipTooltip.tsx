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
  onOpenMemorial,
  onCompleteUnknown,
  onAddRelative,
  onClose,
}: {
  name: string;
  label?: string;
  explanation?: string;
  onOpenProfile?: () => void;
  onOpenMemorial?: () => void;
  onCompleteUnknown?: () => void;
  onAddRelative?: () => void;
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
        <Title style={{ fontSize: 20, flex: 1 }}>{name}</Title>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {label ? (
            <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.2, color: colors.deepUmber }}>{label}</Caption>
          ) : null}
          {onAddRelative ? (
            <Pressable
              onPress={onAddRelative}
              accessibilityRole="button"
              accessibilityLabel={`Add a family member connected to ${name}`}
              hitSlop={10}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(184,135,47,0.2)' : 'rgba(184,135,47,0.12)',
                borderWidth: 1.5,
                borderColor: colors.guardianGold,
              })}
            >
              <Body style={{ fontSize: 22, lineHeight: 24, color: colors.guardianGold, fontWeight: '700' }}>+</Body>
            </Pressable>
          ) : null}
        </View>
      </View>
      {explanation ? <Body style={{ fontSize: 15, color: colors.deepUmber }}>{explanation}</Body> : null}
      <View style={{ gap: spacing.sm }}>
        {onOpenProfile ? <Button label="Open Life Profile" variant="gold" onPress={onOpenProfile} /> : null}
        {onOpenMemorial ? <Button label="Open Memorial Page" variant="secondary" onPress={onOpenMemorial} /> : null}
        {onCompleteUnknown ? (
          <Button label="Create Life Profile" variant="secondary" onPress={onCompleteUnknown} />
        ) : null}
      </View>
      {onClose ? (
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={{ alignItems: 'center', paddingVertical: spacing.xs }}
        >
          <Body style={{ color: colors.deepUmber, fontWeight: '600' }}>Close</Body>
        </Pressable>
      ) : null}
    </View>
  );
}
