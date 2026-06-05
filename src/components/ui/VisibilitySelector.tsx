import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import type { VisibilityLevel } from '@/types/models';
import { visibilityLabels } from '@/constants/copy';

const ORDER: VisibilityLevel[] = ['private', 'selected_people', 'family_tree', 'invite_link', 'public'];

/** Compact chip row to choose who can see a field or node. */
export function VisibilitySelector({
  value,
  onChange,
  options = ORDER,
  label = 'Who can see this',
}: {
  value: VisibilityLevel;
  onChange: (next: VisibilityLevel) => void;
  options?: VisibilityLevel[];
  label?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ashTaupe, letterSpacing: 0.3 }}>
          {label}
        </Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {options.map((opt) => {
          const active = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                backgroundColor: active ? 'rgba(184,135,47,0.14)' : colors.white,
                borderColor: active ? colors.guardianGold : colors.mistBeige,
                borderWidth: 1.5,
                borderRadius: radii.pill,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 12.5,
                  fontWeight: active ? '700' : '500',
                  color: active ? colors.guardianGold : colors.charcoal,
                }}
              >
                {visibilityLabels[opt]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
