import { api } from '../data/api';
import type { AppEvent } from '../data/types';
import { dayShort, dayOfMonth, monthShort, rangeClock, rangeShort } from '../lib/time';
import { AvatarStack } from './Avatar';
import { inactive } from './Screen';

/** Upcoming event card with a date tile. Home uses the weekday + time meta line, Friends adds the place. */
export function EventCard({ event, meta }: { event: AppEvent; meta: 'home' | 'friends' }) {
  const names = event.attendeeIds.map((id) => api.person(id)?.name ?? id);
  const people = names.join(', ');
  const line =
    meta === 'home'
      ? `${dayShort(event.date)}, ${rangeShort(event.start, event.end)}`
      : `${rangeClock(event.start, event.end)} · ${event.place}`;
  return (
    // Event Thumbnail component: grows on hover/press. Event detail has no wireframe yet, so tapping does nothing.
    <article className="card thumbnail event-card" onClick={inactive}>
      <div className="tile title-s" aria-label={`${monthShort(event.date)} ${dayOfMonth(event.date)}`}>
        <span>{monthShort(event.date)}</span>
        <span>{dayOfMonth(event.date)}</span>
      </div>
      <div className="event-card__body">
        <div className="event-card__text">
          <h3 className="title-s">{event.title}</h3>
          <p className="body-xs meta">{line}</p>
        </div>
        <div className="event-card__people">
          <AvatarStack names={names} />
          <span className="body-xs meta">{people}</span>
        </div>
      </div>
    </article>
  );
}
