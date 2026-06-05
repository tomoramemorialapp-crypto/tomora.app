import { Pressable, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';

/** Warm checkbox row with an optional supporting description. */
export function Checkbox({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: radii.sm,
          borderWidth: 2,
          marginTop: 2,
          borderColor: checked ? colors.guardianGold : colors.ashTaupe,
          backgroundColor: checked ? colors.guardianGold : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? (
          <View
            style={{
              width: 6,
              height: 11,
              borderRightWidth: 2.5,
              borderBottomWidth: 2.5,
              borderColor: colors.paper,
              transform: [{ rotate: '45deg' }],
              marginTop: -2,
            }}
          />
        ) : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: '600', color: colors.ink }}>{label}</Text>
        {description ? (
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.deepUmber, lineHeight: 20 }}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
