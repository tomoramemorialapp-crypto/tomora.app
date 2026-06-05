import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Body, Display } from '@/components/ui/Typography';
import { GoldStar } from '@/components/brand/GoldStar';
import { spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { useAppState } from '@/state/AppState';

export default function AddSelf() {
  const router = useRouter();
  const { draft, setDraft } = useAppState();
  const [name, setName] = useState(draft.selfName);

  const canContinue = name.trim().length > 0;

  const onContinue = () => {
    setDraft({ selfName: name.trim() });
    router.push('/(onboarding)/add-loved-one');
  };

  return (
    <ScreenContainer
      showBack
      footer={<Button label={copy.addSelf.cta} variant="gold" disabled={!canContinue} onPress={onContinue} />}
    >
      <View style={{ gap: spacing.lg }}>
        <OnboardingProgress step={2} total={6} />
        <View style={{ alignItems: 'flex-start', gap: spacing.sm }}>
          <GoldStar size={20} />
          <Display style={{ fontSize: 34 }}>{copy.addSelf.prompt}</Display>
          <Body style={{ fontSize: 18 }}>{copy.addSelf.body}</Body>
        </View>

        <TextField
          label="First name or what you’d like to be called"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoFocus
          returnKeyType="next"
          onSubmitEditing={() => canContinue && onContinue()}
        />
      </View>
    </ScreenContainer>
  );
}
