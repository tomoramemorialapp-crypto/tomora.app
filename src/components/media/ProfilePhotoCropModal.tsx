import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Button } from '@/components/ui/Button';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import {
  CROP_ZOOM_MAX,
  CROP_ZOOM_MIN,
  clampZoom,
  computeCropLayout,
  exportCroppedProfilePhoto,
  getImageSize,
} from '@/lib/cropImage';

const VIEWPORT = 280;
const OUTPUT = 512;

function ZoomSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const [trackW, setTrackW] = useState(0);
  const ratio = (value - CROP_ZOOM_MIN) / (CROP_ZOOM_MAX - CROP_ZOOM_MIN);

  const setFromX = (x: number) => {
    if (trackW <= 0) return;
    const r = Math.max(0, Math.min(1, x / trackW));
    onChange(CROP_ZOOM_MIN + r * (CROP_ZOOM_MAX - CROP_ZOOM_MIN));
  };

  return (
    <View style={{ gap: 6 }}>
      <Caption style={{ textAlign: 'center', color: colors.ashTaupe }}>Zoom</Caption>
      <View
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
        style={{
          height: 36,
          justifyContent: 'center',
          paddingHorizontal: spacing.xs,
        }}
      >
        <Pressable
          onPress={(e) => setFromX(e.nativeEvent.locationX)}
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.mistBeige,
            justifyContent: 'center',
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: `${ratio * 100}%`,
              marginLeft: -10,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.guardianGold,
              borderWidth: 2,
              borderColor: colors.paper,
            }}
          />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Profile photo crop step with a circular guide overlay. Supports drag, pinch,
 * slider, and (on web) mouse-wheel zoom.
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
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [busy, setBusy] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [loadError, setLoadError] = useState(false);

  const zoomBase = useRef(1);
  const panBase = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);

  const reset = useCallback(() => {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  }, []);

  useEffect(() => {
    offsetRef.current = { x: offsetX, y: offsetY };
  }, [offsetX, offsetY]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    if (!visible || !imageUri) return;
    reset();
    setLoadError(false);
    setImageSize(null);
    getImageSize(imageUri)
      .then(setImageSize)
      .catch(() => setLoadError(true));
  }, [visible, imageUri, reset]);

  const layout = useMemo(() => {
    if (!imageSize) return null;
    return computeCropLayout({
      imageWidth: imageSize.width,
      imageHeight: imageSize.height,
      viewportSize: VIEWPORT,
      zoom,
      offsetX,
      offsetY,
    });
  }, [imageSize, zoom, offsetX, offsetY]);

  const bumpZoom = useCallback((delta: number) => {
    setZoom((z) => clampZoom(z + delta));
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          panBase.current = { ...offsetRef.current };
        })
        .onUpdate((e) => {
          runOnJS(setOffsetX)(panBase.current.x + e.translationX);
          runOnJS(setOffsetY)(panBase.current.y + e.translationY);
        }),
    [],
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onBegin(() => {
          zoomBase.current = zoomRef.current;
        })
        .onUpdate((e) => {
          runOnJS(setZoom)(clampZoom(zoomBase.current * e.scale));
        }),
    [],
  );

  const cropGesture = useMemo(() => Gesture.Simultaneous(panGesture, pinchGesture), [panGesture, pinchGesture]);

  const onApply = async () => {
    if (!imageUri || !imageSize) return;
    setBusy(true);
    try {
      const cropped = await exportCroppedProfilePhoto(imageUri, {
        viewportSize: VIEWPORT,
        outputSize: OUTPUT,
        imageWidth: imageSize.width,
        imageHeight: imageSize.height,
        zoom,
        offsetX,
        offsetY,
      });
      if (cropped) onConfirm(cropped.uri, cropped.blob);
      else onConfirm(imageUri);
    } finally {
      setBusy(false);
    }
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
          <Caption>
            Drag to reposition. Pinch, scroll, or use the slider to zoom. Fit your face inside the gold circle.
          </Caption>

          <GestureDetector gesture={cropGesture}>
            <View
              {...(Platform.OS === 'web'
                ? {
                    onWheel: (e: { nativeEvent: { deltaY: number }; preventDefault?: () => void }) => {
                      e.preventDefault?.();
                      bumpZoom(e.nativeEvent.deltaY < 0 ? 0.08 : -0.08);
                    },
                  }
                : {})}
              style={{
                width: VIEWPORT,
                height: VIEWPORT,
                alignSelf: 'center',
                borderRadius: radii.md,
                overflow: 'hidden',
                backgroundColor: colors.mistBeige,
              }}
            >
              {loadError ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md }}>
                  <Caption style={{ textAlign: 'center', color: colors.error }}>
                    Could not load this image for cropping.
                  </Caption>
                </View>
              ) : !layout ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={colors.guardianGold} />
                </View>
              ) : (
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    position: 'absolute',
                    width: layout.drawWidth,
                    height: layout.drawHeight,
                    left: layout.originX,
                    top: layout.originY,
                  }}
                  contentFit="fill"
                />
              )}
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
            </View>
          </GestureDetector>

          <ZoomSlider value={zoom} onChange={setZoom} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, alignItems: 'center' }}>
            <Pressable
              onPress={() => bumpZoom(-0.15)}
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
              style={{ padding: spacing.sm }}
            >
              <Body style={{ fontWeight: '700' }}>−</Body>
            </Pressable>
            <Caption>{Math.round(zoom * 100)}%</Caption>
            <Pressable
              onPress={() => bumpZoom(0.15)}
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
              style={{ padding: spacing.sm }}
            >
              <Body style={{ fontWeight: '700' }}>+</Body>
            </Pressable>
            <Pressable onPress={reset} style={{ padding: spacing.sm }}>
              <Caption style={{ color: colors.guardianGold, fontWeight: '600' }}>Reset</Caption>
            </Pressable>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Button
              label={busy ? 'Applying…' : 'Use this photo'}
              variant="gold"
              disabled={busy || !imageSize || loadError}
              onPress={onApply}
            />
            <Button label="Cancel" variant="ghost" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
