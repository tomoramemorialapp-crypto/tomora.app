import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';

import { Button } from '@/components/ui/Button';
import { Caption } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { parseClaimCode } from '@/lib/claim';

const FRAME_STYLE = {
  width: '100%' as const,
  maxWidth: 280,
  aspectRatio: 1,
  borderRadius: radii.md,
  overflow: 'hidden' as const,
  backgroundColor: colors.candlelight,
  borderWidth: 1,
  borderColor: colors.mistBeige,
};

/** iOS/Android QR scanner via expo-camera. */
export function QrClaimScanner({ onCode }: { onCode: (code: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [captured, setCaptured] = useState(false);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      const parsed = parseClaimCode(result.data);
      if (!parsed) return;
      setCaptured(true);
      setScanning(false);
      onCode(parsed);
    },
    [onCode],
  );

  const onScanAgain = () => {
    setCaptured(false);
    setScanning(true);
  };

  if (!permission) {
    return (
      <Caption align="center" style={{ color: colors.ashTaupe }}>
        Checking camera permission…
      </Caption>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ gap: spacing.sm, alignItems: 'center', width: '100%' }}>
        <Caption align="center" style={{ color: colors.deepUmber, maxWidth: 320 }}>
          Camera access lets you scan invite QR codes at meetups. You can still paste a link below.
        </Caption>
        <Button label="Allow camera" variant="gold" fullWidth={false} onPress={() => void requestPermission()} />
        {permission.canAskAgain === false ? (
          <Pressable onPress={() => void Linking.openSettings()} hitSlop={8}>
            <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>Open Settings</Caption>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.sm, alignItems: 'center', width: '100%' }}>
      <View style={FRAME_STYLE}>
        {scanning ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.candlelight,
            }}
          >
            <Caption style={{ color: colors.deepUmber, fontWeight: '600' }}>Invite code captured</Caption>
          </View>
        )}
      </View>
      {captured ? (
        <Button label="Scan again" variant="secondary" fullWidth={false} onPress={onScanAgain} />
      ) : (
        <Pressable onPress={() => setScanning(false)} hitSlop={8}>
          <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>Stop scanning</Caption>
        </Pressable>
      )}
      {!scanning && !captured ? (
        <Button label="Resume scanning" variant="ghost" fullWidth={false} onPress={() => setScanning(true)} />
      ) : null}
    </View>
  );
}
