import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LightDivider } from '@/components/brand/LightDivider';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
      <Body style={{ color: colors.deepUmber }}>{label}</Body>
      <Body style={{ fontWeight: '600' }}>{value}</Body>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { account, tree, nodes, memories, resetAll } = useAppState();

  const onReset = () => {
    resetAll();
    router.replace('/welcome');
  };

  return (
    <ScreenContainer maxWidth={620}>
      <View style={{ gap: spacing.lg }}>
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <Avatar name={account?.displayName ?? 'You'} size={88} />
          <Display style={{ fontSize: 30 }}>{account?.displayName ?? 'You'}</Display>
          <Badge label="Account Owner · Creator" tone="gold" />
        </View>

        <Card>
          <Title>Privacy</Title>
          <View style={{ marginTop: spacing.sm }}>
            <Row label="Family Tree" value="Invite-only" />
            <View style={{ height: 1, backgroundColor: colors.hairline }} />
            <Row label="Public sharing" value={tree?.publicSharingEnabled ? 'On' : 'Off'} />
            <View style={{ height: 1, backgroundColor: colors.hairline }} />
            <Row label="Default for new content" value="Family Tree" />
          </View>
          <Caption style={{ marginTop: spacing.sm }}>
            Privacy is always free. Nothing is public unless you choose to share it.
          </Caption>
        </Card>

        <Card>
          <Title>Your tree at a glance</Title>
          <View style={{ marginTop: spacing.sm }}>
            <Row label="Lights connected" value={String(nodes.length)} />
            <View style={{ height: 1, backgroundColor: colors.hairline }} />
            <Row label="Memories kept" value={String(memories.length)} />
          </View>
        </Card>

        <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
          <LightDivider width={70} />
        </View>

        <Button label="Start over" variant="secondary" onPress={onReset} />
        <Caption align="center">This clears the demo and returns to the welcome screen.</Caption>
      </View>
    </ScreenContainer>
  );
}
