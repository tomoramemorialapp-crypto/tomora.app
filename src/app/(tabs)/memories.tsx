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
  const { memories, nodes } = useAppState();
  const lovedOne = nodes.find((n) => !n.ownerAccountId) ?? nodes[0];

  const goAdd = () =>
    router.push(lovedOne ? { pathname: '/memory/new', params: { nodeId: lovedOne.id } } : '/memory/new');

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
            <MemoryCard key={m.id} memory={m} />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
