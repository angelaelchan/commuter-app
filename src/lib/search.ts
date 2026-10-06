import { api } from '../data/api';
import type { AppEvent, ForumPost } from '../data/types';
import { dayShort, longDate, monthDay } from './time';

/** Case-insensitive match on an event's title, place, attendees and date ("oct 10", "sat", "saturday"). */
export function eventMatches(event: AppEvent, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const people = event.attendeeIds.map((id) => api.person(id)?.name ?? '').join(' ');
  const haystack = [event.title, event.place, people, monthDay(event.date), dayShort(event.date), longDate(event.date)]
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

/** Match a discussion on its title, preview, tag, author and course. */
export function postMatches(post: ForumPost, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const course = api.course(post.courseId);
  const haystack = [post.title, post.preview, post.tag, api.person(post.authorId)?.name, course?.code, course?.name]
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}
