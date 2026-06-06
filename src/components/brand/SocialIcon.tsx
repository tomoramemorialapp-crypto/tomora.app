import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, radii } from '@/constants/theme';

/**
 * Tomora-styled social network icons. Deliberately monochrome (brand gold/ink),
 * single-weight glyphs on a soft circular tile so a profile's links read as one
 * elegant set rather than a noisy rainbow of brand colors.
 */

export type SocialNetwork =
  | 'website'
  | 'instagram'
  | 'facebook'
  | 'messenger'
  | 'x'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'spotify'
  | 'whatsapp'
  | 'telegram'
  | 'viber'
  | 'sms'
  | 'github'
  | 'threads'
  | 'email';

export const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  website: 'Website',
  instagram: 'Instagram',
  facebook: 'Facebook',
  messenger: 'Messenger',
  x: 'X',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  spotify: 'Spotify',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  viber: 'Viber',
  sms: 'Messages',
  github: 'GitHub',
  threads: 'Threads',
  email: 'Email',
};

function Glyph({ network, color, sw }: { network: SocialNetwork; color: string; sw: number }) {
  switch (network) {
    case 'instagram':
      return (
        <>
          <Rect x={4} y={4} width={16} height={16} rx={5} stroke={color} strokeWidth={sw} />
          <Circle cx={12} cy={12} r={3.6} stroke={color} strokeWidth={sw} />
          <Circle cx={16.4} cy={7.6} r={1} fill={color} />
        </>
      );
    case 'facebook':
      return (
        <Path
          d="M13.5 21v-7h2.2l.4-2.7h-2.6V9.4c0-.8.3-1.3 1.4-1.3h1.3V5.7c-.6-.1-1.4-.2-2.3-.2-2.3 0-3.7 1.4-3.7 3.9v1.9H8v2.7h2.2V21"
          stroke={color}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
    case 'messenger':
      return (
        <Path
          d="M12 4C7.6 4 4 7.1 4 11c0 2.2 1.1 4.1 2.9 5.4L6 20l3.4-1.8c.8.2 1.6.3 2.6.3 4.4 0 8-3.1 8-7s-3.6-7-8-7Z"
          stroke={color}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
    case 'x':
      return (
        <Path d="M5 5l14 14M19 5 5 19" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      );
    case 'linkedin':
      return (
        <>
          <Rect x={4.5} y={4.5} width={15} height={15} rx={2.5} stroke={color} strokeWidth={sw} />
          <Path d="M8 10.5V16M8 7.6v.01M11.5 16v-3.2a1.8 1.8 0 0 1 3.6 0V16" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'youtube':
      return (
        <>
          <Rect x={3.5} y={6.5} width={17} height={11} rx={3} stroke={color} strokeWidth={sw} />
          <Path d="M10.5 9.8 14.5 12l-4 2.2Z" fill={color} />
        </>
      );
    case 'tiktok':
      return (
        <Path
          d="M13.5 4v9.8a3 3 0 1 1-3-3M13.5 4c.4 2.2 1.8 3.6 4 3.9"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'spotify':
      return (
        <>
          <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={sw} />
          <Path d="M8 10.2c2.6-.7 5.4-.4 7.7.9M8.6 13c2.1-.5 4.3-.2 6.1.8M9.2 15.4c1.6-.3 3.2-.1 4.6.6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </>
      );
    case 'whatsapp':
      return (
        <Path
          d="M5 19l1-3a7 7 0 1 1 2.6 2.5L5 19Zm4.5-9c0 3 2.5 5 5 5"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'telegram':
      return (
        <Path d="M20 5 3.8 11.4c-.6.2-.6 1 .1 1.2l4 1.2 1.6 4.4c.2.5.8.6 1.1.2l2.2-2.3 3.9 2.9c.4.3 1 .1 1.1-.4L20 5Zm0 0-9.5 8.9" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      );
    case 'viber':
      return (
        <>
          <Path
            d="M9.5 5.5h5c3.3 0 5.5 2.2 5.5 5.5v4.8c0 .8-.7 1.5-1.5 1.5h-1.2l-1.4 2.4-2-2.4H9.5c-3.3 0-5.5-2.2-5.5-5.5V11c0-3.3 2.2-5.5 5.5-5.5Z"
            stroke={color}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <Path d="M10 10.5h4M10 13.5h2.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </>
      );
    case 'sms':
      return (
        <>
          <Path
            d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
            stroke={color}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <Path d="M8 10h8M8 13h5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </>
      );
    case 'github':
      return (
        <Path
          d="M9.5 19.5c-3 .9-3-1.5-4.2-1.8m8.4 3.3v-2.6c0-.7.1-1 .5-1.4-2.6-.3-4.7-1.3-4.7-5.3 0-1.2.4-2.1 1-2.8-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1a9.5 9.5 0 0 1 5 0c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.6.7 1 1.6 1 2.8 0 4-2.1 4.9-4.7 5.2.4.4.6.9.6 1.9v2.9"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'threads':
      return (
        <Path
          d="M16 8c-1.2-1.3-2.6-1.6-4-1.6-3 0-5 2.4-5 5.6s2 5.6 5 5.6c2.4 0 4-1.4 4-3.3 0-1.7-1.4-2.8-3.3-2.8-1.4 0-2.4.7-2.4 1.8 0 .9.7 1.4 1.6 1.4 1.2 0 1.9-1 1.9-2.6"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'email':
      return (
        <>
          <Rect x={4} y={6} width={16} height={12} rx={2} stroke={color} strokeWidth={sw} />
          <Path d="m5 8 7 5 7-5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'website':
    default:
      return (
        <>
          <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={sw} />
          <Path d="M4 12h16M12 4c2.5 2.2 2.5 13.8 0 16M12 4c-2.5 2.2-2.5 13.8 0 16" stroke={color} strokeWidth={sw} />
        </>
      );
  }
}

/** A single brand-tinted social glyph (optionally on a circular tile). */
export function SocialIcon({
  network,
  size = 22,
  color = colors.guardianGold,
  tile = false,
}: {
  network: SocialNetwork;
  size?: number;
  color?: string;
  tile?: boolean;
}) {
  const glyph = (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Glyph network={network} color={color} sw={1.7} />
    </Svg>
  );
  if (!tile) return glyph;
  const box = size + 18;
  return (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.candlelight,
        borderWidth: 1,
        borderColor: colors.softGold,
      }}
    >
      {glyph}
    </View>
  );
}
