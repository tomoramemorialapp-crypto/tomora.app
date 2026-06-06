import React, { useEffect, useState } from 'react';
import { Linking, Modal, Platform, Pressable, View } from 'react-native';
import { Image } from 'expo-image';

import { colors, radii, spacing } from '@/constants/theme';
import { Body, Caption, Title } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { getSignedUrl } from '@/lib/media';

export interface LightboxItem {
  kind: 'photo' | 'video' | 'audio' | 'document' | 'link';
  storagePath?: string;
  url?: string;
  name?: string;
  mime?: string;
}

/** Resolve a storage path (or pass through an external url) to a usable URL. */
function useResolvedUrl(item: LightboxItem | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!item) {
      setUrl(null);
      return;
    }
    if (item.url) {
      setUrl(item.url);
      return;
    }
    if (item.storagePath) {
      getSignedUrl(item.storagePath).then((u) => {
        if (alive) setUrl(u);
      });
    }
    return () => {
      alive = false;
    };
  }, [item]);
  return url;
}

// On web, react-native-web renders through React DOM, so raw media tags work.
function WebVideo({ src }: { src: string }) {
  return React.createElement('video', {
    src,
    controls: true,
    autoPlay: true,
    style: { width: '100%', maxHeight: '70vh', borderRadius: 16, background: '#000' },
  });
}

function WebAudio({ src }: { src: string }) {
  return React.createElement('audio', { src, controls: true, autoPlay: true, style: { width: '100%' } });
}

export function MediaLightbox({
  items,
  index,
  visible,
  onClose,
  onIndexChange,
}: {
  items: LightboxItem[];
  index: number;
  visible: boolean;
  onClose: () => void;
  onIndexChange?: (next: number) => void;
}) {
  const item = items[index] ?? null;
  const url = useResolvedUrl(item);

  const go = (delta: number) => {
    const next = (index + delta + items.length) % items.length;
    onIndexChange?.(next);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(20,16,12,0.92)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        }}
      >
        {/* Inner card swallows presses so tapping content doesn't close. */}
        <Pressable
          onPress={(e) => e.stopPropagation?.()}
          style={{ width: '100%', maxWidth: 760, gap: spacing.md }}
        >
          {item ? (
            <View style={{ gap: spacing.md }}>
              {item.kind === 'photo' && url ? (
                <Image
                  source={{ uri: url }}
                  style={{ width: '100%', height: 420, borderRadius: radii.lg }}
                  contentFit="contain"
                  transition={150}
                />
              ) : null}

              {item.kind === 'video' && url ? (
                Platform.OS === 'web' ? (
                  <WebVideo src={url} />
                ) : (
                  <FallbackOpen url={url} label="Open video" />
                )
              ) : null}

              {item.kind === 'audio' && url ? (
                Platform.OS === 'web' ? (
                  <View style={{ backgroundColor: colors.paper, borderRadius: radii.lg, padding: spacing.lg }}>
                    <WebAudio src={url} />
                  </View>
                ) : (
                  <FallbackOpen url={url} label="Play audio" />
                )
              ) : null}

              {(item.kind === 'document' || item.kind === 'link') && url ? (
                <View style={{ backgroundColor: colors.paper, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm }}>
                  <Title>{item.name ?? (item.kind === 'link' ? 'External link' : 'File')}</Title>
                  <Caption numberOfLines={2}>{url}</Caption>
                  <DownloadOrOpen url={url} name={item.name} isLink={item.kind === 'link'} />
                </View>
              ) : null}

              {!url ? (
                <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                  <Body style={{ color: colors.paper }}>Loading…</Body>
                </View>
              ) : null}

              {item.name ? (
                <Caption style={{ color: colors.mistBeige, textAlign: 'center' }}>{item.name}</Caption>
              ) : null}
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
            {items.length > 1 ? (
              <>
                <Button label="‹ Prev" variant="secondary" onPress={() => go(-1)} />
                <Caption style={{ color: colors.mistBeige }}>
                  {index + 1} / {items.length}
                </Caption>
                <Button label="Next ›" variant="secondary" onPress={() => go(1)} />
              </>
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>

          <Button label="Close" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FallbackOpen({ url, label }: { url: string; label: string }) {
  return (
    <View style={{ backgroundColor: colors.paper, borderRadius: radii.lg, padding: spacing.lg }}>
      <Button label={label} variant="gold" onPress={() => Linking.openURL(url)} />
    </View>
  );
}

function DownloadOrOpen({ url, name, isLink }: { url: string; name?: string; isLink: boolean }) {
  const onPress = () => {
    if (Platform.OS === 'web' && !isLink) {
      // Trigger a download via a temporary anchor.
      const a = document.createElement('a');
      a.href = url;
      a.download = name ?? '';
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    Linking.openURL(url);
  };
  return <Button label={isLink ? 'Open link' : 'Download'} variant="gold" onPress={onPress} />;
}
