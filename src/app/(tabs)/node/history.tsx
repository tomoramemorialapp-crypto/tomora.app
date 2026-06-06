import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';
import { goBack } from '@/lib/navigation';
import { useAppState } from '@/state/AppState';
import type { ChangeLogAction, ProfileChangeLog, ProfileFieldKey, SuggestedEdit } from '@/types/profile';
import { PROFILE_FIELD_LABELS } from '@/types/profile';
import { editScopeFor, formatPersonName } from '@/lib/profile';
import type { PersonName } from '@/types/profile';

const ACTION_LABELS: Record<ChangeLogAction, string> = {
  field_updated: 'Updated',
  suggested_edit_submitted: 'Suggested change',
  suggested_edit_approved: 'Suggestion approved',
  suggested_edit_rejected: 'Suggestion declined',
  duplicate_detected: 'Possible match found',
  profiles_linked: 'Profiles linked',
  field_mismatch_created: 'Mismatch found',
  mismatch_resolved: 'Mismatch resolved',
  field_marked_disputed: 'Marked disputed',
  owner_override_applied: 'Owner value applied',
  field_visibility_changed: 'Visibility changed',
  tags_updated: 'Tags updated',
};

function fieldLabel(key?: string): string {
  if (!key) return '';
  return PROFILE_FIELD_LABELS[key as ProfileFieldKey] ?? key;
}

function valuePreview(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.firstName === 'string') return formatPersonName(o as unknown as PersonName);
    if (typeof o.value === 'string') return o.value;
    if (typeof o.displayText === 'string') return o.displayText;
    if (typeof o.displayName === 'string') return o.displayName;
    if (typeof o.notes === 'string') return o.notes;
    return Object.values(o).filter(Boolean).join(' · ') || '—';
  }
  return String(v);
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ChangeHistory() {
  const router = useRouter();
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const { getNode, account, fetchChangeLog, getSuggestedEditsForNode, reviewSuggestedEdit } = useAppState();

  const node = getNode(String(nodeId));
  const scope = node ? editScopeFor(node, account?.id) : 'suggest';
  const canReview = scope === 'owner' || scope === 'guardian';

  const [log, setLog] = useState<ProfileChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = node ? getSuggestedEditsForNode(node.id).filter((s) => s.status === 'pending') : [];

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const entries = await fetchChangeLog(String(nodeId));
        if (active) setLog(entries);
      } catch (e) {
        console.warn('[tomora] change log load failed', e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchChangeLog, nodeId]);

  if (!node) {
    return (
      <ScreenContainer center>
        <EmptyState title="Nothing to show." body="This profile isn’t in your Family Tree." />
        <Button label="Back" variant="secondary" onPress={() => goBack(router)} />
      </ScreenContainer>
    );
  }

  async function review(edit: SuggestedEdit, status: 'approved' | 'rejected') {
    try {
      await reviewSuggestedEdit({ editId: edit.id, status });
    } catch (e) {
      console.warn('[tomora] review failed', e);
    }
  }

  return (
    <ScreenContainer maxWidth={620} showBack>
      <Display style={{ fontSize: 28, marginBottom: spacing.xs }}>Change History</Display>
      <Caption style={{ marginBottom: spacing.lg }}>{node.displayName}</Caption>

      {canReview && pending.length > 0 ? (
        <Card style={{ marginBottom: spacing.lg }}>
          <SectionHeader title="Suggested Changes" overline="Needs your review" />
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            {pending.map((s) => (
              <View
                key={s.id}
                style={{ gap: 6, borderBottomWidth: 1, borderBottomColor: colors.hairline, paddingBottom: spacing.md }}
              >
                <Caption style={{ color: colors.ashTaupe }}>{fieldLabel(s.targetProfileFieldKey)}</Caption>
                <Body>{valuePreview(s.suggestedValue)}</Body>
                {s.reason ? <Caption>“{s.reason}”</Caption> : null}
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Button label="Decline" variant="secondary" onPress={() => review(s, 'rejected')} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button label="Approve" variant="gold" onPress={() => review(s, 'approved')} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <SectionHeader title="History" />
      {loading ? (
        <Caption style={{ marginTop: spacing.md }}>Loading…</Caption>
      ) : log.length === 0 ? (
        <EmptyState title="No changes yet." body="Edits, suggestions, and reviews will appear here." />
      ) : (
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          {log.map((e) => (
            <Card key={e.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge label={ACTION_LABELS[e.action] ?? e.action} tone="soft" />
                <Caption style={{ color: colors.ashTaupe }}>{timeAgo(e.createdAt)}</Caption>
              </View>
              {e.fieldKey ? <Caption style={{ marginTop: 6 }}>{fieldLabel(String(e.fieldKey))}</Caption> : null}
              {e.newValue !== undefined ? (
                <Body style={{ marginTop: 2 }}>{valuePreview(e.newValue)}</Body>
              ) : null}
              {e.note ? <Caption style={{ marginTop: 4 }}>“{e.note}”</Caption> : null}
            </Card>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
