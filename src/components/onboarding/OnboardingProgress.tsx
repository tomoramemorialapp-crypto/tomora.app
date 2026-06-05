import { View } from 'react-native';
import { colors } from '@/constants/theme';

/** Quiet progress dots — no aggressive gamification. */
export function OnboardingProgress({ step, total }: { step: number; total: number }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: step }}
      style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const active = i < step;
        return (
          <View
            key={i}
            style={{
              width: active ? 22 : 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: active ? colors.guardianGold : colors.mistBeige,
            }}
          />
        );
      })}
    </View>
  );
}
