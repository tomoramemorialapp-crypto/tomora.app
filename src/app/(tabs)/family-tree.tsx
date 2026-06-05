import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { KinshipTreeCanvas } from '@/components/family-tree/KinshipTreeCanvas';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';

export default function FamilyTreeScreen() {
  const router = useRouter();
  const { nodes, relationships, tree } = useAppState();

  const selfNode = nodes.find((n) => n.ownerAccountId) ?? nodes[0];
  const lovedOne = nodes.find((n) => !n.ownerAccountId) ?? nodes[1];

  return (
    <ScreenContainer
      maxWidth={720}
      footer={
        lovedOne ? (
          <Button
            label="Add a memory"
            variant="gold"
            onPress={() => router.push({ pathname: '/memory/new', params: { nodeId: lovedOne.id } })}
          />
        ) : undefined
      }
    >
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>{tree?.name ?? 'My Family Tree'}</Caption>
          <Badge label="Private · Family Tree" tone="gold" />
        </View>
        <Display style={{ fontSize: 32 }}>Your Family Tree</Display>
        <Body style={{ fontSize: 17 }}>Tap a light to see how you’re connected, then open their Life Profile.</Body>
      </View>

      <View style={{ paddingVertical: spacing.lg }}>
        <KinshipTreeCanvas
          nodes={nodes}
          relationships={relationships}
          anchorNodeId={selfNode?.id}
          onSelectNode={(nodeId) => router.push({ pathname: '/node/[nodeId]', params: { nodeId } })}
          onAddRelative={() => router.push('/relative/new')}
        />
      </View>
    </ScreenContainer>
  );
}
