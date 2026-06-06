import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    current: true,
    features: ['Your Family Tree', 'Up to 1 GB media', 'Privacy always free'],
  },
  {
    id: 'keepsake',
    name: 'Keepsake',
    price: '$6',
    cadence: 'per month',
    current: false,
    features: ['50 GB media', 'Occasion Pages', 'Priority memory backups'],
  },
  {
    id: 'legacy',
    name: 'Legacy',
    price: '$12',
    cadence: 'per month',
    current: false,
    features: ['250 GB media', 'Family co-billing', 'Heirloom export'],
  },
];

export default function BillingSettings() {
  const router = useRouter();

  return (
    <ScreenContainer maxWidth={620} showBack onBack={() => router.back()}>
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <Display style={{ fontSize: 28 }}>Billing & subscription</Display>
        <Caption>Manage your plan, payment method, and invoices.</Caption>
      </View>

      <Card style={{ marginBottom: spacing.lg, backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title>Current plan</Title>
          <Badge label="Free" tone="gold" />
        </View>
        <Body style={{ marginTop: spacing.sm, color: colors.deepUmber }}>
          You're on the Free plan. Your Family Tree and privacy are always free.
        </Body>
      </Card>

      <SectionHeader title="Plans" />
      <View style={{ gap: spacing.md, marginTop: spacing.sm, marginBottom: spacing.lg }}>
        {PLANS.map((p) => (
          <Card key={p.id} style={p.current ? { borderColor: colors.guardianGold, borderWidth: 1.5 } : undefined}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Title>{p.name}</Title>
                <Caption>
                  {p.price} · {p.cadence}
                </Caption>
              </View>
              {p.current ? <Badge label="Current" tone="soft" /> : null}
            </View>
            <View style={{ gap: 4, marginTop: spacing.sm }}>
              {p.features.map((f) => (
                <Caption key={f} style={{ color: colors.deepUmber }}>
                  · {f}
                </Caption>
              ))}
            </View>
            {!p.current ? (
              <View style={{ marginTop: spacing.md }}>
                <Button label={`Upgrade to ${p.name}`} variant="secondary" onPress={() => {}} />
              </View>
            ) : null}
          </Card>
        ))}
        <Caption align="center">Paid plans are coming soon — upgrades aren't billed yet.</Caption>
      </View>

      <SectionHeader title="Invoices" />
      <Card style={{ marginTop: spacing.sm }}>
        <Body style={{ color: colors.deepUmber }}>No invoices yet. Your receipts will appear here once you start a paid plan.</Body>
      </Card>
    </ScreenContainer>
  );
}
