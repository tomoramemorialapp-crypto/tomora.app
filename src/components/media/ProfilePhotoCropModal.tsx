import { useCallback, useRef, useState } from 'react';
import { Modal, Platform, Pressable, View, type NativeSyntheticEvent, type NativeTouchEvent } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle } from 'react-native-svg';

import { Button } from '@/components/ui/Button';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { cropImageToSquare } from '@/lib/cropImage';

const VIEWPORT = 280;
const OUTPUT = 512;

/**
 * Profile photo crop step with a circular guide overlay. Web uses pan/zoom +
 * canvas export; native relies on the system picker crop when available.
 */
export function ProfilePhotoCropModal({
  visible,
  imageUri,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onConfirm: (uri: string, blob?: Blob) => void;
}) {
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [busy, setBusy] = useState(false);
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);

  const reset = useCallback(() => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  }, []);

  const onApply = async () => {
    if (!imageUri) return;
    setBusy(true);
    try {
      if (Platform.OS === 'web') {
        const cropped = await cropImageToSquare(imageUri, {
          viewportSize: VIEWPORT,
          outputSize: OUTPUT,
          scale,
          offsetX,
          offsetY,
        });
        if (cropped) onConfirm(cropped.uri, cropped.blob);
        else onConfirm(imageUri);
      } else {
        onConfirm(imageUri);
      }
    } finally {
      setBusy(false);
    }
  };

  const onPointerDown = (x: number, y: number) => {
    dragOrigin.current = { x: x - offsetX, y: y - offsetY };
  };

  const onPointerMove = (x: number, y: number) => {
    const drag = dragOrigin.current;
    if (!drag) return;
    setOffsetX(x - drag.x);
    setOffsetY(y - drag.y);
  };

  const onPointerUp = () => {
    dragOrigin.current = null;
  };

  if (!imageUri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg }}>
        <View
          style={{
            backgroundColor: colors.paper,
            borderRadius: radii.lg,
            padding: spacing.lg,
            gap: spacing.md,
            maxWidth: 400,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <Title style={{ fontSize: 22 }}>Position your photo</Title>
          <Caption>Drag to reposition. Pinch or use zoom to fit your face inside the circle.</Caption>

          <Pressable
            style={{
              width: VIEWPORT,
              height: VIEWPORT,
              alignSelf: 'center',
              borderRadius: radii.md,
              overflow: 'hidden',
              backgroundColor: colors.mistBeige,
            }}
            onTouchStart={(e: NativeSyntheticEvent<NativeTouchEvent>) => {
              const t = e.nativeEvent.touches[0];
              if (!t) return;
              onPointerDown(t.locationX, t.locationY);
            }}
            onTouchMove={(e: NativeSyntheticEvent<NativeTouchEvent>) => {
              const t = e.nativeEvent.touches[0];
              if (!t) return;
              onPointerMove(t.locationX, t.locationY);
            }}
            onTouchEnd={onPointerUp}
          >
            <Image
              source={{ uri: imageUri }}
              style={{
                width: VIEWPORT,
                height: VIEWPORT,
                transform: [
                  { translateX: offsetX },
                  { translateY: offsetY },
                  { scale },
                ],
              }}
              contentFit="cover"
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: VIEWPORT,
                height: VIEWPORT,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Svg width={VIEWPORT} height={VIEWPORT}>
                <Circle
                  cx={VIEWPORT / 2}
                  cy={VIEWPORT / 2}
                  r={VIEWPORT / 2 - 4}
                  stroke={colors.guardianGold}
                  strokeWidth={3}
                  strokeOpacity={0.9}
                  fill="transparent"
                />
              </Svg>
            </View>
          </Pressable>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
            <Pressable onPress={() => setScale((s: number) => Math.max(0.5, s - 0.1))} style={{ padding: spacing.sm }}>
              <Body style={{ fontWeight: '700' }}>−</Body>
            </Pressable>
            <Caption>Zoom</Caption>
            <Pressable onPress={() => setScale((s: number) => Math.min(3, s + 0.1))} style={{ padding: spacing.sm }}>
              <Body style={{ fontWeight: '700' }}>+</Body>
            </Pressable>
            <Pressable onPress={reset} style={{ padding: spacing.sm }}>
              <Caption style={{ color: colors.guardianGold, fontWeight: '600' }}>Reset</Caption>
            </Pressable>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Button label={busy ? 'Applying…' : 'Use this photo'} variant="gold" disabled={busy} onPress={onApply} />
            <Button label="Cancel" variant="ghost" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
