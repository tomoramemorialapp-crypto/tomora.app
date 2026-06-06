import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';

import { colors, radii, spacing } from '@/constants/theme';
import type { Memory, MemoryMediaItem } from '@/types/models';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { VisibilityBadge } from '@/components/ui/Badge';
import { RichTextView } from '@/components/ui/RichText';
import { formatBytes, getSignedUrl } from '@/lib/media';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function useSignedUrl(storagePath?: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!storagePath) {
      setUrl(null);
      return;
    }
    getSignedUrl(storagePath).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [storagePath]);
  return url;
}

/** A non-interactive preview of a stored media item (the whole card handles taps). */
function MediaItemPreview({ item }: { item: MemoryMediaItem }) {
  const signed = useSignedUrl(item.storagePath);

  if (item.kind === 'photo' && signed) {
    return (
      <Image
        source={{ uri: signed }}
        style={{ width: '100%', height: 200, borderRadius: radii.md }}
        contentFit="cover"
        transition={150}
      />
    );
  }

  const label =
    item.kind === 'video' ? 'Video' : item.kind === 'audio' ? 'Audio' : item.kind === 'photo' ? 'Photo' : 'File';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.mistBeige,
        backgroundColor: colors.white,
      }}
    >
      <Body numberOfLines={1} style={{ fontWeight: '600', flex: 1, marginRight: spacing.sm }}>
        {item.name ?? label}
        {item.sizeBytes ? ` · ${formatBytes(item.sizeBytes)}` : ''}
      </Body>
      <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>Tap to view ›</Caption>
    </View>
  );
}

function MediaPreview({ memory }: { memory: Memory }) {
  if (memory.type === 'link' && memory.mediaUrl) {
    return (
      <Caption style={{ color: colors.guardianGold, fontWeight: '700' }} numberOfLines={1}>
        {memory.mediaUrl} ›
      </Caption>
    );
  }

  if (memory.media.length > 0) {
    // Show the first item as a preview; the count hints there are more.
    return (
      <View style={{ gap: spacing.sm }}>
        <MediaItemPreview item={memory.media[0]} />
        {memory.media.length > 1 ? (
          <Caption style={{ color: colors.ashTaupe }}>+{memory.media.length - 1} more</Caption>
        ) : null}
      </View>
    );
  }

  if (memory.storagePath) {
    return (
      <MediaItemPreview
        item={{
          storagePath: memory.storagePath,
          sizeBytes: memory.mediaSizeBytes ?? 0,
          mime: memory.mediaMime,
          kind: memory.type === 'video' || memory.type === 'audio' || memory.type === 'photo' ? memory.type : 'document',
        }}
      />
    );
  }

  return null;
}

export function MemoryCard({
  memory,
  onOpen,
  getNodeName,
}: {
  memory: Memory;
  /** Opens the full memory page. When omitted the card is not interactive. */
  onOpen?: () => void;
  /** Resolve a node id to a display name (for tagged members). */
  getNodeName?: (id: string) => string | undefined;
}) {
  const taggedNames = (memory.taggedNodeIds ?? [])
    .map((id) => getNodeName?.(id))
    .filter((n): n is string => !!n);

  const inner = (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
        <Title style={{ flex: 1 }}>{memory.title || 'A memory'}</Title>
        <VisibilityBadge visibility={memory.visibility} />
      </View>
      <MediaPreview memory={memory} />
      {memory.caption ? <Body>{memory.caption}</Body> : null}
      {memory.body ? <RichTextView value={memory.body} /> : null}
      {taggedNames.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {taggedNames.map((name) => (
            <View
              key={name}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: colors.candlelight,
                borderWidth: 1,
                borderColor: colors.softGold,
              }}
            >
              <Caption style={{ color: colors.deepUmber }}>@{name}</Caption>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Caption>{formatDate(memory.createdAt)}</Caption>
        {onOpen ? <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>Open ›</Caption> : null}
      </View>
    </View>
  );

  if (onOpen) {
    return (
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Open memory: ${memory.title ?? 'memory'}`}>
        <Card>{inner}</Card>
      </Pressable>
    );
  }
  return <Card>{inner}</Card>;
}
