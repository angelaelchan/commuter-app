import { useApp } from '../app/state';
import { Button } from '../components/Button';
import { EventCard } from '../components/EventCard';
import { Icon } from '../components/Icon';
import { PostCard } from '../components/PostCard';
import { Empty, inactive, Screen, SectionHeader } from '../components/Screen';
import { SearchField } from '../components/SearchField';
import { api, useEvents } from '../data/api';
import { eventMatches, postMatches } from '../lib/search';
import { addDays } from '../lib/time';

/** Home shows events in the next 7 days, today included. */
const WEEK_DAYS = 7;
/** How many discussions Home lists. */
const DISCUSSIONS = 3;

function SeeAll({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="link clickables-s" aria-label={label} onClick={onClick}>
      See all
    </button>
  );
}

export function Home() {
  const { startHangout, homeQuery, setHomeQuery, navigate, setFriendsView, setFriendsQuery } = useApp();
  const today = api.today();
  const lastDay = addDays(today, WEEK_DAYS - 1);
  const query = homeQuery.trim();
  const events = useEvents().filter((e) => e.date >= today && e.date <= lastDay && eventMatches(e, homeQuery));
  const posts = api.discussionsToReview().filter((p) => postMatches(p, homeQuery)).slice(0, DISCUSSIONS);

  const allEvents = () => {
    setFriendsView('list');
    setFriendsQuery('');
    navigate({ name: 'friends' });
  };

  return (
    <Screen
      nav="home"
      header={
        <div className="header-row">
          <h1 className="display-regular">Welcome back {api.student().name}!</h1>
          {/* Notifications: no wireframe yet. */}
          <button type="button" className="bell" aria-label="Notifications" onClick={inactive}>
            <Icon name="bell" />
          </button>
        </div>
      }
    >
      <SearchField value={homeQuery} onChange={setHomeQuery} label="Search events and discussions" />

      <section className="stack stack--20 list--section">
        <SectionHeader title="This week" action={<SeeAll label="See all upcoming events" onClick={allEvents} />} />
        <div className="list">
          {events.length ? (
            events.map((e) => <EventCard key={e.id} event={e} meta="home" />)
          ) : (
            <Empty>{query ? `No events this week match “${query}”.` : 'Nothing planned for the next 7 days.'}</Empty>
          )}
        </div>
      </section>

      <div className="actions">
        <Button onClick={() => startHangout()}>Create event</Button>
      </div>

      <section className="stack stack--20 section">
        <SectionHeader
          title="Discussions to review"
          action={<SeeAll label="See all classes" onClick={() => navigate({ name: 'classes' })} />}
        />
        <div className="list">
          {posts.length ? (
            posts.map((p) => (
              <PostCard key={p.id} post={p} showCourse onOpen={() => navigate({ name: 'class', courseId: p.courseId, tab: 'forum' })} />
            ))
          ) : (
            <Empty>{query ? `No discussions match “${query}”.` : 'You’re all caught up.'}</Empty>
          )}
        </div>
      </section>
    </Screen>
  );
}
