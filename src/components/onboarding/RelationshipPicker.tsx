import { Pressable, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { relationshipChoices } from '@/constants/copy';

/** Grid of warm relationship choices. */
export function RelationshipPicker({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (choice: (typeof relationshipChoices)[number]) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
      {relationshipChoices.map((choice) => {
        const active = selectedId === choice.id;
        return (
          <Pressable
            key={choice.id}
            onPress={() => onSelect(choice)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={choice.label}
            style={({ pressed }) => ({
              paddingHorizontal: 18,
              paddingVertical: 14,
              borderRadius: radii.pill,
              borderWidth: 1.5,
              borderColor: active ? colors.guardianGold : colors.mistBeige,
              backgroundColor: active ? 'rgba(184,135,47,0.12)' : colors.white,
              opacity: pressed ? 0.85 : 1,
              minWidth: 110,
              alignItems: 'center',
            })}
          >
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 16,
                fontWeight: '600',
                color: active ? colors.guardianGold : colors.ink,
              }}
            >
              {choice.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
