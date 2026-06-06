import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import { relationshipLabel } from '@/lib/relationshipUtils';
import type { InvitePreview } from '@/services/inviteService';
import type { RelationshipType } from '@/types/models';

type Props = {
  preview: InvitePreview | null;
  loading?: boolean;
  code?: string;
};

export function ClaimInvitePreview({ preview, loading, code }: Props) {
  if (loading) {
    return (
      <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
        <Caption style={{ color: colors.deepUmber }}>Looking up your invite…</Caption>
      </Card>
    );
  }

  if (!preview?.valid) {
    if (!code?.trim()) return null;
    return (
      <Card style={{ borderColor: colors.mistBeige }}>
        <Body style={{ color: colors.deepUmber }}>
          {preview?.reason === 'ALREADY_CLAIMED'
            ? 'This profile has already been claimed.'
            : 'Enter a valid invite code to see who saved a place for you.'}
        </Body>
      </Card>
    );
  }

  const rel =
    preview.relationshipType && preview.relationshipType !== 'other'
      ? relationshipLabel(preview.relationshipType as RelationshipType)
      : 'Family member';

  return (
    <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
      <View style={{ gap: spacing.md }}>
        <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.4, color: colors.deepUmber }}>
          You&apos;ve been invited to a Family Tree
        </Caption>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar name={preview.displayName ?? 'You'} size={56} />
          <View style={{ flex: 1, gap: 4 }}>
            <Caption style={{ color: colors.ashTaupe }}>{preview.inviterName} added a place for you as</Caption>
            <Title style={{ fontSize: 22 }}>{preview.displayName}</Title>
            <Body style={{ fontSize: 15, color: colors.deepUmber }}>Relationship: {rel}</Body>
            {preview.treeName ? (
              <Caption style={{ color: colors.ashTaupe }}>{preview.treeName}</Caption>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}
