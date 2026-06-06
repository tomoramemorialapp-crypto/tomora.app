import { View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TomoraEmblem } from '@/components/brand/TomoraEmblem';
import { CompanionChat } from '@/components/companion/CompanionChat';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useT } from '@/i18n';

export default function CompanionScreen() {
  const t = useT();

  return (
    <ScreenContainer maxWidth={560}>
      <View style={{ alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
        <TomoraEmblem size={72} />
        <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>{t('companion.kicker')}</Caption>
        <Display align="center" style={{ fontSize: 28 }}>
          {t('companion.title')}
        </Display>
      </View>

      <View
        style={{
          marginBottom: spacing.md,
          padding: spacing.md,
          borderRadius: radii.lg,
          backgroundColor: colors.candlelight,
          borderWidth: 1,
          borderColor: colors.softGold,
        }}
      >
        <Body style={{ fontSize: 14, color: colors.deepUmber, lineHeight: 20 }}>{t('companion.demoDisclaimer')}</Body>
      </View>

      <View style={{ flex: 1, minHeight: 420 }}>
        <CompanionChat />
      </View>
    </ScreenContainer>
  );
}
