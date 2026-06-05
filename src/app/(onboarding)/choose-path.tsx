import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { PathSelectionCards } from '@/components/onboarding/PathSelectionCards';
import { Display } from '@/components/ui/Typography';
import { spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';

export default function ChoosePath() {
  const router = useRouter();

  const onSelect = (id: string) => {
    // MVP: both functional paths lead into the same gentle add-self flow.
    if (id === 'start_tree' || id === 'claim_node') {
      router.push('/(onboarding)/add-self');
    }
  };

  return (
    <ScreenContainer showBack>
      <View style={{ gap: spacing.lg }}>
        <OnboardingProgress step={1} total={6} />
        <Display style={{ fontSize: 34 }}>{copy.choosePath.prompt}</Display>
        <PathSelectionCards onSelect={onSelect} />
      </View>
    </ScreenContainer>
  );
}
