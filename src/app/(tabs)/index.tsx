import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { LightDivider } from '@/components/brand/LightDivider';
import { GoldStar } from '@/components/brand/GoldStar';
import { colors, spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { useAppState } from '@/state/AppState';

function ActionCard({
  title,
  body,
  badge,
  badgeTone = 'soft',
  onPress,
  accent = false,
}: {
  title: string;
  body: string;
  badge?: string;
  badgeTone?: 'soft' | 'gold' | 'memorial' | 'neutral';
  onPress?: () => void;
  accent?: boolean;
}) {
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={title}
      style={accent ? { backgroundColor: colors.candlelight, borderColor: colors.softGold } : undefined}
    >
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
          <Title>{title}</Title>
          {badge ? <Badge label={badge} tone={badgeTone} /> : <GoldStar size={14} />}
        </View>
        <Body>{body}</Body>
      </View>
    </Card>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { account, nodes } = useAppState();

  const lovedOne = nodes.find((n) => !n.ownerAccountId) ?? nodes[1];
  const lights = nodes.length;

  return (
    <ScreenContainer maxWidth={620}>
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>
          {account ? `Hello, ${account.displayName}` : 'Welcome'}
        </Caption>
        <Display style={{ fontSize: 34 }}>{copy.dashboard.title}</Display>
        <Body style={{ fontSize: 18 }}>{copy.dashboard.subtitle}</Body>
      </View>

      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <LightDivider width={90} />
      </View>

      <View style={{ gap: spacing.md }}>
        <ActionCard
          title="Family Tree"
          body={`${lights} ${lights === 1 ? 'light' : 'lights'} connected.`}
          onPress={() => router.push('/(tabs)/family-tree')}
        />
        <ActionCard
          title="Add a Memory"
          body="Keep a story, photo, or moment close."
          accent
          onPress={() =>
            router.push(
              lovedOne ? { pathname: '/memory/new', params: { nodeId: lovedOne.id } } : '/memory/new',
            )
          }
        />
        <ActionCard
          title="Invite Family"
          body="Let someone claim their node and choose what they share."
          onPress={() => router.push('/(tabs)/profile')}
        />
        <ActionCard
          title="Privacy"
          body="Your Family Tree is kept for family only."
          badge="Invite-only · Public off"
          badgeTone="gold"
          onPress={() => router.push('/(tabs)/profile')}
        />
        <ActionCard
          title="Occasions"
          body="Gather family for birthdays, weddings, and remembrances."
          badge="Soon"
          onPress={() => router.push('/(tabs)/occasions')}
        />
        <ActionCard
          title="Tomora Companion"
          body="A gentle guide for your memories and relationships."
          badge="Coming soon"
          onPress={() => router.push('/(tabs)/companion')}
        />
      </View>
    </ScreenContainer>
  );
}
