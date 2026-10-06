import { useMemo, type ReactNode } from 'react';
import { HANGOUT_STEPS, useApp, type HangoutDraft, type HangoutStep } from '../app/state';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { PlaceMap } from '../components/PlaceMap';
import { Empty, inactive, Screen, SectionHeader } from '../components/Screen';
import { Tabs } from '../components/Tabs';
import { AvailabilityLegend, WeekCalendar, type CalendarBlock } from '../components/WeekCalendar';
import { api } from '../data/api';
import { bestSlot, dateRange, findSlots, overlapWith, sameSlot, studentBusy, WINDOW, type DateChoice, type Overlap } from '../lib/availability';
import { dayShort, hoursLabel, longDate, monthDay, rangeCompact, shortClock, DAY_SHORT, weekday } from '../lib/time';

const DATE_CHOICES: { id: DateChoice; label: string; phrase: string }[] = [
  { id: 'today', label: 'Today', phrase: 'today' },
  { id: 'this-week', label: 'This week', phrase: 'this week' },
  { id: 'next-week', label: 'Next week', phrase: 'next week' },
];
const DURATIONS = [
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 hr' },
  { minutes: 90, label: '1.5 hr' },
  { minutes: 120, label: '2 hr' },
];

/** Everything derived from the draft that more than one step needs. */
function useDerived(draft: HangoutDraft) {
  return useMemo(() => {
    const range = dateRange(draft.dateChoice);
    const slots = findSlots(range.dates, draft.duration, draft.invited);
    const places = api.places(draft.campus);
    const place = places.find((p) => p.id === draft.placeId);
    const slotValid = !!draft.slot && slots.some((s) => sameSlot(s, draft.slot));
    const valid = [draft.name.trim().length > 0, draft.invited.length > 0, slotValid, !!place, true];
    return { range, slots, places, place, valid };
  }, [draft]);
}

export function Hangout({ step }: { step: HangoutStep }) {
  const { draft, navigate } = useApp();
  const derived = useDerived(draft);
  const reachable = (i: number) => derived.valid.slice(0, i).every(Boolean);
  const go = (s: HangoutStep) => reachable(s) && navigate({ name: 'hangout', step: s });

  const header = (
    <div className="stack stack--20">
      <h1 className="display-regular">Schedule a hangout</h1>
      <Tabs
        label="Steps"
        spread
        items={HANGOUT_STEPS.map((label, i) => ({ id: String(i), label, disabled: i !== step && !reachable(i) }))}
        active={String(step)}
        onChange={(id) => go(Number(id) as HangoutStep)}
      />
    </div>
  );

  if (step === 3) return <PlaceStep header={header} derived={derived} onNext={() => go(4)} />;

  return (
    <Screen nav="friends" tall header={header}>
      {step === 0 && <DetailsStep valid={derived.valid[0]} onNext={() => go(1)} />}
      {step === 1 && <InviteStep derived={derived} onNext={() => go(2)} />}
      {step === 2 && <TimeStep derived={derived} onNext={() => go(3)} />}
      {step === 4 && <ConfirmStep derived={derived} />}
    </Screen>
  );
}

type Derived = ReturnType<typeof useDerived>;

// ---------------------------------------------------------------------------
// 1. Details
// ---------------------------------------------------------------------------
function DetailsStep({ valid, onNext }: { valid: boolean; onNext: () => void }) {
  const { draft, updateDraft } = useApp();
  return (
    <>
      <div className="stack stack--32">
        <label className="field">
          <span className="title-l">Event name</span>
          <input
            className="text-field body-regular"
            value={draft.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
            placeholder="e.g. Study session"
            autoFocus
          />
        </label>
        <ChipGroup label="Approximate date">
          {DATE_CHOICES.map((c) => (
            <Chip key={c.id} selected={draft.dateChoice === c.id} onClick={() => updateDraft({ dateChoice: c.id, slot: undefined })}>
              {c.label}
            </Chip>
          ))}
          {/* Date picker: no wireframe yet. */}
          <Chip onClick={inactive}>Pick specific date</Chip>
        </ChipGroup>
        <ChipGroup label="Duration">
          {DURATIONS.map((d) => (
            <Chip key={d.minutes} selected={draft.duration === d.minutes} onClick={() => updateDraft({ duration: d.minutes, slot: undefined })}>
              {d.label}
            </Chip>
          ))}
        </ChipGroup>
        <ChipGroup label="Location">
          {(['on', 'off'] as const).map((c) => (
            <Chip key={c} selected={draft.campus === c} onClick={() => updateDraft({ campus: c, placeId: c === draft.campus ? draft.placeId : undefined })}>
              {c === 'on' ? 'On campus' : 'Off campus'}
            </Chip>
          ))}
        </ChipGroup>
      </div>
      <div className="actions actions--block">
        <Button block disabled={!valid} onClick={onNext}>
          Next: Invite friends
        </Button>
      </div>
    </>
  );
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field" role="group" aria-label={label}>
      <span className="title-l">{label}</span>
      <div className="chip-row chip-row--wrap">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Invite
// ---------------------------------------------------------------------------
function InviteStep({ derived, onNext }: { derived: Derived; onNext: () => void }) {
  const { draft, updateDraft } = useApp();
  const phrase = DATE_CHOICES.find((c) => c.id === draft.dateChoice)!.phrase;

  const ranked = useMemo(
    () =>
      api
        .friends()
        .map((f) => ({ friend: f, overlap: overlapWith(f.id, derived.range.dates) }))
        .sort((a, b) => b.overlap.minutes - a.overlap.minutes || a.friend.name.localeCompare(b.friend.name)),
    [derived.range],
  );
  const overlapping = ranked.filter((r) => r.overlap.minutes > 0);
  const none = ranked.filter((r) => r.overlap.minutes === 0);

  const toggle = (id: string) => {
    const invited = draft.invited.includes(id) ? draft.invited.filter((x) => x !== id) : [...draft.invited, id];
    updateDraft({ invited, inviteHistory: [...draft.inviteHistory, draft.invited] });
  };
  const undo = () => {
    const previous = draft.inviteHistory[draft.inviteHistory.length - 1];
    if (previous) updateDraft({ invited: previous, inviteHistory: draft.inviteHistory.slice(0, -1) });
  };
  const n = draft.invited.length;

  return (
    <>
      <p className="selected-count title-s" aria-live="polite">
        {n} {n === 1 ? 'friend' : 'friends'} selected
        {draft.inviteHistory.length > 0 && (
          <button type="button" className="link title-s" onClick={undo}>
            Undo
          </button>
        )}
      </p>

      <section className="stack stack--20 section--first">
        <SectionHeader title={`Most overlap ${phrase}`} />
        <div className="list">
          {overlapping.length ? (
            overlapping.map(({ friend, overlap }) => (
              <InviteCard key={friend.id} name={friend.name} added={draft.invited.includes(friend.id)} onToggle={() => toggle(friend.id)}>
                <DayChips columns={derived.range.columns} available={derived.range.dates} overlap={overlap} />
                <p className="body-xs">{hoursLabel(overlap.minutes)} free</p>
              </InviteCard>
            ))
          ) : (
            <Empty>No friends share free time with you {phrase}.</Empty>
          )}
        </div>
      </section>

      {none.length > 0 && (
        <section className="stack stack--20 section">
          <SectionHeader title="No overlap" />
          <div className="list">
            {none.map(({ friend, overlap }) => (
              <InviteCard key={friend.id} name={friend.name} added={draft.invited.includes(friend.id)} onToggle={() => toggle(friend.id)} anyway>
                <p className="body-xs">{overlap.freeOnlyWhenBusy ? 'Only free when you’re occupied' : `No free time ${phrase}`}</p>
              </InviteCard>
            ))}
          </div>
        </section>
      )}

      <div className="actions actions--block">
        <Button block disabled={n === 0} onClick={onNext}>
          Next: Find a time
        </Button>
      </div>
    </>
  );
}

function InviteCard(props: { name: string; added: boolean; anyway?: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <article className="card invite-card">
      <div className="invite-card__head">
        <span className="invite-card__who">
          <Avatar name={props.name} size="l" />
          <span className="title-regular">{props.name}</span>
        </span>
        <Button
          className={props.added ? '' : 'button--outline'}
          icon={props.added ? 'check' : undefined}
          aria-pressed={props.added}
          aria-label={`${props.added ? 'Remove' : 'Add'} ${props.name}`}
          onClick={props.onToggle}
        >
          {props.added ? 'Added' : props.anyway ? '+ Add anyway' : '+ Add'}
        </Button>
      </div>
      <div className="stack stack--8">{props.children}</div>
    </article>
  );
}

function DayChips({ columns, available, overlap }: { columns: string[]; available: string[]; overlap: Overlap }) {
  return (
    <div className="chip-row" aria-label="Days you are both free">
      {columns.map((date) => {
        const on = overlap.days.includes(date);
        const off = !available.includes(date);
        const state = off ? ': unavailable' : on ? ': free together' : '';
        return (
          <span
            key={date}
            className={`chip chip--day specials-label ${on ? 'chip--selected' : ''} ${off ? 'chip--disabled' : ''}`}
            aria-label={`${DAY_SHORT[weekday(date)]}${state}`}
          >
            {dayShort(date)}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Time
// ---------------------------------------------------------------------------
function TimeStep({ derived, onNext }: { derived: Derived; onNext: () => void }) {
  const { draft, updateDraft } = useApp();
  const { range, slots } = derived;
  const best = bestSlot(slots);
  const selected = slots.find((s) => sameSlot(s, draft.slot));

  // The student's classes (and existing plans) pre-filled as busy, clipped to the hangout window.
  const busy: CalendarBlock[] = range.columns.flatMap((date) =>
    studentBusy(date)
      .filter((b) => b.end > WINDOW.start && b.start < WINDOW.end)
      .map((b, i) => ({
      id: `${date}-${i}`,
      date,
      start: Math.max(b.start, WINDOW.start),
      end: Math.min(b.end, WINDOW.end),
      // Classes show their course code; existing plans just read "Busy".
      label: api.courses(api.currentQuarter()).find((c) => c.meetings.some((m) => m.day === weekday(date) && m.start === b.start))?.code ?? 'Busy',
      kind: 'busy',
    })),
  );

  return (
    <>
      <div className="stack stack--32">
        <SectionHeader title="Find a time" />
        <div className="card banner">
          {best ? (
            <>
              <p className="body-s">
                <span className="emphasis">Best time:</span> {dayShort(best.date)} {rangeCompact(best.start, best.end)}
              </p>
              <Button onClick={() => updateDraft({ slot: best })}>Select time</Button>
            </>
          ) : (
            <p className="body-s">No shared free time. Try another date or duration.</p>
          )}
        </div>
        <div className="stack stack--12">
          <WeekCalendar
            label="Group availability"
            columns={range.columns}
            today={api.today()}
            blocks={busy}
            slots={slots}
            selectedSlot={selected}
            onSelectSlot={(slot) => updateDraft({ slot })}
            disabledDates={range.columns.filter((d) => !range.dates.includes(d))}
            minRange={WINDOW}
          />
          <AvailabilityLegend total={draft.invited.length + 1} />
          {selected && (
            <p className="body-s" aria-live="polite">
              <span className="emphasis">Selected:</span> {longDate(selected.date)} · {rangeCompact(selected.start, selected.end)}
            </p>
          )}
        </div>
      </div>
      <div className="actions actions--block">
        <Button block disabled={!derived.valid[2]} onClick={onNext}>
          Next: Set location
        </Button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4. Place
// ---------------------------------------------------------------------------
function PlaceStep({ header, derived, onNext }: { header: ReactNode; derived: Derived; onNext: () => void }) {
  const { draft, updateDraft } = useApp();
  return (
    <Screen nav="friends" tall bleed header={header}>
      <div className="place-step">
        <PlaceMap
          places={derived.places}
          selectedId={draft.placeId}
          onSelect={(placeId) => updateDraft({ placeId })}
          fallbackCenter={api.campusCenter()}
        />
        <div className="place-bar">
          <p className="body-s">
            <span className="emphasis">Location:</span> {derived.place?.name ?? 'Tap a pin'}
          </p>
          <Button disabled={!derived.place} onClick={onNext}>
            Select location
          </Button>
        </div>
      </div>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// 5. Confirm
// ---------------------------------------------------------------------------
function ConfirmStep({ derived }: { derived: Derived }) {
  const { draft, navigate, setToast, setFriendsView } = useApp();
  const { slot } = draft;
  const place = derived.place;
  if (!slot || !place) return null;

  const confirm = () => {
    const id = `hangout-${Date.now()}`;
    api.addEvent({
      id,
      title: draft.name.trim(),
      date: slot.date,
      start: slot.start,
      end: slot.end,
      place: place.name,
      placeId: place.id,
      attendeeIds: draft.invited,
    });
    setToast({ eventId: id, message: `Event scheduled for ${monthDay(slot.date)} at ${shortClock(slot.start)}!` });
    setFriendsView('list');
    navigate({ name: 'friends' });
  };

  return (
    <>
      <div className="stack stack--32">
        <div className="field">
          <h2 className="title-l">Event name</h2>
          <p className="text-field text-field--static body-regular">{draft.name}</p>
        </div>
        <div className="field">
          <h2 className="title-l">Friends</h2>
          <div className="people-row">
            {draft.invited.map((id) => {
              const name = api.person(id)?.name ?? '';
              return (
                <span key={id} className="people-row__person">
                  <Avatar name={name} size="m" />
                  <span className="body-regular">{name}</span>
                </span>
              );
            })}
          </div>
        </div>
        <div className="field">
          <h2 className="title-l">Date &amp; Duration</h2>
          <p className="body-regular">
            {longDate(slot.date)} · {rangeCompact(slot.start, slot.end)}
          </p>
        </div>
        <div className="field">
          <h2 className="title-l">Location</h2>
          <p className="body-regular">{place.name}</p>
          <div className="map-preview">
            <PlaceMap places={derived.places} selectedId={place.id} preview fallbackCenter={[place.lat, place.lng]} />
          </div>
        </div>
      </div>
      <div className="actions actions--block">
        <Button block onClick={confirm}>
          Confirm event
        </Button>
      </div>
    </>
  );
}
