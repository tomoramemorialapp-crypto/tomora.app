import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { goBack } from '@/lib/navigation';
import { useAppState } from '@/state/AppState';
import { editScopeFor } from '@/lib/profile';
import { claimLinkFor, type NodeInvite } from '@/services/inviteService';

export default function NodeInviteScreen() {
  const router = useRouter();
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const { getNode, account, generateNodeInvite, clearNodeInvite } = useAppState();

  const node = getNode(String(nodeId));
  const scope = node ? editScopeFor(node, account?.id) : 'suggest';
  const canManage = !!node && node.status !== 'claimed' && !node.ownerAccountId && (scope === 'owner' || scope === 'guardian');

  const seeded: NodeInvite | null = node?.inviteCode
    ? { node, code: node.inviteCode, password: node.claimPassword, link: claimLinkFor(node.inviteCode) }
    : null;
  const [invite, setInvite] = useState<NodeInvite | null>(seeded);
  const [password, setPassword] = useState(node?.claimPassword ?? '');
  const [usePassword, setUsePassword] = useState(!!node?.claimPassword);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!node) {
    return (
      <ScreenContainer center>
        <EmptyState title="This profile isn’t here." body="It may have been removed from your Family Tree." />
        <Button label="Back" variant="secondary" onPress={() => goBack(router)} />
      </ScreenContainer>
    );
  }

  if (!canManage) {
    return (
      <ScreenContainer maxWidth={560} showBack>
        <Display style={{ fontSize: 26, marginBottom: spacing.sm }}>Already claimed</Display>
        <Body>{node.displayName} has claimed this profile, so it can’t be invited again.</Body>
      </ScreenContainer>
    );
  }

  const onGenerate = async (regenerate = false) => {
    setBusy(true);
    try {
      const next = await generateNodeInvite(node.id, {
        regenerate,
        password: usePassword ? password : null,
      });
      setInvite(next);
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async () => {
    setBusy(true);
    try {
      await clearNodeInvite(node.id);
      setInvite(null);
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async () => {
    if (!invite) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(invite.link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // ignore — the link is still shown for manual copy
    }
  };

  return (
    <ScreenContainer maxWidth={560} showBack>
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.6 }}>Invite to claim</Caption>
        <Display style={{ fontSize: 30 }}>Invite {node.displayName}</Display>
        <Body style={{ fontSize: 16 }}>
          Share a code, link, or QR so {node.displayName} can claim their own Life Profile. Add a password for an extra
          layer of trust. Each invite works once and expires after 90 days.
        </Body>
      </View>

      {invite ? (
        <Card style={{ marginBottom: spacing.lg, alignItems: 'center', gap: spacing.md }}>
          <View style={{ padding: spacing.md, backgroundColor: colors.white, borderRadius: radii.md }}>
            <QRCode value={invite.link} size={180} color={colors.ink} backgroundColor={colors.white} />
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.4 }}>Invite code</Caption>
            <Title style={{ fontFamily: fonts.display, fontSize: 30, letterSpacing: 4 }}>{invite.code}</Title>
          </View>
          {invite.password ? (
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Caption style={{ textTransform: 'uppercase', letterSpacing: 1.4 }}>Password</Caption>
              <Body style={{ fontWeight: '700' }}>{invite.password}</Body>
            </View>
          ) : null}
          <Pressable onPress={onCopy} hitSlop={8}>
            <Caption style={{ color: colors.guardianGold, fontWeight: '700' }} numberOfLines={1}>
              {copied ? 'Link copied ✓' : `${invite.link}  ·  Copy link`}
            </Caption>
          </Pressable>
        </Card>
      ) : null}

      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Password (optional)" />
        <Pressable
          onPress={() => setUsePassword((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: usePassword }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 1.5,
              borderColor: usePassword ? colors.guardianGold : colors.mistBeige,
              backgroundColor: usePassword ? colors.guardianGold : colors.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {usePassword ? <Body style={{ color: colors.paper, fontWeight: '700' }}>✓</Body> : null}
          </View>
          <Body>Require a password to claim</Body>
        </Pressable>
        {usePassword ? (
          <View style={{ marginTop: spacing.md }}>
            <TextField label="Claim password" value={password} onChangeText={setPassword} placeholder="Set a word or phrase" autoCapitalize="none" />
          </View>
        ) : null}
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Button
          label={busy ? 'Saving…' : invite ? 'Update invite' : 'Generate invite'}
          variant="gold"
          disabled={busy || (usePassword && !password.trim())}
          onPress={() => onGenerate(false)}
        />
        {invite ? (
          <>
            <Button label="Regenerate code" variant="secondary" disabled={busy} onPress={() => onGenerate(true)} />
            <Button label="Revoke invite" variant="ghost" disabled={busy} onPress={onRevoke} />
          </>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
