import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import { bridgePrompt } from '@/constants/copy';
import type { RelationshipType } from '@/types/models';

const INDIRECT: RelationshipType[] = ['grandparent', 'grandchild', 'aunt_uncle', 'niece_nephew', 'cousin'];

export function isIndirect(type: RelationshipType): boolean {
  return INDIRECT.includes(type);
}

/**
 * Gentle prompt shown when a new family member's connection to the Anchor User
 * is indirect (needs an intermediate person) or unclear ("Not sure yet").
 * Explains how Tomora will bridge the relationship with an Unknown link.
 */
export function DisconnectedNodeBridgePrompt({
  relationshipType,
  relationshipLabel,
}: {
  relationshipType: RelationshipType;
  relationshipLabel: string;
}) {
  const unsure = relationshipType === 'other';
  if (!unsure && !isIndirect(relationshipType)) return null;

  return (
    <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
      <View style={{ gap: spacing.xs }}>
        <Title style={{ fontSize: 18 }}>{bridgePrompt.title}</Title>
        <Body style={{ fontSize: 15 }}>
          {unsure ? bridgePrompt.unknownNote : bridgePrompt.indirectNote(relationshipLabel)}
        </Body>
        <Caption style={{ marginTop: 4 }}>
          {unsure
            ? 'Saved as an Unknown link — visible only to you and easy to complete later.'
            : 'The Family Tree will keep the branches connected automatically.'}
        </Caption>
      </View>
    </Card>
  );
}
