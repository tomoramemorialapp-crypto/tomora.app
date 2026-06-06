import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, type ViewStyle } from 'react-native';

/**
 * Tomora's signature entrance: a slow, flowy, ethereal fade that drifts up a
 * few pixels and settles. Calm and candle-like — never bouncy. Honors the OS
 * "reduce motion" setting by appearing instantly.
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 760,
  translateY = 10,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  translateY?: number;
  style?: ViewStyle;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    const run = (reduceMotion: boolean) => {
      if (cancelled) return;
      if (reduceMotion) {
        progress.setValue(1);
        return;
      }
      Animated.timing(progress, {
        toValue: 1,
        duration,
        delay,
        // Gentle deceleration — content glides in and rests.
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(run)
      .catch(() => run(false));

    return () => {
      cancelled = true;
    };
  }, [progress, delay, duration]);

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [translateY, 0] }),
            },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
