/**
 * Availability is computed from each person's weekly schedule plus the
 * student's own classes and confirmed events — never hard-coded per slot.
 */
import { api } from '../data/api';
import type { ISODate, Minutes, Weekday, WeeklyBlock } from '../data/types';
import { addDays, mondayOf, weekday } from './time';

export interface Interval {
  start: Minutes;
  end: Minutes;
}

export interface Slot {
  date: ISODate;
  start: Minutes;
  end: Minutes;
  /** People free, counting the student. */
  free: number;
  /** Group size, counting the student. */
  total: number;
}

/** Hangout hours considered when looking for a time. */
export const WINDOW: Interval = { start: 9 * 60, end: 17 * 60 };
const STEP = 30;

export type DateChoice = 'today' | 'this-week' | 'next-week';

export interface DateRange {
  /** Days that can hold a hangout: in the chosen range and not before today. */
  dates: ISODate[];
  /** Day columns to draw: the whole Monday–Sunday week. */
  columns: ISODate[];
}

export function dateRange(choice: DateChoice, today = api.today()): DateRange {
  const week = (monday: ISODate) => Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const thisWeek = week(mondayOf(today));
  if (choice === 'today') return { dates: [today], columns: thisWeek };
  if (choice === 'this-week') return { dates: thisWeek.filter((d) => d >= today), columns: thisWeek };
  const nextWeek = week(addDays(mondayOf(today), 7));
  return { dates: nextWeek, columns: nextWeek };
}

const blocksOn = (blocks: WeeklyBlock[], day: Weekday): Interval[] =>
  blocks.filter((b) => b.day === day).map(({ start, end }) => ({ start, end }));

/** The student's busy time on a date: current-quarter classes and their own events. */
export function studentBusy(date: ISODate): Interval[] {
  const day = weekday(date);
  const classes = api.courses(api.currentQuarter()).flatMap((c) => blocksOn(c.meetings, day));
  const events = api.events().filter((e) => e.date === date).map(({ start, end }) => ({ start, end }));
  return [...classes, ...events];
}

export function friendBusy(friendId: string, date: ISODate): Interval[] {
  const friend = api.friend(friendId);
  return friend ? blocksOn(friend.busy, weekday(date)) : [];
}

/** Nothing can be scheduled in the past: today starts at the next half hour. */
function firstStart(date: ISODate) {
  if (date !== api.today()) return WINDOW.start;
  return Math.max(WINDOW.start, Math.ceil(api.nowMinutes() / STEP) * STEP);
}

export const isFree = (busy: Interval[], start: Minutes, end: Minutes) =>
  busy.every((b) => b.end <= start || b.start >= end);

/** 30-minute cells inside the window where both the student and the friend are free. */
function sharedCells(friendId: string, dates: ISODate[]) {
  return dates.flatMap((date) => {
    const mine = studentBusy(date);
    const theirs = friendBusy(friendId, date);
    const cells: { date: ISODate; start: Minutes; theyAreFree: boolean; bothFree: boolean }[] = [];
    for (let s = firstStart(date); s + STEP <= WINDOW.end; s += STEP) {
      const theyAreFree = isFree(theirs, s, s + STEP);
      cells.push({ date, start: s, theyAreFree, bothFree: theyAreFree && isFree(mine, s, s + STEP) });
    }
    return cells;
  });
}

export interface Overlap {
  minutes: number;
  /** Dates on which the friend and student share free time. */
  days: ISODate[];
  /** True if the friend has free time, but only while the student is busy. */
  freeOnlyWhenBusy: boolean;
}

export function overlapWith(friendId: string, dates: ISODate[]): Overlap {
  const cells = sharedCells(friendId, dates);
  const shared = cells.filter((c) => c.bothFree);
  return {
    minutes: shared.length * STEP,
    days: [...new Set(shared.map((c) => c.date))],
    freeOnlyWhenBusy: shared.length === 0 && cells.some((c) => c.theyAreFree),
  };
}

/**
 * Open slots of `duration` for the student plus `friendIds`. Candidates start
 * every 30 minutes; each day keeps the best non-overlapping slots, and only
 * slots where at least one friend can join are returned.
 */
export function findSlots(dates: ISODate[], duration: Minutes, friendIds: string[]): Slot[] {
  const total = friendIds.length + 1;
  return dates.flatMap((date) => {
    const mine = studentBusy(date);
    const candidates: Slot[] = [];
    for (let start = firstStart(date); start + duration <= WINDOW.end; start += STEP) {
      const end = start + duration;
      if (!isFree(mine, start, end)) continue;
      const free = 1 + friendIds.filter((id) => isFree(friendBusy(id, date), start, end)).length;
      if (free >= 2) candidates.push({ date, start, end, free, total });
    }
    const chosen: Slot[] = [];
    [...candidates]
      .sort((a, b) => b.free - a.free || a.start - b.start)
      .forEach((c) => {
        if (chosen.every((s) => s.end <= c.start || s.start >= c.end)) chosen.push(c);
      });
    return chosen.sort((a, b) => a.start - b.start);
  });
}

/** The earliest slot with the most people free. */
export function bestSlot(slots: Slot[]): Slot | undefined {
  return [...slots].sort((a, b) => b.free - a.free || a.date.localeCompare(b.date) || a.start - b.start)[0];
}

export const sameSlot = (a?: Slot, b?: Slot) =>
  !!a && !!b && a.date === b.date && a.start === b.start && a.end === b.end;
