import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { Image } from 'expo-image';

import { Body, Caption } from '@/components/ui/Typography';
import { colors, radii, spacing } from '@/constants/theme';
import { formatBytes, getSignedUrl } from '@/lib/media';
import type { MemoryMediaItem, MemoryType } from '@/types/models';

type SignedUrlState = 'idle' | 'loading' | 'ready' | 'failed';

function useSignedUrl(storagePath?: string): { url: string | null; state: SignedUrlState } {
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<SignedUrlState>('idle');

  useEffect(() => {
    let alive = true;
    if (!storagePath) {
      setUrl(null);
      setState('idle');
      return;
    }
    setState('loading');
    getSignedUrl(storagePath, 60 * 60)
      .then((u) => {
        if (!alive) return;
        if (u) {
          setUrl(u);
          setState('ready');
        } else {
          setUrl(null);
          setState('failed');
        }
      })
      .catch(() => {
        if (alive) {
          setUrl(null);
          setState('failed');
        }
      });
    return () => {
      alive = false;
    };
  }, [storagePath]);

  return { url, state };
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
  disabled,
}: {
  label: string;
  hint: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.mistBeige,
        backgroundColor: colors.white,
        opacity: disabled ? 0.7 : 1,
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
  const { url: signed, state } = useSignedUrl(item.storagePath);

  if (item.kind === 'photo') {
    if (state === 'loading') {
      return (
        <View
          style={{
            width: '100%',
            height: 220,
            borderRadius: radii.md,
            backgroundColor: colors.mistBeige,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Caption style={{ color: colors.deepUmber }}>Loading photo…</Caption>
        </View>
      );
    }
    if (state === 'failed') {
      return (
        <Caption style={{ color: colors.deepUmber }}>
          Photo unavailable right now. The owner may need to finish storage setup.
        </Caption>
      );
    }
    if (signed) {
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
  }

  const label =
    item.name ??
    (item.kind === 'video' ? 'Video' : item.kind === 'audio' ? 'Audio' : item.kind === 'photo' ? 'Photo' : 'File');
  const hint =
    state === 'loading'
      ? 'Loading…'
      : state === 'failed'
        ? 'Unavailable'
        : item.kind === 'video' || item.kind === 'audio'
          ? 'Play ›'
          : item.kind === 'photo'
            ? 'View ›'
            : 'Open ›';

  return (
    <MediaRow
      label={`${label}${item.sizeBytes ? ` · ${formatBytes(item.sizeBytes)}` : ''}`}
      hint={hint}
      onPress={signed ? () => openUrl(signed) : undefined}
      disabled={state === 'loading' || state === 'failed'}
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
