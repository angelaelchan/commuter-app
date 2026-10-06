import type {
  AppEvent,
  ChatThread,
  Course,
  ForumPost,
  Friend,
  Person,
  Place,
  WeeklyBlock,
  Weekday,
} from './types';

/** The prototype's fixed "today": Tuesday, October 6, 2026. */
export const TODAY = '2026-10-06';
/** The prototype's fixed "now" on that day: 11:15 AM. */
export const NOW_MINUTES = 11 * 60 + 15;

export const STUDENT: Person = { id: 'audrey', name: 'Audrey' };

const t = (h: number, m = 0) => h * 60 + m;
const MON = 0, TUE = 1, WED = 2, THU = 3, FRI = 4, SAT = 5, SUN = 6;
const MWF: Weekday[] = [MON, WED, FRI];
const TUTH: Weekday[] = [TUE, THU];
const WEEKDAYS: Weekday[] = [MON, TUE, WED, THU, FRI];
const WEEKEND: Weekday[] = [SAT, SUN];

/** Repeat one block on several days. */
const on = (days: Weekday[], start: number, end: number): WeeklyBlock[] =>
  days.map((day) => ({ day, start, end }));

// ---------------------------------------------------------------------------
// Audrey's classes (Fall read off the calendar screenshot in the wireframes)
// ---------------------------------------------------------------------------
export const courses: Course[] = [
  { id: 'math20c', code: 'MATH 20C', name: 'Calculus and Analytic Geometry', quarter: 'fall', meetings: on(MWF, t(9), t(9, 50)) },
  { id: 'wcwp10b', code: 'WCWP 10B', name: 'The Craft of Writing', quarter: 'fall', meetings: on(TUTH, t(9, 30), t(10, 50)) },
  { id: 'cse110', code: 'CSE 110', name: 'Software Engineering', quarter: 'fall', meetings: on(MWF, t(11), t(11, 50)) },
  { id: 'cogs108', code: 'COGS 108', name: 'Data Science in Practice', quarter: 'fall', meetings: on(TUTH, t(14), t(15, 20)) },

  { id: 'cse100', code: 'CSE 100', name: 'Advanced Data Structures', quarter: 'winter', meetings: on(MWF, t(10), t(10, 50)) },
  { id: 'bimm100', code: 'BIMM 100', name: 'Molecular Biology', quarter: 'winter', meetings: on(TUTH, t(12, 30), t(13, 50)) },
  { id: 'math18', code: 'MATH 18', name: 'Linear Algebra', quarter: 'winter', meetings: on(MWF, t(13), t(13, 50)) },
];

export const CURRENT_QUARTER = 'fall' as const;

// ---------------------------------------------------------------------------
// Friends with weekly busy time. Availability is computed from these.
// Maya, Peter and Lily share Wed 12–1 PM with Audrey; Sam never overlaps.
// ---------------------------------------------------------------------------
export const friends: Friend[] = [
  {
    id: 'maya', name: 'Maya',
    busy: [
      ...on([MON], t(10), t(11)), ...on([MON], t(14), t(17)),
      ...on([TUE], t(9), t(11)), ...on([TUE], t(13), t(17)),
      ...on([WED], t(10), t(11, 50)), ...on([WED], t(13), t(17)),
      ...on([THU], t(9), t(12)), ...on([THU], t(14), t(17)),
      ...on([FRI], t(10), t(12)), ...on([FRI], t(14), t(17)),
      ...on(WEEKEND, t(9), t(17)),
    ],
    onCampusToday: { from: t(9), until: t(18) },
  },
  {
    id: 'peter', name: 'Peter',
    busy: [
      ...on([MON, TUE, THU], t(9), t(17)),
      ...on([WED], t(9), t(11)), ...on([WED], t(13), t(17)),
      ...on([FRI], t(9), t(12)), ...on([FRI], t(15), t(17)),
      ...on([SAT], t(9), t(13)),
    ],
  },
  {
    id: 'lily', name: 'Lily',
    busy: [
      ...on([MON], t(9), t(12)), ...on([MON], t(13), t(17)),
      ...on([TUE], t(9), t(11, 30)), ...on([TUE], t(15), t(17)),
      ...on([WED], t(9), t(11, 30)), ...on([WED], t(13), t(17)),
      ...on([THU], t(9), t(17)),
      ...on([FRI], t(9), t(14)), ...on([FRI], t(15), t(17)),
      ...on([SAT], t(9), t(15)), ...on([SUN], t(9), t(17)),
    ],
    onCampusToday: { from: t(9), until: t(15) },
  },
  {
    // Free only while Audrey is in class.
    id: 'sam', name: 'Sam',
    busy: [
      ...on(MWF, t(10), t(11)), ...on(MWF, t(12), t(17)),
      ...on(TUTH, t(9), t(9, 30)), ...on(TUTH, t(11), t(14)), ...on(TUTH, t(15, 30), t(17)),
      ...on(WEEKEND, t(9), t(17)),
    ],
  },
  {
    id: 'jordan', name: 'Jordan',
    busy: [
      ...on([MON, WED, FRI], t(9), t(17)),
      ...on([TUE], t(9), t(11)), ...on([TUE], t(12), t(16)),
      ...on([THU], t(9), t(15)),
      ...on(WEEKEND, t(9), t(17)),
    ],
    onCampusToday: { from: t(10), until: t(16) },
  },
  { id: 'kyle', name: 'Kyle', busy: [...on(MWF, t(9), t(17)), ...on(TUTH, t(9), t(12)), ...on(TUTH, t(13), t(17)), ...on(WEEKEND, t(9), t(17))] },
  { id: 'mia', name: 'Mia', busy: [...on([MON, TUE, WED, THU], t(9), t(17)), ...on([FRI], t(9), t(15)), ...on(WEEKEND, t(9), t(17))] },
  { id: 'daniel', name: 'Daniel', busy: [...on(WEEKDAYS, t(9), t(16, 30)), ...on(WEEKEND, t(9), t(17))] },
  { id: 'sophie', name: 'Sophie', busy: [...on([MON, TUE, THU, FRI], t(9), t(17)), ...on([WED], t(9), t(15)), ...on([WED], t(16), t(17)), ...on(WEEKEND, t(9), t(17))] },
  { id: 'julia', name: 'Julia', busy: [...on([MON, WED, THU, FRI], t(9), t(17)), ...on([TUE], t(9), t(15, 30)), ...on([TUE], t(16, 30), t(17)), ...on(WEEKEND, t(9), t(17))] },
  { id: 'liam', name: 'Liam', busy: [...on(MWF, t(9), t(17)), ...on(TUTH, t(9), t(9, 30)), ...on(TUTH, t(11), t(17)), ...on(WEEKEND, t(9), t(17))] },
  { id: 'zoe', name: 'Zoe', busy: [...on([MON, TUE, THU], t(9), t(17)), ...on([WED, FRI], t(9), t(14, 30)), ...on([WED, FRI], t(15, 30), t(17)), ...on(WEEKEND, t(9), t(17))] },
  { id: 'ava', name: 'Ava', busy: [...on([MON, TUE, THU], t(9), t(12)), ...on([MON, TUE, THU], t(13), t(17)), ...on([WED, FRI], t(9), t(17)), ...on(WEEKEND, t(9), t(17))] },
  { id: 'ethan', name: 'Ethan', busy: [...on([MON, TUE, WED, FRI], t(9), t(17)), ...on([THU], t(9), t(16)), ...on(WEEKEND, t(9), t(17))] },
  { id: 'chloe', name: 'Chloe', busy: [...on([MON, TUE, WED, THU], t(9), t(17)), ...on([FRI], t(9), t(10)), ...on([FRI], t(11), t(17)), ...on(WEEKEND, t(9), t(17))] },
  { id: 'max', name: 'Max', busy: [...on(MWF, t(9), t(17)), ...on(TUTH, t(9), t(14)), ...on(TUTH, t(15), t(17)), ...on(WEEKEND, t(9), t(17))] },
  { id: 'ryan', name: 'Ryan', busy: [...on([MON, TUE, WED, THU], t(9), t(17)), ...on([FRI], t(9), t(16)), ...on(WEEKEND, t(9), t(17))] },
];

// ---------------------------------------------------------------------------
// Upcoming events
// ---------------------------------------------------------------------------
export const events: AppEvent[] = [
  { id: 'coffee', title: 'Coffee Catch-up', date: '2026-10-10', start: t(16), end: t(18), place: 'Central Cafe', attendeeIds: ['liam', 'zoe', 'ava'] },
  { id: 'movie', title: 'Movie Night', date: '2026-10-20', start: t(19, 30), end: t(22), place: "Mia's Place", attendeeIds: ['ethan', 'chloe', 'max'] },
  { id: 'picnic', title: 'Beach Picnic', date: '2026-10-25', start: t(12), end: t(15), place: 'Sunny Shore Park', attendeeIds: ['sophie', 'ryan'] },
];

// ---------------------------------------------------------------------------
// Candidate hangout places. Coordinates from OpenStreetMap (Nominatim).
// ---------------------------------------------------------------------------
export const places: Place[] = [
  { id: 'price-center', name: 'Price Center', lat: 32.8796593, lng: -117.2361707, campus: 'on' },
  { id: 'geisel', name: 'Geisel Library', lat: 32.8811393, lng: -117.2375798, campus: 'on' },
  { id: 'wongavery', name: 'WongAvery Library', lat: 32.8750967, lng: -117.2369844, campus: 'on' },
  { id: 'sun-god-lawn', name: 'Sun God Lawn', lat: 32.8786514, lng: -117.240127, campus: 'on' },
  { id: 'rimac', name: 'RIMAC Arena', lat: 32.885306, lng: -117.2395148, campus: 'on' },
  { id: 'utc', name: 'Westfield UTC', lat: 32.8712523, lng: -117.2116325, campus: 'off' },
  { id: 'lj-shores', name: 'La Jolla Shores Park', lat: 32.858106, lng: -117.2568032, campus: 'off' },
  { id: 'scripps-pier', name: 'Scripps Pier', lat: 32.8666163, lng: -117.2557746, campus: 'off' },
  { id: 'gliderport', name: 'Torrey Pines Gliderport', lat: 32.8899397, lng: -117.2470837, campus: 'off' },
];

/** Map center: UC San Diego campus (Library Walk). */
export const CAMPUS_CENTER: [number, number] = [32.8786989, -117.2375498];

// ---------------------------------------------------------------------------
// Classmates, forum posts and private chats
// ---------------------------------------------------------------------------
export const classmates: Person[] = [
  { id: 'maya-r', name: 'Maya R' },
  { id: 'kevin-t', name: 'Kevin T' },
  { id: 'priya-s', name: 'Priya S' },
  { id: 'marcus-l', name: 'Marcus L' },
  { id: 'hannah-k', name: 'Hannah K' },
  { id: 'diego-m', name: 'Diego M' },
  { id: 'grace-w', name: 'Grace W' },
];

export const forumPosts: ForumPost[] = [
  { id: 'p1', courseId: 'cse110', authorId: 'maya-r', minutesAgo: 20, tag: 'Homework', title: 'Anyone know how to answer Q3 on HW 2?', preview: 'I’ve been stuck on this question for soooo long and I can’t figure out what the test is expecting.', replies: 4, answered: false },
  { id: 'p2', courseId: 'cse110', authorId: 'kevin-t', minutesAgo: 95, tag: 'Project', title: 'Looking for 2 more people for the team project', preview: 'We have three people so far and want to build a study-planner app. We usually meet after lecture.', replies: 7, answered: true },
  { id: 'p3', courseId: 'cse110', authorId: 'priya-s', minutesAgo: 240, tag: 'Exam', title: 'Is the midterm open note?', preview: 'The syllabus says one cheat sheet but the slides from week 1 say open note. Which one is it?', replies: 2, answered: true },
  { id: 'p4', courseId: 'cse110', authorId: 'marcus-l', minutesAgo: 1440, tag: 'Study group', title: 'Library study group before the quiz', preview: 'A few of us are going to Geisel 2nd floor on Thursday at noon. Commuters welcome, there are outlets.', replies: 5, answered: false },

  { id: 'p5', courseId: 'math20c', authorId: 'hannah-k', minutesAgo: 45, tag: 'Homework', title: 'Double integrals in polar — limits?', preview: 'For 15.3 #22, do the bounds for theta go from 0 to pi or 0 to pi/2?', replies: 3, answered: true },
  { id: 'p6', courseId: 'math20c', authorId: 'diego-m', minutesAgo: 600, tag: 'Exam', title: 'Practice midterm solutions posted?', preview: 'Has anyone found the solutions for the practice midterm on Canvas yet?', replies: 1, answered: false },

  { id: 'p7', courseId: 'wcwp10b', authorId: 'grace-w', minutesAgo: 30, tag: 'Essay', title: 'Peer review partners for draft 1', preview: 'Anyone want to swap drafts before Thursday? I can read yours tonight.', replies: 6, answered: false },
  { id: 'p8', courseId: 'wcwp10b', authorId: 'priya-s', minutesAgo: 300, tag: 'Question', title: 'How long should the annotated bibliography be?', preview: 'The prompt says “at least five sources” but no word count. Is a paragraph each enough?', replies: 2, answered: true },

  { id: 'p9', courseId: 'cogs108', authorId: 'kevin-t', minutesAgo: 75, tag: 'Project', title: 'Dataset ideas about commuting in San Diego?', preview: 'Our group wants to use MTS trolley ridership data. Has anyone found a clean source?', replies: 4, answered: false },
  { id: 'p10', courseId: 'cogs108', authorId: 'hannah-k', minutesAgo: 900, tag: 'Homework', title: 'pandas merge keeps dropping rows', preview: 'I’m doing an inner join on the zip code column and losing half the data. What am I missing?', replies: 3, answered: true },
];

export const chats: ChatThread[] = [
  { id: 'c1', courseId: 'cse110', personId: 'maya-r', time: t(9, 33), lastMessage: 'I’ve been stuck on this question for soooo long and I can’t get the test to pass.', unread: true },
  { id: 'c2', courseId: 'cse110', personId: 'kevin-t', time: t(8, 50), lastMessage: 'Can you push your branch before standup? I’ll review it on the trolley.', unread: true },
  { id: 'c3', courseId: 'cse110', personId: 'priya-s', time: t(7, 12), lastMessage: 'Thanks for the notes from Monday! Want to grab lunch after class?', unread: true },
  { id: 'c4', courseId: 'cse110', personId: 'marcus-l', time: t(18, 40) - 24 * 60, lastMessage: 'See you at Geisel on Thursday 👍', unread: false },

  { id: 'c5', courseId: 'math20c', personId: 'hannah-k', time: t(10, 2), lastMessage: 'Do you have the worksheet from discussion section?', unread: false },
  { id: 'c6', courseId: 'wcwp10b', personId: 'grace-w', time: t(9, 15), lastMessage: 'Sent you my draft — be honest lol', unread: true },
  { id: 'c7', courseId: 'wcwp10b', personId: 'diego-m', time: t(8, 1), lastMessage: 'Are we meeting before or after class?', unread: true },
  { id: 'c8', courseId: 'cogs108', personId: 'kevin-t', time: t(11, 5), lastMessage: 'I found a ridership CSV, uploading it to the drive now.', unread: true },
];
