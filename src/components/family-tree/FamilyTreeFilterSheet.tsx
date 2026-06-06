import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Caption } from '@/components/ui/Typography';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import type { BranchType, NodeStatus } from '@/lib/kinship/types';
import {
  BRANCH_LABELS,
  DEFAULT_FILTER,
  RANGE_LABELS,
  RANGE_ORDER,
  type FamilyTreeFilterState,
  type LifeStatus,
} from './canvasFilters';
import { FamilyTreeLegend } from './FamilyTreeLegend';

const STATUS_OPTIONS: { id: NodeStatus; label: string }[] = [
  { id: 'claimed', label: 'Claimed' },
  { id: 'managed', label: 'Cared for' },
  { id: 'invited', label: 'Invited' },
  { id: 'memory_light', label: 'Memory Light' },
  { id: 'placeholder', label: 'Placeholder' },
  { id: 'disputed', label: 'Under review' },
];

const LIFE_OPTIONS: { id: LifeStatus; label: string }[] = [
  { id: 'living', label: 'Living' },
  { id: 'deceased', label: 'In memory' },
  { id: 'unknown', label: 'Unknown' },
];

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

function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function FamilyTreeFilterSheet({
  visible,
  filter,
  onChange,
  onClose,
  availableBranches,
  availableTags,
  availableSurnames,
}: {
  visible: boolean;
  filter: FamilyTreeFilterState;
  onChange: (next: FamilyTreeFilterState) => void;
  onClose: () => void;
  availableBranches: BranchType[];
  availableTags: string[];
  availableSurnames: string[];
}) {
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
          <SectionHeader title="Filter Family Tree" />
          <Pressable onPress={() => onChange(DEFAULT_FILTER)}>
            <Caption style={{ color: colors.deepUmber }}>Reset</Caption>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.md }}>
          <View style={{ gap: spacing.sm }}>
            <Caption style={{ color: colors.ashTaupe }}>Show relationships up to</Caption>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {RANGE_ORDER.map((r) => (
                <Chip key={r} label={RANGE_LABELS[r]} active={filter.range === r} onPress={() => onChange({ ...filter, range: r })} />
              ))}
            </View>
          </View>

          {availableBranches.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Caption style={{ color: colors.ashTaupe }}>Branch</Caption>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {availableBranches.map((b) => (
                  <Chip
                    key={b}
                    label={BRANCH_LABELS[b]}
                    active={filter.branchTypes.includes(b)}
                    onPress={() => onChange({ ...filter, branchTypes: toggleIn(filter.branchTypes, b) })}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ gap: spacing.sm }}>
            <Caption style={{ color: colors.ashTaupe }}>Status</Caption>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {STATUS_OPTIONS.map((s) => (
                <Chip
                  key={s.id}
                  label={s.label}
                  active={filter.nodeStatuses.includes(s.id)}
                  onPress={() => onChange({ ...filter, nodeStatuses: toggleIn(filter.nodeStatuses, s.id) })}
                />
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Caption style={{ color: colors.ashTaupe }}>Life status</Caption>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {LIFE_OPTIONS.map((s) => (
                <Chip
                  key={s.id}
                  label={s.label}
                  active={filter.lifeStatuses.includes(s.id)}
                  onPress={() => onChange({ ...filter, lifeStatuses: toggleIn(filter.lifeStatuses, s.id) })}
                />
              ))}
            </View>
          </View>

          {availableSurnames.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Caption style={{ color: colors.ashTaupe }}>Surname</Caption>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {availableSurnames.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    active={filter.surnames.includes(s)}
                    onPress={() => onChange({ ...filter, surnames: toggleIn(filter.surnames, s) })}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {availableTags.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Caption style={{ color: colors.ashTaupe }}>Tags</Caption>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {availableTags.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    active={filter.tags.includes(t)}
                    onPress={() => onChange({ ...filter, tags: toggleIn(filter.tags, t) })}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <Toggle
            value={filter.showPlaceholders}
            onValueChange={(v) => onChange({ ...filter, showPlaceholders: v })}
            label="Show placeholder & unknown links"
          />

          <FamilyTreeLegend />
        </ScrollView>

        <Button label="Done" variant="gold" onPress={onClose} />
      </View>
    </Modal>
  );
}
