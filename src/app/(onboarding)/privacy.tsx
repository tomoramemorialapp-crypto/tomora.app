import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { PrivacyPresetCard } from '@/components/onboarding/PrivacyPresetCard';
import { Button } from '@/components/ui/Button';
import { Display } from '@/components/ui/Typography';
import { spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';

export default function Privacy() {
  const router = useRouter();

  return (
    <ScreenContainer
      showBack
      footer={
        <View style={{ gap: spacing.md }}>
          <Button label={copy.privacy.cta} variant="gold" onPress={() => router.push('/(onboarding)/invite')} />
          <Button label={copy.privacy.secondary} variant="ghost" onPress={() => router.push('/(onboarding)/invite')} />
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <OnboardingProgress step={5} total={6} />
        <Display style={{ fontSize: 32 }}>{copy.privacy.prompt}</Display>
        <PrivacyPresetCard />
      </View>
    </ScreenContainer>
  );
}
