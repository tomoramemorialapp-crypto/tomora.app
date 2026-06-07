import { useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { KinshipTreeCanvas } from '@/components/family-tree/KinshipTreeCanvas';
import { Badge } from '@/components/ui/Badge';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import { findTreeAnchorId, treeMemberNodes } from '@/lib/activeNodes';
import { useAppState } from '@/state/AppState';

export default function FamilyTreeScreen() {
  const router = useRouter();
  const { nodes, relationships, tree, materializeUnknown } = useAppState();
  const { height } = useWindowDimensions();
  const [materializing, setMaterializing] = useState(false);
  const [materializeError, setMaterializeError] = useState<string | null>(null);
  const [minimalView, setMinimalView] = useState(false);

  const liveNodes = treeMemberNodes(nodes, relationships, findTreeAnchorId(nodes));
  const selfNode = liveNodes.find((n) => n.ownerAccountId) ?? liveNodes[0];
  const [viewAnchorId, setViewAnchorId] = useState<string | undefined>(selfNode?.id);

  useEffect(() => {
    if (selfNode?.id) {
      setViewAnchorId((prev) => prev ?? selfNode.id);
    }
  }, [selfNode?.id]);

  // Give the canvas as much room as possible (header + tab bar; minimal view drops the header).
  const canvasHeight = Math.max(460, Math.round(height) - (minimalView ? 120 : 300));

  return (
    <ScreenContainer maxWidth={720}>
      {!minimalView ? (
        <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>{tree?.name ?? 'My Family Tree'}</Caption>
            <Badge label="Private · Family Tree" tone="gold" />
          </View>
          <Display style={{ fontSize: 32 }}>Your Family Tree</Display>
          <Body style={{ fontSize: 16 }}>
            Tap someone to view the tree from their perspective. Tap them again for profile actions. Drag lights to tidy
            the layout. Open Filters for line and node legends.
          </Body>
          {materializeError ? <Caption style={{ color: colors.error }}>{materializeError}</Caption> : null}
        </View>
      ) : materializeError ? (
        <Caption style={{ color: colors.error, marginBottom: spacing.sm }}>{materializeError}</Caption>
      ) : null}

      <KinshipTreeCanvas
        nodes={liveNodes}
        relationships={relationships}
        anchorNodeId={viewAnchorId}
        homeAnchorNodeId={selfNode?.id}
        onAnchorChange={setViewAnchorId}
        height={canvasHeight}
        onSelectNode={(nodeId) => router.push({ pathname: '/node/[nodeId]', params: { nodeId } })}
        onOpenMemorial={(nodeId) => router.push({ pathname: '/memorial/[nodeId]', params: { nodeId } })}
        onCompleteUnknown={async (node) => {
          if (materializing) return;
          setMaterializeError(null);
          setMaterializing(true);
          try {
            const created = await materializeUnknown(node);
            router.push({ pathname: '/node/edit', params: { nodeId: created.id } });
          } catch (e: unknown) {
            setMaterializeError(
              e instanceof Error ? e.message : 'Could not create a profile for this person. Please try again.',
            );
          } finally {
            setMaterializing(false);
          }
        }}
        onAddRelative={() => router.push('/relative/new')}
        onAddRelativeFromNode={(nodeId) =>
          router.push({ pathname: '/relative/new', params: { contextNodeId: nodeId } })
        }
        onMinimalViewChange={setMinimalView}
      />
    </ScreenContainer>
  );
}
