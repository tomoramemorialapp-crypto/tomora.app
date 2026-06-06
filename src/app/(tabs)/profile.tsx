import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShareSheet } from '@/components/ui/ShareSheet';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import { formatBytes, STORAGE_QUOTA_BYTES } from '@/lib/media';

function daysUntil(iso?: string): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

/** A tappable settings row with label, optional value, and chevron. */
function Row({
  label,
  value,
  onPress,
  danger,
  last,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.hairline,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Body style={{ color: danger ? colors.error : colors.ink, fontWeight: danger ? '600' : '400' }}>{label}</Body>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 }}>
        {value ? (
          <Caption numberOfLines={1} style={{ maxWidth: 180 }}>
            {value}
          </Caption>
        ) : null}
        {onPress ? <Caption style={{ color: colors.ashTaupe }}>›</Caption> : null}
      </View>
    </Pressable>
  );
}

export default function YouScreen() {
  const router = useRouter();
  const { account, session, nodes, mediaUsageBytes, undoAccountDeletion, resetAll } = useAppState();
  const [shareOpen, setShareOpen] = useState(false);
  const [undoing, setUndoing] = useState(false);

  const selfNode = nodes.find((n) => n.ownerAccountId === account?.id);
  const photo = selfNode?.profile?.profilePhoto?.value ?? selfNode?.avatarUrl;
  const isVacated = account?.status === 'vacated';
  const graceDays = daysUntil(account?.deletionScheduledFor);
  const usedPct = Math.min(1, mediaUsageBytes / STORAGE_QUOTA_BYTES);
  const inviteLink = `https://tomora.app/invite/${account?.inviteCode ?? ''}`;

  const onSignOut = async () => {
    await resetAll();
    router.replace('/welcome');
  };

  const onUndo = async () => {
    setUndoing(true);
    try {
      await undoAccountDeletion();
    } finally {
      setUndoing(false);
    }
  };

  return (
    <ScreenContainer maxWidth={620}>
      <View style={{ gap: spacing.lg }}>
        {/* Vacated / pending-deletion banner */}
        {isVacated ? (
          <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.error, borderWidth: 1 }}>
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title>Account closing</Title>
                <Badge label="Vacated" tone="neutral" />
              </View>
              <Body style={{ color: colors.deepUmber }}>
                Your account is scheduled for permanent deletion in{' '}
                <Body style={{ fontWeight: '700' }}>{graceDays} {graceDays === 1 ? 'day' : 'days'}</Body>. Until then,
                nothing is lost — you can bring everything back.
              </Body>
              <Button label={undoing ? 'Restoring…' : 'Undo deletion'} variant="gold" disabled={undoing} onPress={onUndo} />
            </View>
          </Card>
        ) : null}

        {/* Profile header (mirrors your Life Profile node) */}
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <Avatar name={account?.displayName ?? 'You'} size={88} uri={photo} />
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Display style={{ fontSize: 30 }}>{account?.displayName ?? 'You'}</Display>
            {account?.username ? <Caption>@{account.username}</Caption> : null}
          </View>
          <Badge label="Account Owner · Creator" tone="gold" />
          {selfNode ? (
            <Button
              label="Edit my Life Profile"
              variant="secondary"
              fullWidth={false}
              onPress={() => router.push({ pathname: '/node/edit', params: { nodeId: selfNode.id } })}
            />
          ) : null}
          <Caption align="center" style={{ maxWidth: 360 }}>
            Everything here is your single source of truth — your edits flow straight into your Life Profile in the
            Family Tree.
          </Caption>
        </View>

        {/* Account & settings */}
        <Card>
          <SectionLabel>Account</SectionLabel>
          <Row label="Account & security" value={session?.user?.email ?? undefined} onPress={() => router.push('/settings/account')} />
          <Row label="Invite link" value="Share" onPress={() => setShareOpen(true)} />
          <Row label="Billing & subscription" value="Free plan" onPress={() => router.push('/settings/billing')} last />
        </Card>

        {/* Storage */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title>Media storage</Title>
            <Caption>{formatBytes(mediaUsageBytes)} / {formatBytes(STORAGE_QUOTA_BYTES)}</Caption>
          </View>
          <View
            style={{
              marginTop: spacing.md,
              height: 10,
              borderRadius: radii.pill,
              backgroundColor: colors.mistBeige,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${Math.max(usedPct * 100, mediaUsageBytes > 0 ? 3 : 0)}%`,
                height: '100%',
                borderRadius: radii.pill,
                backgroundColor: colors.guardianGold,
              }}
            />
          </View>
          <Caption style={{ marginTop: spacing.sm }}>
            Photos, videos, and files you've uploaded. They stay in your account unless you share a memory.
          </Caption>
        </Card>

        {/* Privacy */}
        <Card>
          <SectionLabel>Privacy</SectionLabel>
          <Row label="Family Tree" value="Invite-only" />
          <Row label="Default for new content" value="Family Tree" />
          <Row label="Your data" value="Account-side" last />
          <Caption style={{ marginTop: spacing.sm }}>
            Privacy is always free. Nothing is public unless you choose to share it.
          </Caption>
        </Card>

        {/* Danger / session */}
        <Card>
          <Row label="Sign out" onPress={onSignOut} />
          {!isVacated ? (
            <Row label="Delete account" danger onPress={() => router.push('/settings/delete')} last />
          ) : (
            <Row label="Manage deletion" danger onPress={() => router.push('/settings/delete')} last />
          )}
        </Card>

        <Caption align="center">Signed in as {session?.user?.email ?? 'your account'}.</Caption>
      </View>

      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        link={inviteLink}
        title="Invite to your Family Tree"
        message="Join our Family Tree on Tomora and claim your place."
      />
    </ScreenContainer>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.4, color: colors.deepUmber, marginBottom: spacing.xs }}>
      {children}
    </Caption>
  );
}
