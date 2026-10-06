import type { CSSProperties } from 'react';
import type { ISODate, Minutes } from '../data/types';
import { sameSlot, type Interval, type Slot } from '../lib/availability';
import { clock, DAY_SHORT, hourLabel, longDate, rangeCompact, weekday } from '../lib/time';

export interface CalendarBlock {
  id: string;
  date: ISODate;
  start: Minutes;
  end: Minutes;
  label: string;
  /** class: a scheduled class. hangout: a confirmed event. busy: the student's class in availability mode (hatched). */
  kind: 'class' | 'hangout' | 'busy';
  onClick?: () => void;
}

interface Props {
  columns: ISODate[];
  today: ISODate;
  blocks: CalendarBlock[];
  /** Availability layer (Time step). */
  slots?: Slot[];
  selectedSlot?: Slot;
  onSelectSlot?: (slot: Slot) => void;
  /** Days outside the range or already past: grayed out. */
  disabledDates?: ISODate[];
  /** Hours that must be visible even if no item falls in them. */
  minRange?: Interval;
  label: string;
}

const HOUR = 60;

/**
 * One weekly calendar for all three uses: classes, classes + hangouts, and the
 * availability picker. Blocks are positioned from real start and end times.
 */
export function WeekCalendar({ columns, today, blocks, slots = [], selectedSlot, onSelectSlot, disabledDates = [], minRange, label }: Props) {
  const items: Interval[] = [...blocks, ...slots, ...(minRange ? [minRange] : [])];
  const first = items.length ? Math.floor(Math.min(...items.map((i) => i.start)) / HOUR) * HOUR : 9 * HOUR;
  const last = items.length ? Math.ceil(Math.max(...items.map((i) => i.end)) / HOUR) * HOUR : 17 * HOUR;
  const hours = Array.from({ length: (last - first) / HOUR }, (_, i) => first + i * HOUR);

  // Position in hour units; the stylesheet turns them into px with the hour-height token.
  const pos = (start: Minutes, end: Minutes) => ({
    '--top': (start - first) / HOUR,
    '--span': (end - start) / HOUR,
  }) as CSSProperties;

  return (
    <div className="week-calendar" style={{ '--days': columns.length } as CSSProperties} aria-label={label}>
      <div className="week-calendar__days" role="row">
        <span />
        {columns.map((date) => (
          <span
            key={date}
            className={`week-calendar__day clickables-xs ${date === today ? 'week-calendar__day--today' : ''} ${disabledDates.includes(date) ? 'week-calendar__day--disabled' : ''}`}
            aria-current={date === today ? 'date' : undefined}
          >
            {DAY_SHORT[weekday(date)]}
          </span>
        ))}
      </div>

      <div className="week-calendar__scroll">
        <div className="week-calendar__grid" style={{ '--hours': hours.length } as CSSProperties}>
          {hours.map((h, i) => (
            <span key={h} className="week-calendar__hour specials-caption" style={{ '--top': i } as CSSProperties}>
              {hourLabel(h)}
            </span>
          ))}

          {columns.map((date, col) => (
            <div
              key={date}
              className={`week-calendar__column ${disabledDates.includes(date) ? 'week-calendar__column--disabled' : ''}`}
              style={{ '--col': col } as CSSProperties}
              aria-disabled={disabledDates.includes(date) || undefined}
            >
              {slots
                .filter((s) => s.date === date)
                .map((s) => {
                  const level = s.free === s.total ? 'full' : s.free / s.total >= 0.6 ? 'mid' : 'low';
                  const selected = sameSlot(s, selectedSlot);
                  return (
                    <button
                      key={`${s.start}`}
                      type="button"
                      className={`week-calendar__slot week-calendar__slot--${level} clickables-xs ${selected ? 'week-calendar__slot--selected' : ''}`}
                      style={pos(s.start, s.end)}
                      aria-pressed={selected}
                      aria-label={`${longDate(s.date)}, ${clock(s.start)} to ${clock(s.end)}: ${s.free} of ${s.total} free`}
                      onClick={() => onSelectSlot?.(s)}
                    >
                      {s.free}/{s.total}
                    </button>
                  );
                })}

              {blocks
                .filter((b) => b.date === date)
                .map((b) => {
                  const [dept, num] = splitCode(b.label);
                  const className = `week-calendar__block week-calendar__block--${b.kind} clickables-xs`;
                  const content = (
                    <>
                      <span>{dept}</span>
                      {num && <span>{num}</span>}
                    </>
                  );
                  const title = `${b.label}, ${rangeCompact(b.start, b.end)}`;
                  return b.onClick ? (
                    <button key={b.id} type="button" className={className} style={pos(b.start, b.end)} aria-label={`Open ${title}`} onClick={b.onClick}>
                      {content}
                    </button>
                  ) : (
                    <div key={b.id} className={className} style={pos(b.start, b.end)} aria-label={title}>
                      {content}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** "MATH 20C" → ["MATH", "20C"]; longer titles stay on one line. */
function splitCode(label: string): [string, string?] {
  const m = /^([A-Z]{2,5}) (\w{1,4})$/.exec(label);
  return m ? [m[1], m[2]] : [label];
}

export function AvailabilityLegend({ total }: { total: number }) {
  // Same thresholds as the slot shading above.
  const lowMax = Math.max(...Array.from({ length: total - 1 }, (_, i) => i + 2).filter((n) => n < total && n / total < 0.6), 1);
  const span = (a: number, b: number) => (a === b ? `${a}` : `${a}–${b}`);
  const steps = [
    lowMax >= 2 && { level: 'low', text: span(2, lowMax) },
    lowMax + 1 <= total - 1 && { level: 'mid', text: span(lowMax + 1, total - 1) },
    { level: 'full', text: `${total} free` },
  ].filter(Boolean) as { level: string; text: string }[];

  return (
    <div className="legend specials-caption" aria-label="Legend">
      <span className="legend__item">
        <span className="legend__swatch legend__swatch--busy" />
        Your classes, pre-filled
      </span>
      {steps.map((s) => (
        <span key={s.level} className="legend__item">
          <span className={`legend__swatch legend__swatch--${s.level}`} />
          {s.text}
        </span>
      ))}
    </div>
  );
}
