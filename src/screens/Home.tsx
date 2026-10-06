import { useApp } from '../app/state';
import { Button } from '../components/Button';
import { EventCard } from '../components/EventCard';
import { Icon } from '../components/Icon';
import { Empty, inactive, Screen } from '../components/Screen';
import { SearchField } from '../components/SearchField';
import { api, useEvents } from '../data/api';

export function Home() {
  const { startHangout } = useApp();
  const events = useEvents().filter((e) => e.date >= api.today());

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
      {/* Search on Home: no wireframe yet. */}
      <SearchField inactive label="Search events" />

      <div className="list list--section">
        {events.length ? events.map((e) => <EventCard key={e.id} event={e} meta="home" />) : <Empty>No upcoming events.</Empty>}
      </div>

      <div className="actions">
        <Button onClick={() => startHangout()}>Create event</Button>
      </div>
    </Screen>
  );
}
