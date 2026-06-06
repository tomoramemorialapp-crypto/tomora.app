import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateValueInput, dateValueToParts } from '@/components/ui/DateValueInput';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Body, Caption } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import type { FamilyNode, MemorialRequest } from '@/types/models';
import type { MemorialVoteSummary } from '@/services/memorialService';
import type { DateValue } from '@/types/profile';

function fmt(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

/** The passing toggle + dispute/consensus controls shown on a Life Profile. */
export function PassingControl({ node, canEdit }: { node: FamilyNode; canEdit: boolean }) {
  const router = useRouter();
  const {
    requestPassing,
    finalizeMemorial,
    disputeMemorial,
    castMemorialVote,
    fetchMemorialRequestForNode,
    fetchMemorialVotes,
  } = useAppState();

  const [request, setRequest] = useState<MemorialRequest | null>(null);
  const [votes, setVotes] = useState<MemorialVoteSummary | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [passingDate, setPassingDate] = useState<DateValue | undefined>(undefined);

  const memorial = node.isLiving === false || node.status === 'memory_light';

  const refreshVotes = async (requestId: string) => {
    try {
      setVotes(await fetchMemorialVotes(requestId));
    } catch {
      setVotes(null);
    }
  };

  useEffect(() => {
    let alive = true;
    fetchMemorialRequestForNode(node.id)
      .then(async (r) => {
        if (!alive) return;
        setRequest(r);
        if (r && (r.status === 'pending' || r.status === 'disputed')) {
          await refreshVotes(r.id);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [node.id, node.status, fetchMemorialRequestForNode, fetchMemorialVotes]);

  const deathDate = (): string | undefined => {
    const { day, month, year } = dateValueToParts(passingDate);
    if (!year) return undefined;
    const m = Math.min(Math.max(month || 1, 1), 12);
    const d = Math.min(Math.max(day || 1, 1), 31);
    return `${year.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  };

  const onReport = async () => {
    setBusy(true);
    setNote(null);
    try {
      const result = await requestPassing({ nodeId: node.id, deathDate: deathDate() });
      setOpen(false);
      if (result.mode === 'finalized') {
        setNote('A Memory Light has been lit. The family has been notified.');
      } else {
        setNote("Passing reported. The family has a review window before it's confirmed.");
        const r = await fetchMemorialRequestForNode(node.id);
        setRequest(r);
        if (r) await refreshVotes(r.id);
      }
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not report this right now.');
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    if (!request) return;
    setBusy(true);
    try {
      await finalizeMemorial(request.id);
      setNote('Confirmed by family consensus. A Memory Light is now lit.');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not confirm right now.');
    } finally {
      setBusy(false);
    }
  };

  const onDispute = async () => {
    if (!request) return;
    setBusy(true);
    try {
      await disputeMemorial(request.id);
      setNote('Disputed. The family can resolve this together.');
      await refreshVotes(request.id);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not dispute right now.');
    } finally {
      setBusy(false);
    }
  };

  const onVote = async (vote: 'confirm' | 'dispute') => {
    if (!request) return;
    setBusy(true);
    try {
      await castMemorialVote(request.id, vote);
      await refreshVotes(request.id);
      setNote(vote === 'confirm' ? 'Your vote to confirm has been recorded.' : 'Your dispute has been recorded.');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not record your vote.');
    } finally {
      setBusy(false);
    }
  };

  if (memorial) {
    return (
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Memory Light" />
        <Body style={{ marginBottom: spacing.sm }}>
          {node.displayName} is remembered. Visit the memorial page to share tributes and memories.
        </Body>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label="View memorial"
              variant="gold"
              onPress={() => router.push({ pathname: '/memorial/[nodeId]', params: { nodeId: node.id } })}
            />
          </View>
          {canEdit ? (
            <View style={{ flex: 1 }}>
              <Button
                label="Edit memorial"
                variant="secondary"
                onPress={() => router.push({ pathname: '/memorial/edit', params: { nodeId: node.id } })}
              />
            </View>
          ) : null}
        </View>
        {note ? <Caption style={{ marginTop: spacing.sm, color: colors.guardianGold }}>{note}</Caption> : null}
      </Card>
    );
  }

  const pending = request?.status === 'pending';
  const disputed = request?.status === 'disputed';

  return (
    <Card style={{ marginBottom: spacing.lg }}>
      <SectionHeader title="Passing" />

      {pending ? (
        <View style={{ gap: spacing.sm }}>
          <Body>
            A passing has been reported. It will be confirmed after the review window
            {request?.resolveAfter ? ` (by ${fmt(request.resolveAfter)})` : ''}, unless disputed. A family consensus
            can confirm it sooner.
          </Body>
          {votes ? (
            <Caption style={{ color: colors.deepUmber }}>
              Family votes — {votes.confirm} confirm · {votes.dispute} dispute
              {votes.myVote ? ` · You voted to ${votes.myVote}` : ''}
            </Caption>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button label={busy ? '…' : 'Confirm now'} variant="gold" disabled={busy} onPress={onConfirm} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Dispute" variant="ghost" disabled={busy} onPress={onDispute} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button
                label={votes?.myVote === 'confirm' ? 'Voted confirm' : 'Vote confirm'}
                variant="secondary"
                disabled={busy || votes?.myVote === 'confirm'}
                onPress={() => onVote('confirm')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={votes?.myVote === 'dispute' ? 'Voted dispute' : 'Vote dispute'}
                variant="secondary"
                disabled={busy || votes?.myVote === 'dispute'}
                onPress={() => onVote('dispute')}
              />
            </View>
          </View>
        </View>
      ) : disputed ? (
        <View style={{ gap: spacing.sm }}>
          <Body>This passing report is disputed. The family can confirm it together once resolved.</Body>
          {votes ? (
            <Caption style={{ color: colors.deepUmber }}>
              Family votes — {votes.confirm} confirm · {votes.dispute} dispute
            </Caption>
          ) : null}
          <Button label={busy ? '…' : 'Confirm by consensus'} variant="gold" disabled={busy} onPress={onConfirm} />
        </View>
      ) : open ? (
        <View style={{ gap: spacing.sm }}>
          <Body>
            Mark {node.displayName}'s passing. If you steward this node and no admin oversees the tree, it lights a
            Memory Light immediately. Otherwise the family gets a review window.
          </Body>
          <DateValueInput label="Date of passing (optional)" value={passingDate} onChange={setPassingDate} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button label={busy ? 'Reporting…' : 'Confirm passing'} variant="gold" disabled={busy} onPress={onReport} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Cancel" variant="ghost" disabled={busy} onPress={() => setOpen(false)} />
            </View>
          </View>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Body style={{ color: colors.ashTaupe }}>
            {node.displayName} is marked as living. You can report a passing to begin a Memory Light.
          </Body>
          <View
            style={{
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.mistBeige,
              padding: spacing.sm,
            }}
          >
            <Button label="Report a passing" variant="secondary" onPress={() => setOpen(true)} />
          </View>
        </View>
      )}

      {note ? <Caption style={{ marginTop: spacing.sm, color: colors.guardianGold }}>{note}</Caption> : null}
    </Card>
  );
}
