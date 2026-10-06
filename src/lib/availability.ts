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

export type DateChoice = 'today' | 'this-week' | 'next-week' | 'custom';

/** A specific day or window picked in the date picker (inclusive, at most 7 days). */
export interface CustomRange {
  start: ISODate;
  end: ISODate;
}

/** Longest window the date picker allows: one week fits the calendar. */
export const MAX_RANGE_DAYS = 7;

export interface DateRange {
  /** Days that can hold a hangout: in the chosen range and not before today. */
  dates: ISODate[];
  /** Day columns to draw: the whole Monday–Sunday week, or the picked days. */
  columns: ISODate[];
}

export function dateRange(choice: DateChoice, custom?: CustomRange, today = api.today()): DateRange {
  if (choice === 'custom' && custom) {
    const days: ISODate[] = [];
    for (let d = custom.start; d <= custom.end && days.length < MAX_RANGE_DAYS; d = addDays(d, 1)) days.push(d);
    return { dates: days.filter((d) => d >= today), columns: days };
  }
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
  /** Shared free minutes, counting only stretches long enough for the hangout. */
  minutes: number;
  /** Dates with at least one shared stretch of the full duration. */
  days: ISODate[];
  /** Why there is no usable overlap (when minutes is 0). */
  reason?: 'never-free' | 'only-when-busy' | 'too-short';
}

/**
 * Shared free time between the student and a friend. Only unbroken stretches
 * at least `duration` long count, so every friend listed with overlap can be
 * scheduled in the Time step.
 */
export function overlapWith(friendId: string, dates: ISODate[], duration: Minutes): Overlap {
  const cells = sharedCells(friendId, dates);
  let minutes = 0;
  const days = new Set<ISODate>();
  let run = 0;
  cells.forEach((c, i) => {
    run = c.bothFree ? run + STEP : 0;
    const next = cells[i + 1];
    const runEnds = !next || next.date !== c.date || !next.bothFree || next.start !== c.start + STEP;
    if (runEnds && run >= duration) {
      minutes += run;
      days.add(c.date);
    }
    if (runEnds) run = 0;
  });
  const reason = minutes > 0 ? undefined
    : cells.some((c) => c.bothFree) ? 'too-short'
    : cells.some((c) => c.theyAreFree) ? 'only-when-busy'
    : 'never-free';
  return { minutes, days: [...days], reason };
}

/**
 * Open slots of `duration` for the student plus `friendIds`. Candidates start
 * every 30 minutes; each day keeps the best non-overlapping slots, and only
 * slots where at least one friend can join are returned.
 */
export function findSlots(dates: ISODate[], duration: Minutes, friendIds: string[], pinned?: Slot): Slot[] {
  const total = friendIds.length + 1;
  // A slot the student already picked stays on the calendar while it still works.
  const keep = pinned && slotWorks(pinned, dates, duration, friendIds) ? { ...pinned, free: 1 + friendsFreeAt(pinned, friendIds).length, total } : undefined;
  return dates.flatMap((date) => {
    const mine = studentBusy(date);
    const candidates: Slot[] = [];
    for (let start = firstStart(date); start + duration <= WINDOW.end; start += STEP) {
      const end = start + duration;
      if (!isFree(mine, start, end)) continue;
      const free = 1 + friendIds.filter((id) => isFree(friendBusy(id, date), start, end)).length;
      if (free >= 2) candidates.push({ date, start, end, free, total });
    }
    const chosen: Slot[] = keep && keep.date === date ? [keep] : [];
    [...candidates]
      .sort((a, b) => b.free - a.free || a.start - b.start)
      .forEach((c) => {
        if (chosen.every((s) => s.end <= c.start || s.start >= c.end)) chosen.push(c);
      });
    return chosen.sort((a, b) => a.start - b.start);
  });
}

/** Invited friends who are free for the whole slot. */
export function friendsFreeAt(slot: Slot, friendIds: string[]) {
  return friendIds.filter((id) => isFree(friendBusy(id, slot.date), slot.start, slot.end));
}

/**
 * Whether a picked slot still works after edits: it is in the date range,
 * matches the duration, the student is free, and at least one friend can come.
 */
export function slotWorks(slot: Slot, dates: ISODate[], duration: Minutes, friendIds: string[]) {
  return (
    dates.includes(slot.date) &&
    slot.end - slot.start === duration &&
    slot.start >= firstStart(slot.date) &&
    slot.end <= WINDOW.end &&
    isFree(studentBusy(slot.date), slot.start, slot.end) &&
    friendsFreeAt(slot, friendIds).length > 0
  );
}

/** The earliest slot with the most people free. */
export function bestSlot(slots: Slot[]): Slot | undefined {
  return [...slots].sort((a, b) => b.free - a.free || a.date.localeCompare(b.date) || a.start - b.start)[0];
}

export const sameSlot = (a?: Slot, b?: Slot) =>
  !!a && !!b && a.date === b.date && a.start === b.start && a.end === b.end;
