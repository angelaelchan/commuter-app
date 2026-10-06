/** Minutes after midnight, e.g. 9:30 AM = 570. */
export type Minutes = number;

/** 0 = Monday … 6 = Sunday */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** ISO calendar date, YYYY-MM-DD */
export type ISODate = string;

export interface WeeklyBlock {
  day: Weekday;
  start: Minutes;
  end: Minutes;
}

export type Quarter = 'fall' | 'winter';

export interface Course {
  id: string;
  code: string; // "CSE 110"
  name: string; // "Software Engineering"
  quarter: Quarter;
  meetings: WeeklyBlock[];
}

export interface Person {
  id: string;
  name: string;
}

export interface Friend extends Person {
  /** Recurring busy time: classes, work, commute. Used for availability. */
  busy: WeeklyBlock[];
  /** Hours on campus today, if they are on campus. */
  onCampusToday?: { from: Minutes; until: Minutes };
}

export interface AppEvent {
  id: string;
  title: string;
  date: ISODate;
  start: Minutes;
  end: Minutes;
  place: string;
  placeId?: string;
  attendeeIds: string[];
}

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  campus: 'on' | 'off';
}

export interface ForumPost {
  id: string;
  courseId: string;
  authorId: string;
  minutesAgo: number;
  tag: string;
  title: string;
  preview: string;
  replies: number;
  answered: boolean;
}

export interface ChatThread {
  id: string;
  courseId: string;
  personId: string;
  time: Minutes;
  lastMessage: string;
  unread: boolean;
}
