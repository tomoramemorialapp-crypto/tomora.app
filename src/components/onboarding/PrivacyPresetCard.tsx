import { View } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/Badge';
import { GoldStar } from '@/components/brand/GoldStar';

export function PrivacyPresetCard() {
  return (
    <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <GoldStar size={16} />
          <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.4, color: colors.deepUmber }}>
            Recommended
          </Caption>
        </View>
        <Title>{copy.privacy.recommended}</Title>
        <Body style={{ color: colors.deepUmber }}>{copy.privacy.reassurance}</Body>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, flexWrap: 'wrap' }}>
          <Badge label="Private by default" tone="gold" />
          <Badge label="Public off" tone="soft" />
        </View>
      </View>
    </Card>
  );
}
