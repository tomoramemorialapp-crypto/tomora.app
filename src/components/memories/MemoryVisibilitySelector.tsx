import { Pressable, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import type { VisibilityLevel } from '@/types/models';
import { visibilityLabels } from '@/constants/copy';

const ORDER: VisibilityLevel[] = ['private', 'selected_people', 'family_tree', 'invite_link', 'public'];

const helper: Record<VisibilityLevel, string> = {
  private: 'Only you can see this.',
  selected_people: 'Only people you choose.',
  family_tree: 'Everyone in your Family Tree.',
  invite_link: 'Anyone with the private link.',
  public: 'Anyone can see this.',
};

/** MVP privacy levels, shown with reassuring helper copy. */
export function MemoryVisibilitySelector({
  value,
  onChange,
}: {
  value: VisibilityLevel;
  onChange: (v: VisibilityLevel) => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.deepUmber }}>Who can see this?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {ORDER.map((level) => {
          const active = value === level;
          return (
            <Pressable
              key={level}
              onPress={() => onChange(level)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={visibilityLabels[level]}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: radii.pill,
                borderWidth: 1.5,
                borderColor: active ? colors.guardianGold : colors.mistBeige,
                backgroundColor: active ? 'rgba(184,135,47,0.12)' : colors.white,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 14,
                  fontWeight: '600',
                  color: active ? colors.guardianGold : colors.charcoal,
                }}
              >
                {visibilityLabels[level]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ashTaupe }}>{helper[value]}</Text>
    </View>
  );
}
