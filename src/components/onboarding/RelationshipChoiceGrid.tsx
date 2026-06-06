import { Pressable, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import type { RelationshipChoice } from '@/lib/relationshipTaxonomy';

function ChoiceChip({
  choice,
  active,
  onSelect,
}: {
  choice: RelationshipChoice;
  active: boolean;
  onSelect: (choice: RelationshipChoice) => void;
}) {
  return (
    <Pressable
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
}

/** Grouped grid of relationship taxonomy choices. */
export function RelationshipChoiceGrid({
  groups,
  selectedId,
  onSelect,
}: {
  groups: { label: string; choices: RelationshipChoice[] }[];
  selectedId?: string;
  onSelect: (choice: RelationshipChoice) => void;
}) {
  return (
    <View style={{ gap: spacing.lg }}>
      {groups.map((group) => (
        <View key={group.label} style={{ gap: spacing.sm }}>
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 13,
              fontWeight: '600',
              color: colors.deepUmber,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              textAlign: 'center',
            }}
          >
            {group.label}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
            {group.choices.map((choice) => (
              <ChoiceChip
                key={choice.id}
                choice={choice}
                active={selectedId === choice.id}
                onSelect={onSelect}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
