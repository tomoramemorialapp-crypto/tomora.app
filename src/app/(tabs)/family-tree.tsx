import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { KinshipTreeCanvas } from '@/components/family-tree/KinshipTreeCanvas';
import { Badge } from '@/components/ui/Badge';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';

export default function FamilyTreeScreen() {
  const router = useRouter();
  const { nodes, relationships, tree, materializeUnknown } = useAppState();
  const { height } = useWindowDimensions();
  const [materializing, setMaterializing] = useState(false);
  const [materializeError, setMaterializeError] = useState<string | null>(null);

  const selfNode = nodes.find((n) => n.ownerAccountId) ?? nodes[0];

  // Give the canvas as much room as possible (the header + tab bar take ~300px).
  const canvasHeight = Math.max(460, Math.round(height) - 300);

  return (
    <ScreenContainer maxWidth={720}>
      <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>{tree?.name ?? 'My Family Tree'}</Caption>
          <Badge label="Private · Family Tree" tone="gold" />
        </View>
        <Display style={{ fontSize: 32 }}>Your Family Tree</Display>
        <Body style={{ fontSize: 16 }}>
          Tap a light to see how you’re connected. Solid gold lines are biological parents; dashed are step-parents; dotted
          grey are parents-in-law.
        </Body>
        {materializeError ? <Caption style={{ color: colors.error }}>{materializeError}</Caption> : null}
      </View>

      <KinshipTreeCanvas
        nodes={nodes}
        relationships={relationships}
        anchorNodeId={selfNode?.id}
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
      />
    </ScreenContainer>
  );
}
