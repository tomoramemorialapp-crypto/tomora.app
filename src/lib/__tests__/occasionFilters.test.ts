import { describe, expect, it } from 'vitest';
import type { FamilyNode } from '@/types/models';
import type { UpcomingEvent } from '@/lib/occasions';
import {
  DEFAULT_OCCASION_FILTER,
  availableOccasionTags,
  filterOccasions,
  isOccasionFilterActive,
  sortOccasions,
} from '../occasionFilters';

function ev(partial: Partial<UpcomingEvent> & Pick<UpcomingEvent, 'id' | 'kind' | 'scope' | 'title' | 'date' | 'daysUntil'>): UpcomingEvent {
  return { ...partial };
}

const nodes: FamilyNode[] = [
  {
    id: 'n1',
    familyTreeId: 't1',
    displayName: 'Ana',
    status: 'claimed',
    isLiving: true,
    defaultVisibility: 'family_tree',
    tags: ["Mother's side"],
    profile: {},
    alternateNames: [],
    memorialPrivacy: 'family',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'n2',
    familyTreeId: 't1',
    displayName: 'Ben',
    status: 'placeholder',
    isLiving: false,
    defaultVisibility: 'family_tree',
    tags: ["Father's side"],
    profile: {},
    alternateNames: [],
    memorialPrivacy: 'family',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

describe('occasionFilters', () => {
  const events: UpcomingEvent[] = [
    ev({ id: 'b1', kind: 'birthday', scope: 'family', title: 'Ana', date: '2026-06-10', daysUntil: 4, nodeId: 'n1' }),
    ev({ id: 'd1', kind: 'death_anniversary', scope: 'family', title: 'Ben', date: '2026-07-01', daysUntil: 25, nodeId: 'n2' }),
    ev({ id: 'h1', kind: 'holiday', scope: 'public', title: 'Christmas', date: '2026-12-25', daysUntil: 200 }),
  ];

  it('detects active filters', () => {
    expect(isOccasionFilterActive(DEFAULT_OCCASION_FILTER)).toBe(false);
    expect(isOccasionFilterActive({ ...DEFAULT_OCCASION_FILTER, kinds: ['birthday'] })).toBe(true);
  });

  it('filters by kind and tag', () => {
    expect(filterOccasions(events, { ...DEFAULT_OCCASION_FILTER, kinds: ['birthday'] }, nodes)).toHaveLength(1);
    expect(
      filterOccasions(events, { ...DEFAULT_OCCASION_FILTER, tags: ["Mother's side"] }, nodes).map((e) => e.id),
    ).toEqual(['b1']);
    expect(filterOccasions(events, { ...DEFAULT_OCCASION_FILTER, tags: ["Mother's side"] }, nodes)).not.toContainEqual(
      expect.objectContaining({ id: 'h1' }),
    );
  });

  it('sorts soonest and alphabetically', () => {
    expect(sortOccasions(events, 'soonest').map((e) => e.id)).toEqual(['b1', 'd1', 'h1']);
    expect(sortOccasions(events, 'furthest').map((e) => e.id)).toEqual(['h1', 'd1', 'b1']);
    expect(sortOccasions(events, 'alpha')[0].title).toBe('Ana');
  });

  it('collects tags from family occasions', () => {
    expect(availableOccasionTags(events, nodes)).toEqual(["Father's side", "Mother's side"]);
  });
});
