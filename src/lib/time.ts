import type { ISODate, Minutes, Weekday } from '../data/types';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const MONTHS_TITLE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function parseDate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date: Date): ISODate {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parseDate(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** 0 = Monday … 6 = Sunday */
export function weekday(iso: ISODate): Weekday {
  return ((parseDate(iso).getDay() + 6) % 7) as Weekday;
}

export function mondayOf(iso: ISODate): ISODate {
  return addDays(iso, -weekday(iso));
}

export function monthShort(iso: ISODate) {
  return MONTHS[parseDate(iso).getMonth()];
}

export function dayOfMonth(iso: ISODate) {
  return parseDate(iso).getDate();
}

export function dayShort(iso: ISODate) {
  return DAY_SHORT[weekday(iso)];
}

/** "Wednesday 10/7" */
export function longDate(iso: ISODate) {
  const d = parseDate(iso);
  return `${DAY_LONG[weekday(iso)]} ${d.getMonth() + 1}/${d.getDate()}`;
}

/** "10/7" */
export function numericDate(iso: ISODate) {
  const d = parseDate(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "October 2026" */
export function monthYear(iso: ISODate) {
  const d = parseDate(iso);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Oct 12", "Oct 12 – 14", "Oct 30 – Nov 2" */
export function dateSpan(start: ISODate, end: ISODate) {
  if (start === end) return monthDay(start);
  const a = parseDate(start);
  const b = parseDate(end);
  return a.getMonth() === b.getMonth() ? `${monthDay(start)} – ${b.getDate()}` : `${monthDay(start)} – ${monthDay(end)}`;
}

/** Whole days from a to b. */
export function daysBetween(a: ISODate, b: ISODate) {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000);
}

/** "Oct 7" */
export function monthDay(iso: ISODate) {
  const d = parseDate(iso);
  return `${MONTHS_TITLE[d.getMonth()]} ${d.getDate()}`;
}

function parts(m: Minutes) {
  const h24 = Math.floor(m / 60) % 24;
  return { h: h24 % 12 === 0 ? 12 : h24 % 12, min: m % 60, pm: h24 >= 12 };
}

/** 9:33 AM */
export function clock(m: Minutes) {
  const { h, min, pm } = parts(m);
  return `${h}:${String(min).padStart(2, '0')} ${pm ? 'PM' : 'AM'}`;
}

/** "12 PM", "9:30 AM" */
export function shortClock(m: Minutes) {
  const { h, min, pm } = parts(m);
  return `${h}${min ? `:${String(min).padStart(2, '0')}` : ''} ${pm ? 'PM' : 'AM'}`;
}

/** Hour label for calendar rows: "9", "12", "1" */
export function hourLabel(m: Minutes) {
  return String(parts(m).h);
}

/** "4:00 - 6:00 PM" (Friends list style) */
export function rangeClock(start: Minutes, end: Minutes) {
  const a = parts(start);
  const b = parts(end);
  const left = `${a.h}:${String(a.min).padStart(2, '0')}`;
  const right = clock(end);
  return a.pm === b.pm ? `${left} - ${right}` : `${clock(start)} - ${right}`;
}

/** "12 PM - 2 PM" (Home style) */
export function rangeShort(start: Minutes, end: Minutes) {
  return `${shortClock(start)} - ${shortClock(end)}`;
}

/** "12-1 PM" (compact: Best time, Confirm) */
export function rangeCompact(start: Minutes, end: Minutes) {
  const a = parts(start);
  const b = parts(end);
  const fmt = (p: ReturnType<typeof parts>) => `${p.h}${p.min ? `:${String(p.min).padStart(2, '0')}` : ''}`;
  return a.pm === b.pm
    ? `${fmt(a)}-${fmt(b)} ${b.pm ? 'PM' : 'AM'}`
    : `${fmt(a)} ${a.pm ? 'PM' : 'AM'}-${fmt(b)} ${b.pm ? 'PM' : 'AM'}`;
}

/** "20 mins ago", "4 hrs ago", "1 day ago" */
export function ago(minutes: number) {
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

/** Hours with up to one decimal: "5 hrs", "1.5 hrs", "1 hr" */
export function hoursLabel(minutes: number) {
  const h = Math.round((minutes / 60) * 10) / 10;
  return `${h} ${h === 1 ? 'hr' : 'hrs'}`;
}
