/** Social link platform identifiers (shared by icons, editor, and storage). */
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
