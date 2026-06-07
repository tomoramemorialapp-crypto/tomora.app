import { describe, expect, it } from 'vitest';

import {
  defaultSocialLinkItems,
  filterSocialLinkItems,
  moveSocialLinkItem,
  parseSocialLinkItems,
  publicSocialLinkItems,
  resolveSocialUrl,
  serializeSocialLinks,
} from '@/lib/socialLinks';

describe('socialLinks', () => {
  it('defaults to email and sms rows', () => {
    const items = defaultSocialLinkItems('me@example.com');
    expect(items).toHaveLength(2);
    expect(items[0]?.network).toBe('email');
    expect(items[0]?.url).toBe('me@example.com');
    expect(items[1]?.network).toBe('sms');
  });

  it('migrates legacy flat links', () => {
    const items = parseSocialLinkItems({ instagram: '@el', website: 'https://tomora.app' });
    expect(items.some((i) => i.network === 'instagram' && i.url === '@el')).toBe(true);
    expect(items.some((i) => i.network === 'website')).toBe(true);
  });

  it('round-trips v2 storage', () => {
    const items = defaultSocialLinkItems();
    items[0] = { ...items[0]!, url: 'a@b.co', visibility: 'family_tree' };
    const stored = serializeSocialLinks(items);
    const parsed = parseSocialLinkItems(stored);
    expect(parsed[0]?.visibility).toBe('family_tree');
  });

  it('filters public links for anonymous profile view', () => {
    const stored = serializeSocialLinks([
      { id: '1', network: 'email', url: 'a@b.co', visibility: 'public' },
      { id: '2', network: 'sms', url: '+15551234', visibility: 'private' },
    ]);
    const publicItems = publicSocialLinkItems(stored);
    expect(publicItems).toHaveLength(1);
    expect(publicItems[0]?.network).toBe('email');
  });

  it('reorders items', () => {
    const items = defaultSocialLinkItems();
    const moved = moveSocialLinkItem(items, items[1]!.id, -1);
    expect(moved[0]?.network).toBe('sms');
  });

  it('resolves email and sms urls', () => {
    expect(resolveSocialUrl('email', 'me@example.com')).toBe('mailto:me@example.com');
    expect(resolveSocialUrl('sms', '+1 555 123 4567')).toBe('sms:+15551234567');
  });
});
