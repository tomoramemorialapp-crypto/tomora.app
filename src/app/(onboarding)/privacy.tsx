import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Body, Display } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { useAppState } from '@/state/AppState';

const RECOMMENDED = { familyOnly: true, allowPublic: false };

export default function Privacy() {
  const router = useRouter();
  const { updateTreePrivacy } = useAppState();

  const [familyOnly, setFamilyOnly] = useState(RECOMMENDED.familyOnly);
  const [allowPublic, setAllowPublic] = useState(RECOMMENDED.allowPublic);
  const [busy, setBusy] = useState(false);

  const isRecommended = familyOnly === RECOMMENDED.familyOnly && allowPublic === RECOMMENDED.allowPublic;

  const onContinue = async () => {
    setBusy(true);
    try {
      await updateTreePrivacy({
        defaultVisibility: familyOnly ? 'family_tree' : 'public',
        publicSharingEnabled: allowPublic,
      });
    } catch {
      // privacy is saved with sensible defaults already; continue regardless
    } finally {
      setBusy(false);
      router.push('/(onboarding)/invite');
    }
  };

  return (
    <ScreenContainer
      showBack
      footer={
        <Button
          label={isRecommended ? copy.privacy.cta : copy.privacy.ctaChanged}
          variant="gold"
          loading={busy}
          onPress={onContinue}
        />
      }
    >
      <View style={{ gap: spacing.lg }}>
        <OnboardingProgress step={4} total={5} />
        <View style={{ gap: spacing.sm }}>
          <Display style={{ fontSize: 32 }}>{copy.privacy.prompt}</Display>
          <Body style={{ fontSize: 17, color: colors.deepUmber }}>{copy.privacy.reassurance}</Body>
        </View>

        <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
          <Checkbox
            checked={familyOnly}
            onChange={setFamilyOnly}
            label="Family-only access"
            description="Only people you invite can see your Family Tree."
          />
          <Checkbox
            checked={allowPublic}
            onChange={setAllowPublic}
            label="Allow public pages"
            description="Let chosen memorial or profile pages be shared publicly. Off keeps everything private."
          />
        </Card>
      </View>
    </ScreenContainer>
  );
}
