import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path, Polygon, Rect } from 'react-native-svg';

import { colors, radii } from '@/constants/theme';
import type { Memory } from '@/types/models';
import { getSignedUrl } from '@/lib/media';

type ThumbKind = 'photo' | 'video' | 'audio' | 'document' | 'link' | 'story';

/** Decide what kind of thumbnail a memory should present, and the photo path. */
function describe(memory: Memory): { kind: ThumbKind; photoPath?: string } {
  const first = memory.media?.[0];
  if (first) {
    if (first.kind === 'photo') return { kind: 'photo', photoPath: first.storagePath };
    return { kind: first.kind === 'document' ? 'document' : first.kind };
  }
  if (memory.storagePath) {
    if (memory.type === 'photo') return { kind: 'photo', photoPath: memory.storagePath };
    if (memory.type === 'video' || memory.type === 'audio') return { kind: memory.type };
    return { kind: 'document' };
  }
  if (memory.type === 'link') return { kind: 'link' };
  if (memory.type === 'photo') return { kind: 'photo' };
  if (memory.type === 'video' || memory.type === 'audio') return { kind: memory.type };
  if (memory.type === 'document') return { kind: 'document' };
  return { kind: 'story' };
}

function useSigned(path?: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(null);
      return;
    }
    getSignedUrl(path).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [path]);
  return url;
}

function Glyph({ kind, color, size }: { kind: ThumbKind; color: string; size: number }) {
  const s = size * 0.5;
  const sw = 1.7;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      {kind === 'video' ? (
        <>
          <Rect x={3} y={5.5} width={18} height={13} rx={2.5} stroke={color} strokeWidth={sw} />
          <Polygon points="10,9.5 15.5,12 10,14.5" fill={color} />
        </>
      ) : kind === 'audio' ? (
        <Path
          d="M5 14v-4M9 16.5v-9M13 18V6M17 15v-6M21 13v-2"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      ) : kind === 'link' ? (
        <>
          <Path d="M9.5 14.5 14.5 9.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M11 7.5l1.2-1.2a3.5 3.5 0 0 1 5 5L16 12.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M13 16.5l-1.2 1.2a3.5 3.5 0 0 1-5-5L8 11.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </>
      ) : kind === 'document' ? (
        <>
          <Path d="M7 4.5h6l4 4V19a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 7 19V5a.5.5 0 0 1 .5-.5Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M13 4.5V8.5h4" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
        </>
      ) : (
        // story (quote)
        <Path
          d="M9 8c-2 0-3.2 1.4-3.2 3.3 0 1.7 1.1 2.9 2.7 2.9.3 1.2-.4 2.2-1.6 2.8M16 8c-2 0-3.2 1.4-3.2 3.3 0 1.7 1.1 2.9 2.7 2.9.3 1.2-.4 2.2-1.6 2.8"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

/**
 * Square memory thumbnail for feeds and lists: a real image for photo memories,
 * a brand-tinted icon tile for video/audio/file/link/story memories.
 */
export function MemoryThumb({ memory, size = 56 }: { memory: Memory; size?: number }) {
  const { kind, photoPath } = describe(memory);
  const signed = useSigned(kind === 'photo' ? photoPath : undefined);

  if (kind === 'photo' && signed) {
    return (
      <Image
        source={{ uri: signed }}
        style={{ width: size, height: size, borderRadius: radii.md, backgroundColor: colors.mistBeige }}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.candlelight,
        borderWidth: 1,
        borderColor: colors.softGold,
      }}
    >
      <Glyph kind={kind === 'photo' ? 'document' : kind} color={colors.guardianGold} size={size} />
    </View>
  );
}
