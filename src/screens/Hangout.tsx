import { useMemo, useState, type ReactNode } from 'react';
import { HANGOUT_STEPS, useApp, type HangoutDraft, type HangoutStep } from '../app/state';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { DatePicker } from '../components/DatePicker';
import { PlaceMap } from '../components/PlaceMap';
import { Icon } from '../components/Icon';
import { Empty, Screen, SectionHeader } from '../components/Screen';
import { SearchField } from '../components/SearchField';
import { Tabs } from '../components/Tabs';
import { AvailabilityLegend, WeekCalendar, type CalendarBlock } from '../components/WeekCalendar';
import { api } from '../data/api';
import { bestSlot, dateRange, findSlots, friendsFreeAt, overlapWith, sameSlot, slotWorks, studentBusy, WINDOW, type DateChoice, type Overlap } from '../lib/availability';
import { dateSpan, dayShort, hoursLabel, longDate, monthDay, rangeCompact, shortClock, DAY_SHORT, weekday } from '../lib/time';

const DATE_CHOICES: { id: Exclude<DateChoice, 'custom'>; label: string; phrase: string }[] = [
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

/** "this week", "on Oct 12", "Oct 12 – 14" */
function rangePhrase(draft: HangoutDraft) {
  if (draft.dateChoice === 'custom' && draft.customRange) {
    const { start, end } = draft.customRange;
    return start === end ? `on ${monthDay(start)}` : dateSpan(start, end);
  }
  return DATE_CHOICES.find((c) => c.id === draft.dateChoice)?.phrase ?? '';
}

/** Everything derived from the draft that more than one step needs. */
function useDerived(draft: HangoutDraft) {
  return useMemo(() => {
    const range = dateRange(draft.dateChoice, draft.customRange);
    const slots = findSlots(range.dates, draft.duration, draft.invited, draft.slot);
    const places = api.places(draft.campus);
    const place = places.find((p) => p.id === draft.placeId);
    // A picked time survives edits as long as it still works for the group.
    const slotValid = !!draft.slot && slotWorks(draft.slot, range.dates, draft.duration, draft.invited);
    const valid = [draft.name.trim().length > 0, draft.invited.length > 0, slotValid, !!place, true];
    return { range, slots, places, place, valid };
  }, [draft]);
}

export function Hangout({ step }: { step: HangoutStep }) {
  const { draft, navigate } = useApp();
  const derived = useDerived(draft);
  const reachable = (i: number) => derived.valid.slice(0, i).every(Boolean);
  const go = (s: HangoutStep) => reachable(s) && navigate({ name: 'hangout', step: s });
  // Editing from Confirm: once everything is valid again, go straight back.
  const next = (label: string, step: HangoutStep): Primary =>
    draft.editing && reachable(4) ? { label: 'Save changes', onClick: () => go(4) } : { label, onClick: () => go(step) };

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

  if (step === 3) return <PlaceStep header={header} derived={derived} primary={next('Select location', 4)} />;

  return (
    <Screen nav="friends" tall header={header}>
      {step === 0 && <DetailsStep valid={derived.valid[0]} primary={next('Next: Invite friends', 1)} />}
      {step === 1 && <InviteStep derived={derived} primary={next('Next: Find a time', 2)} />}
      {step === 2 && <TimeStep derived={derived} primary={next('Next: Set location', 3)} />}
      {step === 4 && <ConfirmStep derived={derived} />}
    </Screen>
  );
}

type Derived = ReturnType<typeof useDerived>;
interface Primary {
  label: string;
  onClick: () => void;
}

// ---------------------------------------------------------------------------
// 1. Details
// ---------------------------------------------------------------------------
function DetailsStep({ valid, primary }: { valid: boolean; primary: Primary }) {
  const { draft, updateDraft } = useApp();
  const [picking, setPicking] = useState(false);
  const custom = draft.dateChoice === 'custom' && draft.customRange;
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
            <Chip key={c.id} selected={draft.dateChoice === c.id} onClick={() => updateDraft({ dateChoice: c.id })}>
              {c.label}
            </Chip>
          ))}
          <Chip selected={!!custom} onClick={() => setPicking(true)}>
            {custom ? dateSpan(custom.start, custom.end) : 'Pick specific date'}
          </Chip>
        </ChipGroup>
        <ChipGroup label="Duration">
          {DURATIONS.map((d) => (
            <Chip key={d.minutes} selected={draft.duration === d.minutes} onClick={() => updateDraft({ duration: d.minutes })}>
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
        <Button block disabled={!valid} onClick={primary.onClick}>
          {primary.label}
        </Button>
      </div>
      {picking && (
        <DatePicker
          today={api.today()}
          initial={draft.customRange}
          onCancel={() => setPicking(false)}
          onDone={(customRange) => {
            updateDraft({ dateChoice: 'custom', customRange });
            setPicking(false);
          }}
        />
      )}
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
function InviteStep({ derived, primary }: { derived: Derived; primary: Primary }) {
  const { draft, updateDraft } = useApp();
  const phrase = rangePhrase(draft);

  const ranked = useMemo(
    () =>
      api
        .friends()
        .map((f) => ({ friend: f, overlap: overlapWith(f.id, derived.range.dates, draft.duration) }))
        .sort((a, b) => b.overlap.minutes - a.overlap.minutes || a.friend.name.localeCompare(b.friend.name)),
    [derived.range, draft.duration],
  );
  const overlapping = ranked.filter((r) => r.overlap.minutes > 0);
  const none = ranked.filter((r) => r.overlap.minutes === 0);

  /**
   * Changing who's invited keeps the picked time unless the change breaks it:
   * a newly added friend is busy then, or nobody left can make it.
   */
  const setInvited = (invited: string[], inviteHistory: string[][]) => {
    const { slot } = draft;
    const { dates } = derived.range;
    // A picked time that currently works (or is waiting for someone to be invited).
    const hadTime = !!slot && (draft.invited.length === 0 || slotWorks(slot, dates, draft.duration, draft.invited));
    const added = invited.filter((id) => !draft.invited.includes(id));
    if (!hadTime) {
      updateDraft({ invited, inviteHistory });
      return;
    }
    const stillWorks = invited.length === 0 || slotWorks(slot, dates, draft.duration, invited);
    if (stillWorks && added.every((id) => friendsFreeAt(slot, [id]).length)) {
      updateDraft({ invited, inviteHistory });
      return;
    }
    const when = `${dayShort(slot.date)} ${rangeCompact(slot.start, slot.end)}`;
    const busy = added.filter((id) => !friendsFreeAt(slot, [id]).length).map((id) => api.person(id)?.name);
    const timeNotice = busy.length
      ? `${busy.join(' and ')} ${busy.length === 1 ? 'isn’t' : 'aren’t'} free ${when}, so pick a new time.`
      : `No one invited is free ${when} anymore, so pick a new time.`;
    updateDraft({ invited, inviteHistory, slot: undefined, timeNotice });
  };
  const toggle = (id: string) => {
    const invited = draft.invited.includes(id) ? draft.invited.filter((x) => x !== id) : [...draft.invited, id];
    setInvited(invited, [...draft.inviteHistory, draft.invited]);
  };
  const undo = () => {
    const previous = draft.inviteHistory[draft.inviteHistory.length - 1];
    if (previous) setInvited(previous, draft.inviteHistory.slice(0, -1));
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
                <p className="body-xs">{noOverlapText(overlap, draft.duration, phrase)}</p>
              </InviteCard>
            ))}
          </div>
        </section>
      )}

      <div className="actions actions--block">
        <Button block disabled={n === 0} onClick={primary.onClick}>
          {primary.label}
        </Button>
      </div>
    </>
  );
}

const DURATION_LABEL = (m: number) => DURATIONS.find((d) => d.minutes === m)?.label ?? `${m} min`;

function noOverlapText(overlap: Overlap, duration: number, phrase: string) {
  if (overlap.reason === 'too-short') return `Free together ${phrase}, but not for ${DURATION_LABEL(duration)} at a time`;
  if (overlap.reason === 'only-when-busy') return 'Only free when you’re occupied';
  return `No free time ${phrase}`;
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
function TimeStep({ derived, primary }: { derived: Derived; primary: Primary }) {
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
        {draft.timeNotice && !selected && (
          <p className="notice body-s" role="status">
            {draft.timeNotice}
          </p>
        )}
        <div className="card banner">
          {best ? (
            <>
              <p className="body-s">
                <span className="emphasis">Best time:</span> {dayShort(best.date)} {rangeCompact(best.start, best.end)}
              </p>
              <Button onClick={() => updateDraft({ slot: best, timeNotice: undefined })}>Select time</Button>
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
            onSelectSlot={(slot) => updateDraft({ slot, timeNotice: undefined })}
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
        <Button block disabled={!derived.valid[2]} onClick={primary.onClick}>
          {primary.label}
        </Button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4. Place
// ---------------------------------------------------------------------------
function PlaceStep({ header, derived, primary }: { header: ReactNode; derived: Derived; primary: Primary }) {
  const { draft, updateDraft } = useApp();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [focusId, setFocusId] = useState<string>();
  const q = query.trim().toLowerCase();
  const results = q ? derived.places.filter((p) => p.name.toLowerCase().includes(q)) : [];

  const choose = (placeId: string) => {
    updateDraft({ placeId });
    setFocusId(placeId);
    setQuery(derived.places.find((p) => p.id === placeId)?.name ?? '');
    setShowResults(false);
  };

  return (
    <Screen nav="friends" tall bleed header={header}>
      <div className="place-step">
        <div className="map-search">
          <SearchField
            value={query}
            onChange={(v) => {
              setQuery(v);
              setShowResults(true);
            }}
            onEnter={() => results[0] && choose(results[0].id)}
            label="Search places"
            placeholder={`Search ${draft.campus === 'on' ? 'on-campus' : 'off-campus'} places`}
          />
          {showResults && q && (
            <div className="card map-search__results" role="listbox" aria-label="Matching places">
              {results.length ? (
                results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={p.id === draft.placeId}
                    className="map-search__result body-s"
                    onClick={() => choose(p.id)}
                  >
                    {p.name}
                  </button>
                ))
              ) : (
                <Empty>No places match “{query.trim()}”.</Empty>
              )}
            </div>
          )}
        </div>
        <PlaceMap
          places={derived.places}
          selectedId={draft.placeId}
          onSelect={(placeId) => {
            updateDraft({ placeId });
            setShowResults(false);
          }}
          focusId={focusId}
          fallbackCenter={api.campusCenter()}
        />
        <div className="place-bar">
          <p className="body-s">
            <span className="emphasis">Location:</span> {derived.place?.name ?? 'Tap a pin'}
          </p>
          <Button disabled={!derived.place} onClick={primary.onClick}>
            {primary.label}
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
  const { draft, navigate, updateDraft, setToast, setFriendsView } = useApp();
  const { slot } = draft;
  const editStep = (step: HangoutStep) => {
    updateDraft({ editing: true });
    navigate({ name: 'hangout', step });
  };
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
          <ConfirmHeading title="Event name" onEdit={() => editStep(0)} />
          <p className="text-field text-field--static body-regular">{draft.name}</p>
        </div>
        <div className="field">
          <ConfirmHeading title="Friends" onEdit={() => editStep(1)} />
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
          <ConfirmHeading title="Date & Duration" onEdit={() => editStep(2)} />
          <p className="body-regular">
            {longDate(slot.date)} · {rangeCompact(slot.start, slot.end)}
          </p>
        </div>
        <div className="field">
          <ConfirmHeading title="Location" onEdit={() => editStep(3)} />
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

function ConfirmHeading({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className="confirm-heading">
      <h2 className="title-l">{title}</h2>
      <button type="button" className="icon-button" aria-label={`Edit ${title.toLowerCase()}`} onClick={onEdit}>
        <Icon name="edit" />
      </button>
    </div>
  );
}
