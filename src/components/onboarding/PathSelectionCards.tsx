import { View } from 'react-native';
import { spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Body, Title } from '@/components/ui/Typography';

export function PathSelectionCards({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <View style={{ gap: spacing.md }}>
      {copy.choosePath.cards.map((card) => (
        <Card
          key={card.id}
          onPress={card.enabled ? () => onSelect(card.id) : undefined}
          accessibilityLabel={card.title}
          style={{ opacity: card.enabled ? 1 : 0.6 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Title>{card.title}</Title>
              <Body>{card.subtitle}</Body>
            </View>
            {!card.enabled ? <Badge label="Soon" tone="soft" /> : null}
          </View>
        </Card>
      ))}
    </View>
  );
}
