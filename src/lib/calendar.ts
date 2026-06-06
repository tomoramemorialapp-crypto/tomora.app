import { Platform, Share } from 'react-native';

import type { UpcomingEvent } from '@/lib/occasions';

/** Format a Date as an all-day iCalendar date stamp (YYYYMMDD). */
function icsDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function googleDate(d: Date): string {
  return icsDate(d);
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Build an all-day single .ics calendar event for an occasion. */
export function buildICS(event: UpcomingEvent): string {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const stamp = `${icsDate(new Date())}T000000Z`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tomora//Occasions//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@tomora.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    event.subtitle ? `DESCRIPTION:${escapeICS(event.subtitle)}` : '',
    'RRULE:FREQ=YEARLY',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
}

/** Google Calendar "add event" URL (opens in a new tab / browser). */
export function googleCalendarUrl(event: UpcomingEvent): string {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${googleDate(start)}/${googleDate(end)}`,
    details: event.subtitle ?? 'Saved from Tomora',
    recur: 'RRULE:FREQ=YEARLY',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Add an occasion to the user's calendar. On web this downloads an .ics file
 * (which iCalendar/Apple/Outlook/Google all import); on native it shares the
 * .ics content so the device calendar can ingest it.
 */
export async function addToCalendar(event: UpcomingEvent): Promise<void> {
  const ics = buildICS(event);
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  await Share.share({ message: `${event.title}\n\n${ics}`, title: event.title });
}
