import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import { Caption } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';

export interface SliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onValueChange: (next: number) => void;
  label?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/** Theme-aware slider — visible in light and dark mode. */
export function Slider({
  value,
  minimumValue,
  maximumValue,
  onValueChange,
  label,
  disabled,
  accessibilityLabel,
}: SliderProps) {
  const [trackW, setTrackW] = useState(0);
  const span = maximumValue - minimumValue;
  const ratio = span > 0 ? (value - minimumValue) / span : 0;

  const setFromX = (x: number) => {
    if (disabled || trackW <= 0) return;
    const r = Math.max(0, Math.min(1, x / trackW));
    onValueChange(minimumValue + r * span);
  };

  const onLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width);

  return (
    <View style={{ gap: 6, opacity: disabled ? 0.5 : 1 }}>
      {label ? (
        <Caption style={{ textAlign: 'center', color: colors.ashTaupe }}>{label}</Caption>
      ) : null}
      <View
        onLayout={onLayout}
        style={{
          height: 36,
          justifyContent: 'center',
          paddingHorizontal: spacing.xs,
        }}
      >
        <Pressable
          disabled={disabled}
          onPress={(e) => setFromX(e.nativeEvent.locationX)}
          accessibilityRole="adjustable"
          accessibilityLabel={accessibilityLabel ?? label ?? 'Slider'}
          accessibilityValue={{ min: minimumValue, max: maximumValue, now: value }}
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.mistBeige,
            borderWidth: 1,
            borderColor: colors.ashTaupe,
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${ratio * 100}%`,
              backgroundColor: colors.guardianGold,
              borderRadius: 3,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: `${ratio * 100}%`,
              marginLeft: -10,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.softGold,
              borderWidth: 2,
              borderColor: colors.paper,
            }}
          />
        </Pressable>
      </View>
    </View>
  );
}
