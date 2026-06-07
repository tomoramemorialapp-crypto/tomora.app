import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { Image } from 'expo-image';

import { Body, Caption } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { formatBytes, getSignedUrl } from '@/lib/media';
import type { MemoryMediaItem, MemoryType } from '@/types/models';

function useSignedUrl(storagePath?: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!storagePath) {
      setUrl(null);
      return;
    }
    getSignedUrl(storagePath, 60 * 60).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [storagePath]);
  return url;
}

async function openUrl(url: string) {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(url);
  } catch {
    // ignore
  }
}

function MediaRow({
  label,
  hint,
  onPress,
}: {
  label: string;
  hint: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
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
        {label}
      </Body>
      <Caption style={{ color: colors.guardianGold, fontWeight: '700' }}>{hint}</Caption>
    </Pressable>
  );
}

function MediaItemPreview({ item }: { item: MemoryMediaItem }) {
  const signed = useSignedUrl(item.storagePath);

  if (item.kind === 'photo' && signed) {
    return (
      <Pressable onPress={() => openUrl(signed)}>
        <Image
          source={{ uri: signed }}
          style={{ width: '100%', height: 220, borderRadius: radii.md }}
          contentFit="cover"
          transition={150}
        />
      </Pressable>
    );
  }

  const label = item.name ?? (item.kind === 'video' ? 'Video' : item.kind === 'audio' ? 'Audio' : item.kind === 'photo' ? 'Photo' : 'File');
  const hint =
    item.kind === 'video' || item.kind === 'audio' ? 'Play ›' : item.kind === 'photo' ? 'View ›' : 'Open ›';

  return (
    <MediaRow
      label={`${label}${item.sizeBytes ? ` · ${formatBytes(item.sizeBytes)}` : ''}`}
      hint={hint}
      onPress={signed ? () => openUrl(signed) : undefined}
    />
  );
}

export function PublicMemoryMedia({
  type,
  mediaUrl,
  media = [],
  storagePath,
}: {
  type: MemoryType | string;
  mediaUrl?: string;
  media?: MemoryMediaItem[];
  storagePath?: string;
}) {
  if (type === 'link' && mediaUrl) {
    return (
      <Pressable onPress={() => openUrl(mediaUrl)}>
        <Caption numberOfLines={2} style={{ color: colors.guardianGold, fontWeight: '700' }}>
          {mediaUrl} ›
        </Caption>
      </Pressable>
    );
  }

  if (media.length > 0) {
    return (
      <View style={{ gap: spacing.sm }}>
        <MediaItemPreview item={media[0]} />
        {media.length > 1 ? (
          <Caption style={{ color: colors.ashTaupe }}>+{media.length - 1} more</Caption>
        ) : null}
      </View>
    );
  }

  if (storagePath) {
    const kind =
      type === 'video' || type === 'audio' || type === 'photo' ? type : ('document' as const);
    return (
      <MediaItemPreview
        item={{
          storagePath,
          sizeBytes: 0,
          kind,
        }}
      />
    );
  }

  if (mediaUrl && (type === 'photo' || type === 'video')) {
    return (
      <Pressable onPress={() => openUrl(mediaUrl)}>
        {type === 'photo' ? (
          <Image
            source={{ uri: mediaUrl }}
            style={{ width: '100%', height: 220, borderRadius: radii.md }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <MediaRow label="Video" hint="Play ›" onPress={() => openUrl(mediaUrl)} />
        )}
      </Pressable>
    );
  }

  return null;
}
