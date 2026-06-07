import { Linking, Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';

const LANDING_URL = 'https://tomora.app';

async function openLanding() {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(LANDING_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(LANDING_URL);
  } catch {
    // ignore
  }
}

/** Footer CTA shown on every public profile page. */
export function PublicProfileCta() {
  return (
    <View
      style={{
        marginTop: spacing.xl,
        padding: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: colors.candlelight,
        borderWidth: 1,
        borderColor: colors.softGold,
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <Title style={{ fontSize: 20, textAlign: 'center' }}>Start your own Family Tree</Title>
      <Body align="center" style={{ color: colors.deepUmber, maxWidth: 420 }}>
        Tomora helps families preserve stories, relationships, and memories — privately, warmly, and together.
      </Body>
      <Button label="Create your own Tree" variant="gold" fullWidth={false} onPress={openLanding} />
      <Pressable onPress={openLanding} hitSlop={8}>
        <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>{LANDING_URL}</Caption>
      </Pressable>
    </View>
  );
}
