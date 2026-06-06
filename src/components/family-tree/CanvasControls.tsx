import { Pressable, Text, View } from 'react-native';
import { colors, fonts, radii, shadows, spacing } from '@/constants/theme';
import type { FamilyTreeLayoutOrientation } from './canvasFilters';

function ControlButton({
  glyph,
  label,
  onPress,
  active = false,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          width: 40,
          height: 40,
          borderRadius: radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? colors.guardianGold : colors.paper,
          borderWidth: 1,
          borderColor: active ? colors.guardianGold : colors.mistBeige,
          opacity: pressed ? 0.85 : 1,
        },
        shadows.card,
      ]}
    >
      <Text style={{ fontFamily: fonts.body, fontSize: 18, color: active ? colors.paper : colors.deepUmber }}>
        {glyph}
      </Text>
    </Pressable>
  );
}

/** Compact floating control cluster for the Family Tree canvas. */
export function CanvasControls({
  orientation,
  filterActive,
  onZoomIn,
  onZoomOut,
  onFit,
  onSearch,
  onToggleOrientation,
  onOpenFilters,
}: {
  orientation: FamilyTreeLayoutOrientation;
  filterActive: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onSearch: () => void;
  onToggleOrientation: () => void;
  onOpenFilters: () => void;
}) {
  return (
    <>
      {/* Zoom + view cluster, bottom-right */}
      <View style={{ position: 'absolute', right: spacing.sm, bottom: spacing.sm, gap: spacing.sm, alignItems: 'center' }}>
        <ControlButton glyph="⌕" label="Search by name" onPress={onSearch} />
        <ControlButton glyph="+" label="Zoom in" onPress={onZoomIn} />
        <ControlButton glyph="−" label="Zoom out" onPress={onZoomOut} />
        <ControlButton glyph="⤢" label="Fit Family Tree" onPress={onFit} />
      </View>

      {/* View options, top-left */}
      <View style={{ position: 'absolute', left: spacing.sm, top: spacing.sm, flexDirection: 'row', gap: spacing.sm }}>
        <ControlButton
          glyph={orientation === 'vertical_generational' ? '⇅' : '⇄'}
          label="Toggle layout orientation"
          onPress={onToggleOrientation}
        />
        <ControlButton glyph="⛃" label="Filters" onPress={onOpenFilters} active={filterActive} />
      </View>
    </>
  );
}
