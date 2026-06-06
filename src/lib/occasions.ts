/**
 * Computes upcoming life events for the Home feed: birthdays and death
 * anniversaries derived from each node's profile, plus relevant holidays
 * (Mother's Day, Father's Day, etc.). Pure and deterministic for a given `now`.
 */

import type { FamilyNode } from '@/types/models';
import type { DateValue } from '@/types/profile';

export type OccasionKind = 'birthday' | 'death_anniversary' | 'holiday';

/** Family = tied to a specific person/node. Public = generic/international holiday. */
export type OccasionScope = 'family' | 'public';

export interface UpcomingEvent {
  id: string;
  kind: OccasionKind;
  scope: OccasionScope;
  title: string;
  subtitle?: string;
  date: string; // ISO date of the next occurrence
  daysUntil: number;
  nodeId?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Extract {month, day} (1-indexed month) from a DateValue, if available. */
function monthDayOf(d?: DateValue): { month: number; day: number } | null {
  if (!d) return null;
  const iso = d.value ?? (d.monthYearOnly ? `${d.monthYearOnly}-01` : undefined);
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(iso);
  if (!m) return null;
  const month = Number(m[2]);
  const day = m[3] ? Number(m[3]) : 1;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

function birthYearOf(d?: DateValue): number | undefined {
  if (!d) return undefined;
  if (d.yearOnly) return d.yearOnly;
  const iso = d.value ?? d.monthYearOnly;
  const m = iso ? /^(\d{4})/.exec(iso) : null;
  return m ? Number(m[1]) : undefined;
}

/** Next date (today or future) matching month/day, relative to `now`. */
function nextAnnual(now: Date, month: number, day: number): Date {
  const today = startOfDay(now);
  let candidate = new Date(today.getFullYear(), month - 1, day);
  if (candidate < today) candidate = new Date(today.getFullYear() + 1, month - 1, day);
  return candidate;
}

function nthWeekdayOfMonth(year: number, month0: number, weekday: number, n: number): Date {
  const first = new Date(year, month0, 1);
  const offset = (7 + weekday - first.getDay()) % 7;
  return new Date(year, month0, 1 + offset + (n - 1) * 7);
}

interface HolidayDef {
  id: string;
  title: string;
  subtitle?: string;
  resolve: (year: number) => Date;
}

const HOLIDAYS: HolidayDef[] = [
  { id: 'new-year', title: "New Year's Day", subtitle: 'A fresh chapter', resolve: (y) => new Date(y, 0, 1) },
  { id: 'valentines', title: "Valentine's Day", resolve: (y) => new Date(y, 1, 14) },
  { id: 'womens-day', title: "International Women's Day", resolve: (y) => new Date(y, 2, 8) },
  { id: 'mothers-day', title: "Mother's Day", subtitle: 'Honor the mothers in your tree', resolve: (y) => nthWeekdayOfMonth(y, 4, 0, 2) },
  { id: 'fathers-day', title: "Father's Day", subtitle: 'Honor the fathers in your tree', resolve: (y) => nthWeekdayOfMonth(y, 5, 0, 3) },
  { id: 'grandparents-day', title: "Grandparents' Day", resolve: (y) => nthWeekdayOfMonth(y, 8, 0, 1) },
  { id: 'thanksgiving', title: 'Thanksgiving', subtitle: 'A time to gather', resolve: (y) => nthWeekdayOfMonth(y, 10, 4, 4) },
  { id: 'christmas', title: 'Christmas', resolve: (y) => new Date(y, 11, 25) },
];

function daysBetween(now: Date, date: Date): number {
  return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** Build the list of upcoming events within `withinDays`, sorted soonest-first. */
export function getUpcomingEvents(
  nodes: FamilyNode[],
  opts: { withinDays?: number; now?: Date } = {},
): UpcomingEvent[] {
  const now = opts.now ?? new Date();
  const withinDays = opts.withinDays ?? 120;
  const events: UpcomingEvent[] = [];

  for (const node of nodes) {
    const isDeceased = node.isLiving === false || node.status === 'memory_light' || node.status === 'memorial_pending';

    if (!isDeceased) {
      const md = monthDayOf(node.profile?.dateOfBirth?.value);
      if (md) {
        const date = nextAnnual(now, md.month, md.day);
        const byear = birthYearOf(node.profile?.dateOfBirth?.value);
        const turning = byear ? date.getFullYear() - byear : undefined;
        events.push({
          id: `bday-${node.id}`,
          kind: 'birthday',
          scope: 'family',
          title: `${node.displayName}'s birthday`,
          subtitle: turning && turning > 0 ? `Turning ${turning}` : undefined,
          date: date.toISOString(),
          daysUntil: daysBetween(now, date),
          nodeId: node.id,
        });
      }
    } else {
      const md = monthDayOf(node.profile?.dateOfDeath?.value);
      if (md) {
        const date = nextAnnual(now, md.month, md.day);
        const dyear = birthYearOf(node.profile?.dateOfDeath?.value);
        const years = dyear ? date.getFullYear() - dyear : undefined;
        events.push({
          id: `death-${node.id}`,
          kind: 'death_anniversary',
          scope: 'family',
          title: `Remembering ${node.displayName}`,
          subtitle: years && years > 0 ? `${ordinal(years)} anniversary` : 'Death anniversary',
          date: date.toISOString(),
          daysUntil: daysBetween(now, date),
          nodeId: node.id,
        });
      }
    }
  }

  for (const h of HOLIDAYS) {
    let date = h.resolve(now.getFullYear());
    if (startOfDay(date) < startOfDay(now)) date = h.resolve(now.getFullYear() + 1);
    events.push({
      id: `holiday-${h.id}`,
      kind: 'holiday',
      scope: 'public',
      title: h.title,
      subtitle: h.subtitle,
      date: date.toISOString(),
      daysUntil: daysBetween(now, date),
    });
  }

  return events
    .filter((e) => e.daysUntil >= 0 && e.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Friendly relative label for an event's distance in days. */
export function whenLabel(daysUntil: number): string {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil < 7) return `In ${daysUntil} days`;
  if (daysUntil < 14) return 'Next week';
  if (daysUntil < 31) return `In ${Math.round(daysUntil / 7)} weeks`;
  return `In ${Math.round(daysUntil / 30)} month${daysUntil >= 60 ? 's' : ''}`;
}
