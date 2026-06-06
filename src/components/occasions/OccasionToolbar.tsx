import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Dropdown } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { Caption } from '@/components/ui/Typography';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import type { OccasionKind } from '@/lib/occasions';
import {
  KIND_LABELS,
  SORT_LABELS,
  toggleIn,
  type OccasionFilterState,
  type OccasionSort,
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

const QUICK_KINDS: OccasionKind[] = ['birthday', 'death_anniversary', 'holiday'];

export function OccasionToolbar({
  filter,
  sort,
  filterActive,
  resultCount,
  totalCount,
  onChangeFilter,
  onChangeSort,
  onOpenFilters,
}: {
  filter: OccasionFilterState;
  sort: OccasionSort;
  filterActive: boolean;
  resultCount: number;
  totalCount: number;
  onChangeFilter: (next: OccasionFilterState) => void;
  onChangeSort: (next: OccasionSort) => void;
  onOpenFilters: () => void;
}) {
  const sortOptions = (Object.keys(SORT_LABELS) as OccasionSort[]).map((k) => ({
    value: k,
    label: SORT_LABELS[k],
  }));

  return (
    <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Dropdown label="Sort" value={sort} onChange={(v) => onChangeSort(v as OccasionSort)} options={sortOptions} />
        </View>
        <Pressable
          onPress={onOpenFilters}
          accessibilityRole="button"
          accessibilityLabel="More filters"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radii.md,
            borderWidth: 1.5,
            borderColor: filterActive ? colors.guardianGold : colors.mistBeige,
            backgroundColor: filterActive ? 'rgba(184,135,47,0.1)' : colors.white,
            opacity: pressed ? 0.85 : 1,
            marginBottom: 2,
          })}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 6h16M7 12h10M10 18h4"
              stroke={filterActive ? colors.guardianGold : colors.ashTaupe}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </Svg>
          <Caption style={{ fontWeight: '700', color: filterActive ? colors.guardianGold : colors.charcoal }}>Filters</Caption>
          {filterActive ? <Badge label="On" tone="gold" /> : null}
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}>
        <Chip
          label="All types"
          active={filter.kinds.length === 0}
          onPress={() => onChangeFilter({ ...filter, kinds: [] })}
        />
        {QUICK_KINDS.map((k) => (
          <Chip
            key={k}
            label={KIND_LABELS[k]}
            active={filter.kinds.includes(k)}
            onPress={() => onChangeFilter({ ...filter, kinds: toggleIn(filter.kinds, k) })}
          />
        ))}
      </ScrollView>

      {filterActive || sort !== 'soonest' ? (
        <Caption style={{ color: colors.deepUmber }}>
          Showing {resultCount} of {totalCount} occasion{totalCount === 1 ? '' : 's'}
        </Caption>
      ) : null}
    </View>
  );
}
