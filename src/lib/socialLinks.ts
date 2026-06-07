import { SOCIAL_LABELS, type SocialNetwork } from '@/lib/socialNetworks';
import type { SocialLinkItem, SocialLinks, SocialLinkVisibility } from '@/types/models';

export const SOCIAL_LINK_VISIBILITY_LABELS: Record<SocialLinkVisibility, string> = {
  public: 'Public',
  family_tree: 'Family only',
  private: 'Private',
};

export const SOCIAL_LINK_VISIBILITY_OPTIONS: { id: SocialLinkVisibility; label: string }[] = [
  { id: 'public', label: 'Public' },
  { id: 'family_tree', label: 'Family only' },
  { id: 'private', label: 'Private' },
];

/** Preset networks users can add from the icon picker (excluding email/sms defaults). */
export const ADDABLE_SOCIAL_NETWORKS: SocialNetwork[] = [
  'website',
  'instagram',
  'facebook',
  'x',
  'linkedin',
  'youtube',
  'tiktok',
  'spotify',
  'whatsapp',
  'telegram',
  'github',
  'threads',
  'messenger',
  'viber',
];

export const SOCIAL_URL_PLACEHOLDERS: Partial<Record<SocialNetwork, string>> = {
  website: 'https://…',
  instagram: '@handle',
  facebook: 'Profile URL',
  x: '@handle',
  linkedin: 'Profile URL',
  youtube: 'Channel URL',
  tiktok: '@handle',
  spotify: 'Profile URL',
  whatsapp: 'wa.me/… or number',
  telegram: '@handle',
  github: '@username',
  threads: '@handle',
  email: 'you@example.com',
  sms: '+1 555 123 4567',
};

function newId(): string {
  return `sl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isSocialNetwork(v: string): v is SocialNetwork {
  return v in SOCIAL_LABELS;
}

function normalizeVisibility(v: unknown): SocialLinkVisibility {
  if (v === 'family_tree' || v === 'private') return v;
  return 'public';
}

/** Default editor rows — email + SMS, both public. */
export function defaultSocialLinkItems(accountEmail?: string): SocialLinkItem[] {
  return [
    { id: newId(), network: 'email', url: accountEmail?.trim() ?? '', visibility: 'public' },
    { id: newId(), network: 'sms', url: '', visibility: 'public' },
  ];
}

const LEGACY_ORDER: SocialNetwork[] = [
  'website',
  'instagram',
  'facebook',
  'x',
  'linkedin',
  'youtube',
  'tiktok',
  'spotify',
  'whatsapp',
  'telegram',
  'github',
  'threads',
  'email',
  'sms',
];

function migrateLegacyFlat(raw: Record<string, unknown>, accountEmail?: string): SocialLinkItem[] {
  const items: SocialLinkItem[] = [];
  const seen = new Set<SocialNetwork>();

  for (const network of LEGACY_ORDER) {
    const url = raw[network];
    if (typeof url !== 'string' || !url.trim()) continue;
    items.push({ id: newId(), network, url: url.trim(), visibility: 'public' });
    seen.add(network);
  }

  for (const [key, value] of Object.entries(raw)) {
    if (key === 'version' || key === 'items') continue;
    if (typeof value !== 'string' || !value.trim()) continue;
    if (!isSocialNetwork(key) || seen.has(key)) continue;
    items.push({ id: newId(), network: key, url: value.trim(), visibility: 'public' });
  }

  if (items.length === 0) return defaultSocialLinkItems(accountEmail);
  return items;
}

function parseV2Items(raw: unknown): SocialLinkItem[] | null {
  if (!isRecord(raw) || raw.version !== 2 || !Array.isArray(raw.items)) return null;
  const items: SocialLinkItem[] = [];
  for (const row of raw.items) {
    if (!isRecord(row)) continue;
    const network = row.network;
    const url = row.url;
    if (typeof network !== 'string' || !isSocialNetwork(network)) continue;
    if (typeof url !== 'string') continue;
    items.push({
      id: typeof row.id === 'string' && row.id ? row.id : newId(),
      network,
      url,
      label: typeof row.label === 'string' ? row.label : undefined,
      visibility: normalizeVisibility(row.visibility),
    });
  }
  return items;
}

/** Parse stored account social_links JSON into editable items. */
export function parseSocialLinkItems(raw: SocialLinks | null | undefined, accountEmail?: string): SocialLinkItem[] {
  if (!raw || (typeof raw === 'object' && Object.keys(raw).length === 0)) {
    return defaultSocialLinkItems(accountEmail);
  }

  const v2 = parseV2Items(raw);
  if (v2) return v2.length > 0 ? v2 : defaultSocialLinkItems(accountEmail);

  if (isRecord(raw)) return migrateLegacyFlat(raw, accountEmail);
  return defaultSocialLinkItems(accountEmail);
}

/** Serialize items for accounts.social_links JSONB. */
export function serializeSocialLinks(items: SocialLinkItem[]): SocialLinks {
  return {
    version: 2,
    items: items.map((item) => ({
      id: item.id,
      network: item.network,
      url: item.url.trim(),
      ...(item.label?.trim() ? { label: item.label.trim() } : null),
      visibility: item.visibility,
    })),
  };
}

export function socialLinkLabel(item: SocialLinkItem): string {
  return item.label?.trim() || SOCIAL_LABELS[item.network];
}

export function resolveSocialUrl(network: SocialNetwork, value: string): string {
  const v = value.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;

  switch (network) {
    case 'email': {
      const addr = v.replace(/^mailto:/i, '');
      return `mailto:${addr}`;
    }
    case 'sms': {
      const digits = v.replace(/^sms:/i, '').replace(/[^\d+]/g, '');
      return `sms:${digits}`;
    }
    case 'instagram':
      return `https://instagram.com/${v.replace(/^@/, '')}`;
    case 'facebook':
      return v.includes('.') ? (v.startsWith('http') ? v : `https://${v}`) : `https://facebook.com/${v}`;
    case 'x':
      return `https://x.com/${v.replace(/^@/, '')}`;
    case 'linkedin':
      return v.includes('linkedin.com') ? (v.startsWith('http') ? v : `https://${v}`) : `https://www.linkedin.com/in/${v.replace(/^@/, '')}`;
    case 'youtube':
      return v.includes('youtube.com') || v.includes('youtu.be')
        ? (v.startsWith('http') ? v : `https://${v}`)
        : `https://youtube.com/${v.replace(/^@/, '')}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${v.replace(/^@/, '')}`;
    case 'spotify':
      return v.startsWith('http') ? v : `https://open.spotify.com/${v}`;
    case 'whatsapp':
      return `https://wa.me/${v.replace(/[^0-9]/g, '')}`;
    case 'telegram':
      return `https://t.me/${v.replace(/^@/, '')}`;
    case 'github':
      return `https://github.com/${v.replace(/^@/, '')}`;
    case 'threads':
      return `https://www.threads.net/@${v.replace(/^@/, '')}`;
    case 'website':
    default:
      return v.startsWith('http') ? v : `https://${v}`;
  }
}

export function filterSocialLinkItems(
  items: SocialLinkItem[],
  visibility: SocialLinkVisibility | SocialLinkVisibility[],
): SocialLinkItem[] {
  const allowed = Array.isArray(visibility) ? visibility : [visibility];
  return items.filter((item) => item.url.trim().length > 0 && allowed.includes(item.visibility));
}

/** Items visible on the anonymous public profile page. */
export function publicSocialLinkItems(raw: SocialLinks | null | undefined): SocialLinkItem[] {
  return filterSocialLinkItems(parseSocialLinkItems(raw), 'public');
}

export function moveSocialLinkItem(items: SocialLinkItem[], id: string, direction: -1 | 1): SocialLinkItem[] {
  const index = items.findIndex((i) => i.id === id);
  if (index < 0) return items;
  const next = index + direction;
  if (next < 0 || next >= items.length) return items;
  const copy = [...items];
  const [row] = copy.splice(index, 1);
  copy.splice(next, 0, row);
  return copy;
}

export function upsertSocialLinkItem(items: SocialLinkItem[], item: SocialLinkItem): SocialLinkItem[] {
  const index = items.findIndex((i) => i.id === item.id);
  if (index < 0) return [...items, item];
  const copy = [...items];
  copy[index] = item;
  return copy;
}

export function removeSocialLinkItem(items: SocialLinkItem[], id: string): SocialLinkItem[] {
  return items.filter((i) => i.id !== id);
}

export function createSocialLinkItem(network: SocialNetwork, partial?: Partial<SocialLinkItem>): SocialLinkItem {
  return {
    id: newId(),
    network,
    url: '',
    visibility: 'public',
    ...partial,
  };
}
