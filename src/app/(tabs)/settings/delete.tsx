import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { TextField } from '@/components/ui/TextField';
import { Badge } from '@/components/ui/Badge';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { goBack } from '@/lib/navigation';
import { useAppState } from '@/state/AppState';

function daysUntil(iso?: string): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <Body style={{ color: colors.guardianGold }}>•</Body>
      <Body style={{ flex: 1, color: colors.deepUmber }}>{children}</Body>
    </View>
  );
}

export default function DeleteAccount() {
  const router = useRouter();
  const { account, requestAccountDeletion, undoAccountDeletion } = useAppState();

  const isVacated = account?.status === 'vacated';
  const grace = daysUntil(account?.deletionScheduledFor);

  const [step, setStep] = useState(0);
  const [ack1, setAck1] = useState(false);
  const [ack2, setAck2] = useState(false);
  const [ack3, setAck3] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);

  // ---- Already vacated: management + undo view ----
  if (isVacated) {
    return (
      <ScreenContainer maxWidth={560} showBack>
        <View style={{ gap: spacing.lg }}>
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <Badge label="Vacated" tone="neutral" />
            <Display style={{ fontSize: 28, textAlign: 'center' }}>Your account is closing</Display>
            <Title style={{ color: colors.guardianGold }}>
              {grace} {grace === 1 ? 'day' : 'days'} left
            </Title>
          </View>

          <Card>
            <Title>You can still undo this</Title>
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <Bullet>Restore everything exactly as it was — memories, photos, and profile.</Bullet>
              <Bullet>The “Vacated” mark on your Life Profile will be removed.</Bullet>
              <Bullet>Your family won’t lose your name or your place in the tree.</Bullet>
            </View>
          </Card>

          <Card style={{ backgroundColor: colors.candlelight, borderColor: colors.softGold }}>
            <Title>If you do nothing</Title>
            <Body style={{ marginTop: spacing.sm, color: colors.deepUmber }}>
              After the {grace}-day period ends, your account and everything you’ve uploaded are permanently removed and
              cannot be recovered or appealed. Your node stays as an idle light — your name and relationships remain for
              your family, but everything you uploaded is gone.
            </Body>
          </Card>

          <Button
            label={busy ? 'Restoring…' : 'Undo deletion & restore my account'}
            variant="gold"
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              try {
                await undoAccountDeletion();
                goBack(router);
              } finally {
                setBusy(false);
              }
            }}
          />
          <Button label="Keep account closing" variant="ghost" onPress={() => goBack(router)} />
        </View>
      </ScreenContainer>
    );
  }

  // ---- Step 0: what happens ----
  if (step === 0) {
    return (
      <ScreenContainer
        maxWidth={560}
        showBack
        footer={
          <View style={{ gap: spacing.sm }}>
            <Button label="Continue" variant="secondary" onPress={() => setStep(1)} />
            <Button label="Never mind — keep my account" variant="ghost" onPress={() => goBack(router)} />
          </View>
        }
      >
        <Display style={{ fontSize: 28, marginBottom: spacing.md }}>Delete account</Display>
        <Body style={{ color: colors.deepUmber, marginBottom: spacing.lg }}>
          We’d be sad to see you go. Please read carefully — this is a serious, mostly irreversible step.
        </Body>

        <Card style={{ marginBottom: spacing.lg }}>
          <Title>Here’s what happens</Title>
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            <Bullet>
              Your account is marked for deletion and enters a <Body style={{ fontWeight: '700' }}>30-day</Body> grace
              period.
            </Bullet>
            <Bullet>Your Life Profile node is marked “Vacated” so your family sees the light is paused.</Bullet>
            <Bullet>You can undo any time within those 30 days — everything comes back exactly as it was.</Bullet>
            <Bullet>
              After 30 days, your account and <Body style={{ fontWeight: '700' }}>everything you’ve uploaded</Body>{' '}
              (memories, photos, files) are permanently deleted from our systems — this cannot be appealed.
            </Bullet>
            <Bullet>
              Your node becomes an idle light for relatives who have you: your name and relationships remain, but nothing
              you uploaded does.
            </Bullet>
          </View>
        </Card>
      </ScreenContainer>
    );
  }

  // ---- Step 1: acknowledgements ----
  if (step === 1) {
    const allAck = ack1 && ack2 && ack3;
    return (
      <ScreenContainer
        maxWidth={560}
        showBack
        onBack={() => setStep(0)}
        footer={
          <View style={{ gap: spacing.sm }}>
            <Button label="I understand, continue" variant="secondary" disabled={!allAck} onPress={() => setStep(2)} />
            <Button label="Cancel" variant="ghost" onPress={() => goBack(router)} />
          </View>
        }
      >
        <Display style={{ fontSize: 26, marginBottom: spacing.md }}>Please confirm you understand</Display>
        <Card>
          <Checkbox
            checked={ack1}
            onChange={setAck1}
            label="My data will be scheduled for deletion in 30 days"
            description="All of my data will be marked for deletion from the app’s systems and database."
          />
          <Checkbox
            checked={ack2}
            onChange={setAck2}
            label="Everything I uploaded will be permanently deleted"
            description="Memories, photos, videos, audio, and files I added cannot be recovered after 30 days."
          />
          <Checkbox
            checked={ack3}
            onChange={setAck3}
            label="After 30 days this cannot be undone or appealed"
            description="I can undo within 30 days, but once the period ends the removal is permanent and final."
          />
        </Card>
      </ScreenContainer>
    );
  }

  // ---- Step 2: final confirmation (type to confirm) ----
  const canDelete = confirmText.trim().toUpperCase() === 'DELETE' && !busy;
  return (
    <ScreenContainer
      maxWidth={560}
      showBack
      onBack={() => setStep(1)}
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button
            label={busy ? 'Starting deletion…' : 'Permanently delete my account'}
            variant="gold"
            disabled={!canDelete}
            onPress={async () => {
              setBusy(true);
              try {
                await requestAccountDeletion();
                setStep(3);
              } catch {
                setBusy(false);
              }
            }}
          />
          <Button label="Keep my account" variant="ghost" onPress={() => goBack(router)} />
        </View>
      }
    >
      <Display style={{ fontSize: 26, marginBottom: spacing.sm }}>Are you absolutely sure?</Display>
      <Body style={{ color: colors.deepUmber, marginBottom: spacing.lg }}>
        This begins the 30-day deletion of {account?.displayName ?? 'your account'}. To confirm, type{' '}
        <Body style={{ fontWeight: '700' }}>DELETE</Body> below.
      </Body>
      <View
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          backgroundColor: colors.candlelight,
          borderWidth: 1,
          borderColor: colors.error,
          marginBottom: spacing.lg,
        }}
      >
        <Caption style={{ color: colors.error, fontWeight: '700' }}>
          This is your last easy exit. You’ll have 30 days to change your mind, then it’s permanent.
        </Caption>
      </View>
      <TextField label="Type DELETE to confirm" value={confirmText} onChangeText={setConfirmText} placeholder="DELETE" autoCapitalize="characters" />
    </ScreenContainer>
  );

  // (step === 3 is unreachable as a render path because requestAccountDeletion
  // flips status to 'vacated', re-rendering into the management view above.)
}
