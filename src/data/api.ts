/**
 * The app's single data layer. Screens and hooks read and write only through
 * this module, so a real backend can replace the mock data later without
 * touching components. Stage 1 keeps everything in memory for the session.
 */
import { useSyncExternalStore } from 'react';
import * as mock from './mock';
import type { AppEvent, ChatThread, Course, ForumPost, Friend, Person, Place, Quarter } from './types';

let events: AppEvent[] = [...mock.events];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const byDateTime = (a: AppEvent, b: AppEvent) => a.date.localeCompare(b.date) || a.start - b.start;

export const api = {
  today: () => mock.TODAY,
  nowMinutes: () => mock.NOW_MINUTES,
  student: (): Person => mock.STUDENT,
  currentQuarter: (): Quarter => mock.CURRENT_QUARTER,

  courses: (quarter?: Quarter): Course[] =>
    quarter ? mock.courses.filter((c) => c.quarter === quarter) : mock.courses,
  course: (id: string) => mock.courses.find((c) => c.id === id),

  friends: (): Friend[] => mock.friends,
  friend: (id: string) => mock.friends.find((f) => f.id === id),

  /** Any person the app knows about: friends, classmates, the student. */
  person: (id: string): Person | undefined =>
    mock.friends.find((f) => f.id === id) ??
    mock.classmates.find((p) => p.id === id) ??
    (id === mock.STUDENT.id ? mock.STUDENT : undefined),

  forumPosts: (courseId: string): ForumPost[] =>
    mock.forumPosts.filter((p) => p.courseId === courseId).sort((a, b) => a.minutesAgo - b.minutesAgo),
  /** Unanswered discussions in the current quarter's classes, newest first. */
  discussionsToReview: (): ForumPost[] => {
    const mine = new Set(mock.courses.filter((c) => c.quarter === mock.CURRENT_QUARTER).map((c) => c.id));
    return mock.forumPosts
      .filter((p) => mine.has(p.courseId) && !p.answered)
      .sort((a, b) => a.minutesAgo - b.minutesAgo);
  },
  chats: (courseId: string): ChatThread[] =>
    mock.chats.filter((c) => c.courseId === courseId).sort((a, b) => b.time - a.time),
  unreadChats: (courseId: string) => mock.chats.filter((c) => c.courseId === courseId && c.unread).length,

  places: (campus?: Place['campus']): Place[] =>
    campus ? mock.places.filter((p) => p.campus === campus) : mock.places,
  place: (id: string) => mock.places.find((p) => p.id === id),
  campusCenter: () => mock.CAMPUS_CENTER,

  events: () => events,
  addEvent(event: AppEvent) {
    events = [...events, event].sort(byDateTime);
    emit();
  },
  removeEvent(id: string) {
    events = events.filter((e) => e.id !== id);
    emit();
  },
};

/** Upcoming events, sorted by date, re-rendering when they change. */
export function useEvents(): AppEvent[] {
  const all = useSyncExternalStore(subscribe, api.events);
  return [...all].sort(byDateTime);
}
