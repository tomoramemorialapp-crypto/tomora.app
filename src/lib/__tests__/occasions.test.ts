import { describe, expect, it } from 'vitest';
import type { FamilyNode, Relationship } from '@/types/models';
import type { NodeProfile, ProfileField } from '@/types/profile';
import type { DateValue } from '@/types/profile';
import { getUpcomingEvents } from '@/lib/occasions';

function dateField(iso: string): ProfileField<DateValue> {
  return {
    value: { value: iso, certainty: 'exact' },
    visibility: 'family_tree',
    status: 'confirmed',
    source: { sourceType: 'guardian' },
    lastEditedByAccountId: 'acct1',
    lastEditedAt: '2026-01-01',
  };
}

function node(id: string, overrides: Partial<FamilyNode> = {}): FamilyNode {
  const profile: NodeProfile = {
    dateOfBirth: dateField('1940-03-15'),
    dateOfDeath: dateField('2018-11-02'),
    ...(overrides.profile ?? {}),
  };
  return {
    id,
    familyTreeId: 'tree1',
    displayName: 'Grandmother',
    status: 'memory_light',
    isLiving: false,
    defaultVisibility: 'family_tree',
    profile,
    tags: [],
    alternateNames: [],
    memorialPrivacy: 'family',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

describe('getUpcomingEvents', () => {
  it('includes a birthday celebration for someone who has passed', () => {
    const events = getUpcomingEvents([node('g1')], {
      now: new Date('2026-03-01'),
      withinDays: 366,
    });

    const birthday = events.find((e) => e.id === 'bday-g1');
    expect(birthday).toBeDefined();
    expect(birthday!.kind).toBe('birthday');
    expect(birthday!.subtitle).toMatch(/Celebrating \d+ years of life/);
  });

  it('still includes a death anniversary when date of death is known', () => {
    const events = getUpcomingEvents([node('g1')], {
      now: new Date('2026-03-01'),
      withinDays: 366,
    });

    expect(events.find((e) => e.id === 'death-g1')).toBeDefined();
  });

  it('includes birthdays for living family members', () => {
    const events = getUpcomingEvents([
      node('self', {
        displayName: 'You',
        status: 'claimed',
        isLiving: true,
        profile: { dateOfBirth: dateField('1990-07-04') },
      }),
    ], { now: new Date('2026-06-01'), withinDays: 366 });

    const birthday = events.find((e) => e.id === 'bday-self');
    expect(birthday?.subtitle).toBe('Turning 36');
  });

  it('includes wedding anniversaries for spouse connections with a wedding date', () => {
    const events = getUpcomingEvents(
      [
        node('mom', { displayName: 'Maria', status: 'claimed', isLiving: true, profile: {} }),
        node('dad', { displayName: 'Jose', status: 'claimed', isLiving: true, profile: {} }),
      ],
      {
        now: new Date('2026-06-01'),
        withinDays: 366,
        relationships: [
          {
            id: 'rel1',
            familyTreeId: 'tree1',
            fromNodeId: 'mom',
            toNodeId: 'dad',
            relationshipType: 'spouse',
            status: 'approved',
            visibility: 'family_tree',
            weddingDate: '1990-06-15',
            createdByAccountId: 'acct1',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          } satisfies Relationship,
        ],
      },
    );

    const anniversary = events.find((e) => e.id === 'wedding-rel1');
    expect(anniversary).toBeDefined();
    expect(anniversary!.kind).toBe('wedding_anniversary');
    expect(anniversary!.title).toBe("Maria & Jose's wedding anniversary");
    expect(anniversary!.subtitle).toMatch(/36th wedding anniversary/);
    expect(anniversary!.partnerNodeId).toBe('dad');
  });
});
