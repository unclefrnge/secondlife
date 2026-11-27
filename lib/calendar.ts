import type { Recording } from '@/app/work/Recordings';

export type CalendarEntry = {
  title: string;
  kind: 'Release' | 'Radio';
  // YYYY-MM for a known month, YYYY-MM-DD for an established day.
  date: string;
  recording?: Recording;
  href?: string;
};

export const juneReading = {
  title: 'The June Draught',
  href: 'https://chamber-times.vercel.app/#entry=155'
};

export const calendarDay = (date: Date) => date.toISOString().slice(0, 10);

export function displayDate(value: string, options: Intl.DateTimeFormatOptions) {
  const iso = value.length === 7 ? value + '-01' : value;
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
}
