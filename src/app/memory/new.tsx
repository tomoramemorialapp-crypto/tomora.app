import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { MemoryVisibilitySelector } from '@/components/memories/MemoryVisibilitySelector';
import { Avatar } from '@/components/ui/Avatar';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import type { VisibilityLevel } from '@/types/models';

export default function NewMemory() {
  const router = useRouter();
  const { nodeId } = useLocalSearchParams<{ nodeId?: string }>();
  const { nodes, getNode, addTextMemory } = useAppState();

  const defaultNode = useMemo(
    () => (nodeId ? getNode(String(nodeId)) : undefined) ?? nodes.find((n) => !n.ownerAccountId) ?? nodes[0],
    [getNode, nodeId, nodes],
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(defaultNode?.id);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<VisibilityLevel>('family_tree');

  const targetNode = selectedNodeId ? getNode(selectedNodeId) : undefined;
  const canSave = !!targetNode && body.trim().length > 0;

  const onSave = () => {
    if (!targetNode) return;
    addTextMemory({ nodeId: targetNode.id, title, body, visibility });
    router.back();
  };

  return (
    <ScreenContainer
      maxWidth={620}
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button label="Save this memory" variant="gold" disabled={!canSave} onPress={onSave} />
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>Keep this close</Caption>
          <Display style={{ fontSize: 32 }}>Add a memory</Display>
        </View>

        {/* Who it's for */}
        <View style={{ gap: spacing.sm }}>
          <Body style={{ color: colors.deepUmber }}>For</Body>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {nodes.map((n) => {
              const active = n.id === selectedNodeId;
              return (
                <Pressable
                  key={n.id}
                  onPress={() => setSelectedNodeId(n.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={n.displayName}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: radii.pill,
                    borderWidth: 1.5,
                    borderColor: active ? colors.guardianGold : colors.mistBeige,
                    backgroundColor: active ? 'rgba(184,135,47,0.12)' : colors.white,
                  }}
                >
                  <Avatar name={n.displayName} size={28} memorial={n.isLiving === false} />
                  <Body style={{ fontSize: 15, fontWeight: '600', color: active ? colors.guardianGold : colors.ink }}>
                    {n.displayName}
                  </Body>
                </Pressable>
              );
            })}
          </View>
        </View>

        <TextField label="Title (optional)" value={title} onChangeText={setTitle} placeholder="A few words" />

        <TextField
          label="Your story"
          value={body}
          onChangeText={setBody}
          placeholder="Share a moment, a feeling, or something you never want to forget…"
          multiline
          autoFocus
        />

        <MemoryVisibilitySelector value={visibility} onChange={setVisibility} />
      </View>
    </ScreenContainer>
  );
}
