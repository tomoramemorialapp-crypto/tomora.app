import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { Button } from '@/components/ui/Button';
import { LightDivider } from '@/components/brand/LightDivider';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';

export default function Save() {
  const router = useRouter();
  // Phase 0: auth is simulated. Any option continues to the privacy preset.
  const next = () => router.push('/(onboarding)/privacy');

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.lg }}>
        <OnboardingProgress step={4} total={6} />
        <View style={{ gap: spacing.sm }}>
          <Display style={{ fontSize: 34 }}>{copy.save.prompt}</Display>
          <Body style={{ fontSize: 18 }}>{copy.save.body}</Body>
        </View>

        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          <Button label={copy.save.google} variant="secondary" onPress={next} />
          <Button label={copy.save.apple} variant="secondary" onPress={next} />
          <Button label={copy.save.email} variant="gold" onPress={next} />
        </View>

        <View style={{ alignItems: 'center', marginTop: spacing.lg, gap: spacing.md }}>
          <LightDivider width={70} />
          <Caption align="center" style={{ maxWidth: 320 }}>
            Your Family Tree is private by default. Nothing is shared unless you choose to.
          </Caption>
        </View>
      </View>
    </ScreenContainer>
  );
}
