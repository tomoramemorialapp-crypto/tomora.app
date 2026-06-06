import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Caption } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { parseClaimCode } from '@/lib/claim';

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<{ rawValue?: string }[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorLike;
  }
}

/** Web-only QR scanner using the browser BarcodeDetector API. */
export function QrClaimScanner({ onCode }: { onCode: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(Platform.OS === 'web' && typeof window !== 'undefined' && 'BarcodeDetector' in window);
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = async () => {
    if (Platform.OS !== 'web' || !window.BarcodeDetector) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setScanning(true);

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      let alive = true;
      const tick = async () => {
        if (!alive || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const raw = codes[0]?.rawValue;
          const parsed = raw ? parseClaimCode(raw) : null;
          if (parsed) {
            alive = false;
            stop();
            onCode(parsed);
            return;
          }
        } catch {
          // keep scanning
        }
        if (alive) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      setError('Could not access the camera. Paste your invite link instead.');
      stop();
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <Caption align="center" style={{ color: colors.ashTaupe }}>
        QR scanning is available on web. Use your invite code or link for now.
      </Caption>
    );
  }

  if (!supported) {
    return (
      <Caption align="center" style={{ color: colors.ashTaupe }}>
        Your browser does not support QR scanning. Paste your invite link or code below.
      </Caption>
    );
  }

  return (
    <View style={{ gap: spacing.sm, alignItems: 'center', width: '100%' }}>
      <View
        style={{
          width: '100%',
          maxWidth: 280,
          aspectRatio: 1,
          borderRadius: radii.md,
          overflow: 'hidden',
          backgroundColor: colors.candlelight,
          borderWidth: 1,
          borderColor: colors.mistBeige,
        }}
      >
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          playsInline
          muted
        />
      </View>
      {scanning ? (
        <Pressable onPress={stop} hitSlop={8}>
          <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>Stop scanning</Caption>
        </Pressable>
      ) : (
        <Button label="Scan QR code" variant="secondary" onPress={start} />
      )}
      {error ? <Caption style={{ color: colors.error, textAlign: 'center' }}>{error}</Caption> : null}
    </View>
  );
}
