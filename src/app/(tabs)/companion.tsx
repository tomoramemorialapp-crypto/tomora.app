import { View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TomoraEmblem } from '@/components/brand/TomoraEmblem';
import { CompanionChat } from '@/components/companion/CompanionChat';
import { Caption, Display } from '@/components/ui/Typography';
import { spacing } from '@/constants/theme';
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

      <View style={{ flex: 1, minHeight: 420 }}>
        <CompanionChat />
      </View>
    </ScreenContainer>
  );
}
