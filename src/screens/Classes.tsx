import { useApp } from '../app/state';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Empty, inactive, Screen } from '../components/Screen';
import { SearchField } from '../components/SearchField';
import { Tabs } from '../components/Tabs';
import { ViewToggle } from '../components/ViewToggle';
import { WeekCalendar, type CalendarBlock } from '../components/WeekCalendar';
import { api } from '../data/api';
import type { Course, Quarter } from '../data/types';
import { addDays, mondayOf, rangeCompact, shortClock, DAY_SHORT } from '../lib/time';

const QUARTERS: { id: Quarter; label: string }[] = [
  { id: 'fall', label: 'Fall Quarter' },
  { id: 'winter', label: 'Winter Quarter' },
];

const DAY_LETTER = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];

/** "MWF 11 AM", "TuTh 9:30 AM" */
export function meetingSummary(course: Course) {
  const first = course.meetings[0];
  if (!first) return '';
  const days = [...new Set(course.meetings.map((m) => m.day))].sort().map((d) => DAY_LETTER[d]).join('');
  return `${days} ${shortClock(first.start)}`;
}

export function matchesQuery(course: Course, query: string) {
  const q = query.trim().toLowerCase();
  return !q || `${course.code} ${course.name}`.toLowerCase().includes(q);
}

export function Classes() {
  const { classesView, setClassesView, quarter, setQuarter, classesQuery, setClassesQuery, navigate } = useApp();
  const courses = api.courses(quarter).filter((c) => matchesQuery(c, classesQuery));
  const open = (courseId: string) => navigate({ name: 'class', courseId, tab: 'forum' });

  const today = api.today();
  const monday = mondayOf(today);
  const columns = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  const blocks: CalendarBlock[] = courses.flatMap((c) =>
    c.meetings
      .filter((m) => m.day < 5)
      .map((m) => ({
        id: `${c.id}-${m.day}`,
        date: columns[m.day],
        start: m.start,
        end: m.end,
        label: c.code,
        kind: 'class' as const,
        onClick: () => open(c.id),
      })),
  );

  return (
    <Screen nav="classes" header={<h1 className="display-regular">Classes</h1>}>
      <div className="stack stack--12">
        <Tabs label="Quarter" items={QUARTERS} active={quarter} onChange={setQuarter} />
        <div className="toolbar">
          <SearchField value={classesQuery} onChange={setClassesQuery} label="Search classes" />
          <ViewToggle value={classesView} onChange={setClassesView} />
        </div>
      </div>

      <div className="list--section">
        {classesView === 'list' ? (
          <div className="list">
            {courses.length ? (
              courses.map((c) => {
                const unread = api.unreadChats(c.id);
                const [dept, num] = c.code.split(' ');
                return (
                  <button key={c.id} type="button" className="card thumbnail class-row" onClick={() => open(c.id)}>
                    <span className="tile tile--course title-s">
                      <span>{dept}</span>
                      <span>{num}</span>
                    </span>
                    <span className="class-row__text">
                      <span className="title-s">{c.name}</span>
                      <span className="body-xs meta" aria-label={c.meetings.map((m) => `${DAY_SHORT[m.day]} ${rangeCompact(m.start, m.end)}`).join(', ')}>
                        {meetingSummary(c)}
                      </span>
                    </span>
                    <span className="class-row__end">
                      {unread > 0 && <Badge count={unread} label={`${unread} unread chats`} />}
                      <Icon name="chevronRight" />
                    </span>
                  </button>
                );
              })
            ) : (
              <Empty>No classes match “{classesQuery}”.</Empty>
            )}
          </div>
        ) : courses.length ? (
          <WeekCalendar label={`${quarter} quarter classes`} columns={columns} today={today} blocks={blocks} />
        ) : (
          <Empty>No classes match “{classesQuery}”.</Empty>
        )}
      </div>

      <div className="actions">
        {/* Add a class: no wireframe yet. */}
        <Button onClick={inactive}>Add a class</Button>
      </div>
    </Screen>
  );
}
