import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { Button } from '@/components/ui/Button';
import { ShareSheet } from '@/components/ui/ShareSheet';
import { Body, Display } from '@/components/ui/Typography';
import { spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { createId } from '@/lib/relationshipUtils';

export default function Invite() {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const link = useMemo(() => `https://tomora.app/invite/${createId('inv')}`, []);

  const finish = () => router.replace('/(tabs)');

  return (
    <>
      <ScreenContainer
        showBack
        footer={
          <View style={{ gap: spacing.md }}>
            <Button label={copy.invite.inviteNow} variant="gold" onPress={() => setShareOpen(true)} />
            <Button label={copy.invite.skip} variant="ghost" onPress={finish} />
          </View>
        }
      >
        <View style={{ gap: spacing.lg }}>
          <OnboardingProgress step={5} total={5} />
          <Display style={{ fontSize: 32 }}>{copy.invite.prompt}</Display>
          <Body style={{ fontSize: 18 }}>{copy.invite.body}</Body>
        </View>
      </ScreenContainer>

      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        link={link}
        title={copy.invite.shareTitle}
        message={copy.invite.shareMessage}
      />
    </>
  );
}
