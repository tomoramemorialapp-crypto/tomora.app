import { View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TomoraEmblem } from '@/components/brand/TomoraEmblem';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';

const USES = [
  'Explain how two people are related.',
  'Gently search the memories you can access.',
  'Help write tributes, captions, and family bios.',
  'Remind you about birthdays and anniversaries.',
];

export default function CompanionScreen() {
  return (
    <ScreenContainer maxWidth={560} center>
      <View style={{ alignItems: 'center', gap: spacing.lg }}>
        <TomoraEmblem size={96} />
        <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>Tomora Companion</Caption>
        <Display align="center" style={{ fontSize: 32 }}>
          A gentle guide, coming soon.
        </Display>

        <Card style={{ width: '100%' }}>
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title>What it will help with</Title>
              <Badge label="Coming soon" tone="gold" />
            </View>
            {USES.map((u) => (
              <Body key={u} style={{ color: colors.charcoal }}>
                · {u}
              </Body>
            ))}
            <Body style={{ color: colors.ashTaupe, fontSize: 14 }}>
              The Companion is a memory and relationship guide — never a way to “talk to” someone who has passed.
              It only ever sees what you’re allowed to see.
            </Body>
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}
