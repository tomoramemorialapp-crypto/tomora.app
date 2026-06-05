import { View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { GoldStar } from '@/components/brand/GoldStar';
import { colors, spacing } from '@/constants/theme';

const TYPES = [
  'Birthday',
  'Wedding',
  'Anniversary',
  'Graduation',
  'Family reunion',
  'Memorial service',
  'Death anniversary',
  'Baby celebration',
];

export default function OccasionsScreen() {
  return (
    <ScreenContainer maxWidth={620}>
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>Moments together</Caption>
        <Display style={{ fontSize: 32 }}>Occasions</Display>
      </View>

      <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title>Gather your family</Title>
            <Badge label="Coming soon" tone="gold" />
          </View>
          <Body style={{ color: colors.deepUmber }}>
            Occasion Pages will let you host birthdays, weddings, reunions, and remembrances — with a guestbook,
            shared memories, and gentle ways to send support.
          </Body>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
            {TYPES.map((t) => (
              <View
                key={t}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <GoldStar size={10} />
                <Caption style={{ color: colors.deepUmber, fontSize: 13 }}>{t}</Caption>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </ScreenContainer>
  );
}
