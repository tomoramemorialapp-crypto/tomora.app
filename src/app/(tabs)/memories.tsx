import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { MemoryCard } from '@/components/memories/MemoryCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Caption, Display } from '@/components/ui/Typography';
import { spacing } from '@/constants/theme';
import { copy } from '@/constants/copy';
import { useAppState } from '@/state/AppState';

export default function MemoriesScreen() {
  const router = useRouter();
  const { memories, nodes, getNode } = useAppState();
  const selfNode = nodes.find((n) => n.ownerAccountId) ?? nodes[0];

  // From the Memories tab, a new memory defaults to the user, with a picker to
  // choose someone else.
  const goAdd = () =>
    router.push({
      pathname: '/memory/new',
      params: { pickRecipient: '1', ...(selfNode ? { nodeId: selfNode.id } : {}) },
    });

  return (
    <ScreenContainer
      maxWidth={620}
      footer={memories.length > 0 ? <Button label="Add a memory" variant="gold" onPress={goAdd} /> : undefined}
    >
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>Kept close</Caption>
        <Display style={{ fontSize: 32 }}>Memories</Display>
      </View>

      {memories.length === 0 ? (
        <EmptyState
          title={copy.emptyMemories.title}
          body={copy.emptyMemories.body}
          action={<Button label="Add your first memory" variant="gold" onPress={goAdd} />}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {memories.map((m) => (
            <MemoryCard
              key={m.id}
              memory={m}
              getNodeName={(id) => getNode(id)?.displayName}
              onOpen={() => router.push({ pathname: '/memory/[memoryId]', params: { memoryId: m.id } })}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
