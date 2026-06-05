import { View } from 'react-native';
import { spacing } from '@/constants/theme';
import type { Memory } from '@/types/models';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { VisibilityBadge } from '@/components/ui/Badge';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function MemoryCard({ memory }: { memory: Memory }) {
  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {memory.title ? <Title>{memory.title}</Title> : <Title>A memory</Title>}
          <VisibilityBadge visibility={memory.visibility} />
        </View>
        {memory.body ? <Body>{memory.body}</Body> : null}
        <Caption>{formatDate(memory.createdAt)}</Caption>
      </View>
    </Card>
  );
}
