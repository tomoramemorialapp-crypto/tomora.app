import type { FamilyNode } from '@/types/models';
import type { OccasionKind, OccasionScope, UpcomingEvent } from '@/lib/occasions';

export type OccasionSort = 'soonest' | 'furthest' | 'alpha' | 'kind';

export interface OccasionFilterState {
  /** Empty = all kinds. */
  kinds: OccasionKind[];
  /** Empty = all scopes. */
  scopes: OccasionScope[];
  /** Empty = all tags. Family events must match at least one tag when set. */
  tags: string[];
}

export const DEFAULT_OCCASION_FILTER: OccasionFilterState = {
  kinds: [],
  scopes: [],
  tags: [],
};

export const KIND_LABELS: Record<OccasionKind, string> = {
  birthday: 'Birthdays',
  death_anniversary: 'Remembrance',
  wedding_anniversary: 'Wedding anniversaries',
  holiday: 'Holidays & events',
};

export const SCOPE_LABELS: Record<OccasionScope, string> = {
  family: 'Family occasions',
  public: 'Public holidays',
};

export const SORT_LABELS: Record<OccasionSort, string> = {
  soonest: 'Soonest first',
  furthest: 'Furthest out',
  alpha: 'A–Z by name',
  kind: 'By type, then date',
};

const KIND_ORDER: OccasionKind[] = ['birthday', 'death_anniversary', 'wedding_anniversary', 'holiday'];

export function isOccasionFilterActive(filter: OccasionFilterState): boolean {
  return filter.kinds.length > 0 || filter.scopes.length > 0 || filter.tags.length > 0;
}

/** Tags used on nodes that appear in at least one family occasion. */
export function availableOccasionTags(events: UpcomingEvent[], nodes: FamilyNode[]): string[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const set = new Set<string>();
  for (const e of events) {
    const ids = e.partnerNodeId ? [e.nodeId, e.partnerNodeId] : e.nodeId ? [e.nodeId] : [];
    for (const id of ids) {
      if (!id) continue;
      const node = nodeMap.get(id);
      for (const t of node?.tags ?? []) {
        const trimmed = t.trim();
        if (trimmed) set.add(trimmed);
      }
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function filterOccasions(
  events: UpcomingEvent[],
  filter: OccasionFilterState,
  nodes: FamilyNode[],
): UpcomingEvent[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return events.filter((e) => {
    if (filter.kinds.length > 0 && !filter.kinds.includes(e.kind)) return false;
    if (filter.scopes.length > 0 && !filter.scopes.includes(e.scope)) return false;
    if (filter.tags.length > 0) {
      const tagIds = e.partnerNodeId ? [e.nodeId, e.partnerNodeId] : e.nodeId ? [e.nodeId] : [];
      if (tagIds.length === 0) return false;
      const nodeTags = new Set(tagIds.flatMap((id) => (id ? nodeMap.get(id)?.tags ?? [] : [])));
      if (!filter.tags.some((t) => nodeTags.has(t))) return false;
    }
    return true;
  });
}

export function sortOccasions(events: UpcomingEvent[], sort: OccasionSort): UpcomingEvent[] {
  const list = [...events];
  switch (sort) {
    case 'furthest':
      return list.sort((a, b) => b.daysUntil - a.daysUntil || a.title.localeCompare(b.title));
    case 'alpha':
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case 'kind':
      return list.sort((a, b) => {
        const ka = KIND_ORDER.indexOf(a.kind);
        const kb = KIND_ORDER.indexOf(b.kind);
        if (ka !== kb) return ka - kb;
        return a.daysUntil - b.daysUntil || a.title.localeCompare(b.title);
      });
    case 'soonest':
    default:
      return list.sort((a, b) => a.daysUntil - b.daysUntil || a.title.localeCompare(b.title));
  }
}

export function toggleIn<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}
