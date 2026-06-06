import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
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

/** Resolve a private storage object to a temporary signed URL. */
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

/** Render a single stored media item (photo inline, others as an openable row). */
function MediaItemView({ item }: { item: MemoryMediaItem }) {
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

  const label = item.kind === 'video' ? 'Video' : item.kind === 'audio' ? 'Audio' : item.kind === 'photo' ? 'Photo' : 'File';
  return (
    <Pressable
      onPress={() => signed && Linking.openURL(signed)}
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
      <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>{signed ? 'Open ›' : 'Loading…'}</Caption>
    </Pressable>
  );
}

function MediaPreview({ memory }: { memory: Memory }) {
  if (memory.type === 'link' && memory.mediaUrl) {
    return (
      <Pressable onPress={() => Linking.openURL(memory.mediaUrl!)}>
        <Caption style={{ color: colors.guardianGold, fontWeight: '700' }} numberOfLines={1}>
          {memory.mediaUrl} ›
        </Caption>
      </Pressable>
    );
  }

  if (memory.media.length > 0) {
    return (
      <View style={{ gap: spacing.sm }}>
        {memory.media.map((m, i) => (
          <MediaItemView key={`${m.storagePath}-${i}`} item={m} />
        ))}
      </View>
    );
  }

  if (memory.storagePath) {
    return (
      <MediaItemView
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
  editable = false,
  onEdit,
}: {
  memory: Memory;
  editable?: boolean;
  onEdit?: () => void;
}) {
  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
          <Title style={{ flex: 1 }}>{memory.title || 'A memory'}</Title>
          <VisibilityBadge visibility={memory.visibility} />
        </View>
        <MediaPreview memory={memory} />
        {memory.caption ? <Body>{memory.caption}</Body> : null}
        {memory.body ? <RichTextView value={memory.body} /> : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Caption>{formatDate(memory.createdAt)}</Caption>
          {editable && onEdit ? (
            <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel="Edit memory" hitSlop={8}>
              <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>Edit ›</Caption>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
