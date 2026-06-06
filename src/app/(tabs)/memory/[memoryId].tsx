import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { VisibilityBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { RichTextView } from '@/components/ui/RichText';
import { Body, Caption, Display, Title } from '@/components/ui/Typography';
import { MediaLightbox, type LightboxItem } from '@/components/memories/MediaLightbox';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/state/AppState';
import { goBack } from '@/lib/navigation';
import { formatBytes, getSignedUrl } from '@/lib/media';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

function Thumb({ item, onPress }: { item: LightboxItem; onPress: () => void }) {
  const [url, setUrl] = useState<string | null>(item.url ?? null);
  useEffect(() => {
    let alive = true;
    if (!item.url && item.storagePath) {
      getSignedUrl(item.storagePath).then((u) => alive && setUrl(u));
    }
    return () => {
      alive = false;
    };
  }, [item.storagePath, item.url]);

  return (
    <Pressable onPress={onPress} style={{ width: '100%' }}>
      {item.kind === 'photo' && url ? (
        <Image source={{ uri: url }} style={{ width: '100%', height: 240, borderRadius: radii.md }} contentFit="cover" />
      ) : (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.md,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.mistBeige,
            backgroundColor: colors.white,
          }}
        >
          <Body style={{ fontWeight: '600', flex: 1, marginRight: spacing.sm }} numberOfLines={1}>
            {item.name ?? labelFor(item.kind)}
          </Body>
          <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>
            {item.kind === 'video' ? 'Play ›' : item.kind === 'audio' ? 'Play ›' : item.kind === 'link' ? 'Open ›' : 'View ›'}
          </Caption>
        </View>
      )}
    </Pressable>
  );
}

function labelFor(kind: LightboxItem['kind']): string {
  return kind === 'video' ? 'Video' : kind === 'audio' ? 'Audio' : kind === 'link' ? 'Link' : 'File';
}

export default function MemoryDetail() {
  const router = useRouter();
  const { memoryId } = useLocalSearchParams<{ memoryId: string }>();
  const { getMemory, getNode, account, deleteMemory } = useAppState();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const memory = getMemory(String(memoryId));
  if (!memory) {
    return (
      <ScreenContainer center>
        <EmptyState title="This memory isn’t here." body="It may have been removed." />
        <Button label="Back" variant="secondary" onPress={() => goBack(router)} />
      </ScreenContainer>
    );
  }

  const recipient = memory.nodeId ? getNode(memory.nodeId) : undefined;
  const isOwner = memory.createdByAccountId === account?.id;

  const items: LightboxItem[] = [];
  if (memory.type === 'link' && memory.mediaUrl) {
    items.push({ kind: 'link', url: memory.mediaUrl, name: memory.mediaUrl });
  }
  for (const m of memory.media ?? []) {
    items.push({ kind: m.kind, storagePath: m.storagePath, name: m.name, mime: m.mime });
  }
  if (memory.media.length === 0 && memory.storagePath) {
    const k = memory.type === 'video' || memory.type === 'audio' || memory.type === 'photo' ? memory.type : 'document';
    items.push({ kind: k, storagePath: memory.storagePath });
  }

  const tagged = (memory.taggedNodeIds ?? []).map((id) => getNode(id)).filter(Boolean);

  const onDelete = async () => {
    if (Platform_confirm('Delete this memory? Uploaded media will be removed too.')) {
      setBusy(true);
      try {
        await deleteMemory(memory.id);
        goBack(router);
      } catch {
        setBusy(false);
      }
    }
  };

  return (
    <ScreenContainer maxWidth={680}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
          <Display style={{ flex: 1 }}>{memory.title || 'A memory'}</Display>
          <VisibilityBadge visibility={memory.visibility} />
        </View>

        {recipient ? (
          <Pressable
            onPress={() => router.push({ pathname: '/node/[nodeId]', params: { nodeId: recipient.id } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
          >
            <Avatar
              name={recipient.displayName}
              uri={recipient.profile?.profilePhoto?.value ?? recipient.avatarUrl}
              memorial={recipient.isLiving === false}
              size={36}
            />
            <View>
              <Caption>For</Caption>
              <Body style={{ fontWeight: '700', color: colors.guardianGold }}>{recipient.displayName} ›</Body>
            </View>
          </Pressable>
        ) : null}

        <Caption>{formatDate(memory.createdAt)}</Caption>

        {items.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            {items.map((it, i) => (
              <Thumb key={`${it.storagePath ?? it.url}-${i}`} item={it} onPress={() => setLightboxIndex(i)} />
            ))}
          </View>
        ) : null}

        {memory.caption ? <Body>{memory.caption}</Body> : null}
        {memory.body ? (
          <Card>
            <RichTextView value={memory.body} />
          </Card>
        ) : null}

        {tagged.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <SectionHeader title="Tagged" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {tagged.map((n) => (
                <Pressable
                  key={n!.id}
                  onPress={() => router.push({ pathname: '/node/[nodeId]', params: { nodeId: n!.id } })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 4,
                    paddingHorizontal: spacing.sm,
                    borderRadius: 999,
                    backgroundColor: colors.candlelight,
                    borderWidth: 1,
                    borderColor: colors.softGold,
                  }}
                >
                  <Avatar
                    name={n!.displayName}
                    uri={n!.profile?.profilePhoto?.value ?? n!.avatarUrl}
                    memorial={n!.isLiving === false}
                    size={22}
                  />
                  <Body style={{ color: colors.deepUmber, fontWeight: '600' }}>{n!.displayName}</Body>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {isOwner ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Button
                label="Edit memory"
                variant="secondary"
                onPress={() => router.push({ pathname: '/memory/new', params: { memoryId: memory.id } })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button label={busy ? 'Removing…' : 'Delete'} variant="ghost" disabled={busy} onPress={onDelete} />
            </View>
          </View>
        ) : null}
      </View>

      <MediaLightbox
        items={items}
        index={lightboxIndex ?? 0}
        visible={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(n) => setLightboxIndex(n)}
      />
    </ScreenContainer>
  );
}

/** Lightweight confirm that works on web; falls back to true elsewhere. */
function Platform_confirm(message: string): boolean {
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    return window.confirm(message);
  }
  return true;
}
