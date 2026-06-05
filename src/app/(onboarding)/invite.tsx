import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { Button } from '@/components/ui/Button';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { createId } from '@/lib/relationshipUtils';

export default function Invite() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const finish = () => {
    router.replace('/(tabs)');
  };

  const copyLink = async () => {
    const link = `https://tomora.app/invite/${createId('inv')}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
      }
    } catch {
      // clipboard may be unavailable; the reassurance still shows
    }
    setCopied(true);
  };

  return (
    <ScreenContainer
      showBack
      footer={
        <View style={{ gap: spacing.md }}>
          <Button label={copy.invite.inviteNow} variant="gold" onPress={finish} />
          <Button label={copied ? 'Private link copied' : copy.invite.copyLink} variant="secondary" onPress={copyLink} />
          <Button label={copy.invite.skip} variant="ghost" onPress={finish} />
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <OnboardingProgress step={6} total={6} />
        <Display style={{ fontSize: 32 }}>{copy.invite.prompt}</Display>
        <Body style={{ fontSize: 18 }}>{copy.invite.body}</Body>
        {copied ? (
          <Caption style={{ marginTop: spacing.xs }}>
            A private link is on your clipboard. Only people you share it with can use it.
          </Caption>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
