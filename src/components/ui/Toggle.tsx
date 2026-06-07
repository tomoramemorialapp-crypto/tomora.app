import { Pressable, Text, View } from 'react-native';
import { colors, fonts, spacing } from '@/constants/theme';

/** A calm switch-style toggle with an optional label + description. */
export function Toggle({
  value,
  onValueChange,
  label,
  description,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label?: string;
  description?: string;
}) {
  const track = (
    <View
      style={{
        width: 50,
        height: 30,
        borderRadius: 999,
        padding: 3,
        backgroundColor: value ? colors.guardianGold : colors.mistBeige,
        borderWidth: value ? 0 : 1,
        borderColor: colors.ashTaupe,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: colors.paper,
          borderWidth: 1,
          borderColor: value ? colors.guardianGold : colors.ashTaupe,
          alignSelf: value ? 'flex-end' : 'flex-start',
        }}
      />
    </View>
  );

  if (!label) {
    return (
      <Pressable
        onPress={() => onValueChange(!value)}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      >
        {track}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: '600', color: colors.ink }}>{label}</Text>
        {description ? (
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.deepUmber, lineHeight: 20 }}>
            {description}
          </Text>
        ) : null}
      </View>
      {track}
    </Pressable>
  );
}
