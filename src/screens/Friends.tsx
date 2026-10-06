import { useApp } from '../app/state';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { EventCard } from '../components/EventCard';
import { Empty, inactive, Screen, SectionHeader } from '../components/Screen';
import { SearchField } from '../components/SearchField';
import { Toast } from '../components/Toast';
import { ViewToggle } from '../components/ViewToggle';
import { WeekCalendar, type CalendarBlock } from '../components/WeekCalendar';
import { api, useEvents } from '../data/api';
import type { Friend } from '../data/types';
import { friendBusy } from '../lib/availability';
import { eventMatches } from '../lib/search';
import { addDays, mondayOf, shortClock } from '../lib/time';

/** "On campus until 6 PM · free now" — derived from today's schedule and the fixed "now". */
function campusStatus(friend: Friend) {
  const today = api.today();
  const now = api.nowMinutes();
  const current = friendBusy(friend.id, today).find((b) => b.start <= now && b.end > now);
  const status = current ? `busy until ${shortClock(current.end)}` : 'free now';
  return `On campus until ${shortClock(friend.onCampusToday!.until)} · ${status}`;
}

export function Friends() {
  const { friendsView, setFriendsView, friendsQuery, setFriendsQuery, startHangout, toast, setToast, navigate } = useApp();
  const q = friendsQuery.trim().toLowerCase();
  const allEvents = useEvents();
  const today = api.today();

  const friendEvents = allEvents.filter((e) => e.date >= today);
  const events = friendEvents.filter((e) => eventMatches(e, friendsQuery));
  const onCampus = api.friends().filter((f) => f.onCampusToday && (!q || f.name.toLowerCase().includes(q)));

  const monday = mondayOf(today);
  const columns = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  const classBlocks: CalendarBlock[] = api.courses(api.currentQuarter()).flatMap((c) =>
    c.meetings
      .filter((m) => m.day < 5)
      .map((m) => ({
        id: `${c.id}-${m.day}`,
        date: columns[m.day],
        start: m.start,
        end: m.end,
        label: c.code,
        kind: 'class' as const,
        onClick: () => navigate({ name: 'class', courseId: c.id, tab: 'forum' }),
      })),
  );
  // Hangouts are shown but not tappable.
  const hangoutBlocks: CalendarBlock[] = events
    .filter((e) => columns.includes(e.date))
    .map((e) => ({ id: e.id, date: e.date, start: e.start, end: e.end, label: e.title, kind: 'hangout' }));

  const undo = () => {
    if (toast) api.removeEvent(toast.eventId);
    setToast(null);
  };

  return (
    <Screen
      nav="friends"
      tall
      header={
        <div className="stack stack--20">
          <h1 className="display-regular">Friends</h1>
          <div className="toolbar">
            <SearchField value={friendsQuery} onChange={setFriendsQuery} label="Search friends and events" />
            <ViewToggle value={friendsView} onChange={setFriendsView} />
          </div>
        </div>
      }
      overlay={toast && <Toast message={toast.message} onUndo={undo} onClose={() => setToast(null)} />}
    >
      <section className="stack stack--20">
        <SectionHeader
          title="Upcoming events"
          action={
            // Full event list: no wireframe yet.
            <button type="button" className="link clickables-s" onClick={inactive}>
              See all
            </button>
          }
        />
        {friendsView === 'list' ? (
          <div className="list">
            {events.length ? events.map((e) => <EventCard key={e.id} event={e} meta="friends" />) : <Empty>No events match “{friendsQuery}”.</Empty>}
          </div>
        ) : (
          <WeekCalendar label="This week: classes and hangouts" columns={columns} today={today} blocks={[...classBlocks, ...hangoutBlocks]} />
        )}
      </section>

      <div className="actions">
        <Button onClick={() => startHangout()}>Create event</Button>
      </div>

      {friendsView === 'list' && (
        <section className="stack stack--20 section">
          <SectionHeader title="On campus today" />
          <div className="list">
            {onCampus.length ? (
              onCampus.map((f) => (
                <div key={f.id} className="friend-row">
                  <Avatar name={f.name} size="l" />
                  <span className="friend-row__text">
                    <span className="title-s">{f.name}</span>
                    <span className="body-xs">{campusStatus(f)}</span>
                  </span>
                  <Button onClick={() => startHangout(f.id)} aria-label={`Invite ${f.name}`}>
                    Invite
                  </Button>
                </div>
              ))
            ) : (
              <Empty>No friends on campus match “{friendsQuery}”.</Empty>
            )}
          </div>
        </section>
      )}
    </Screen>
  );
}
