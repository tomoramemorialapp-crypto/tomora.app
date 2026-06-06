import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Caption } from '@/components/ui/Typography';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import type { OccasionKind, OccasionScope } from '@/lib/occasions';
import {
  DEFAULT_OCCASION_FILTER,
  KIND_LABELS,
  SCOPE_LABELS,
  toggleIn,
  type OccasionFilterState,
} from '@/lib/occasionFilters';

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        backgroundColor: active ? 'rgba(184,135,47,0.14)' : colors.white,
        borderColor: active ? colors.guardianGold : colors.mistBeige,
        borderWidth: 1.5,
        borderRadius: radii.pill,
        paddingHorizontal: 12,
        paddingVertical: 7,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 13,
          fontWeight: active ? '700' : '500',
          color: active ? colors.guardianGold : colors.charcoal,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function OccasionFilterSheet({
  visible,
  filter,
  availableTags,
  onChange,
  onClose,
}: {
  visible: boolean;
  filter: OccasionFilterState;
  availableTags: string[];
  onChange: (next: OccasionFilterState) => void;
  onClose: () => void;
}) {
  const kindKeys = Object.keys(KIND_LABELS) as OccasionKind[];
  const scopeKeys = Object.keys(SCOPE_LABELS) as OccasionScope[];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={onClose} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.ivory,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          padding: spacing.lg,
          maxHeight: '85%',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
          <SectionHeader title="Filter occasions" />
          <Pressable onPress={() => onChange(DEFAULT_OCCASION_FILTER)} accessibilityRole="button">
            <Caption style={{ color: colors.deepUmber }}>Reset</Caption>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.md }}>
          <View style={{ gap: spacing.sm }}>
            <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.2 }}>Event type</Caption>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {kindKeys.map((k) => (
                <Chip
                  key={k}
                  label={KIND_LABELS[k]}
                  active={filter.kinds.includes(k)}
                  onPress={() => onChange({ ...filter, kinds: toggleIn(filter.kinds, k) })}
                />
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.2 }}>Source</Caption>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {scopeKeys.map((s) => (
                <Chip
                  key={s}
                  label={SCOPE_LABELS[s]}
                  active={filter.scopes.includes(s)}
                  onPress={() => onChange({ ...filter, scopes: toggleIn(filter.scopes, s) })}
                />
              ))}
            </View>
          </View>

          {availableTags.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.2 }}>Family tags</Caption>
              <Caption style={{ color: colors.deepUmber, marginBottom: spacing.xs }}>
                Show occasions for people with these tags (e.g. Mother&apos;s side).
              </Caption>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {availableTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    active={filter.tags.includes(tag)}
                    onPress={() => onChange({ ...filter, tags: toggleIn(filter.tags, tag) })}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <Button label="Done" variant="gold" onPress={onClose} />
      </View>
    </Modal>
  );
}
