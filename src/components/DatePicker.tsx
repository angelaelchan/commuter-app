import { useEffect, useState } from 'react';
import type { ISODate } from '../data/types';
import { MAX_RANGE_DAYS, type CustomRange } from '../lib/availability';
import { addDays, DAY_SHORT, dateSpan, dayOfMonth, daysBetween, longDate, monthYear, toISO, parseDate } from '../lib/time';
import { Button } from './Button';
import { Icon } from './Icon';

interface Props {
  today: ISODate;
  initial?: CustomRange;
  onCancel: () => void;
  onDone: (range: CustomRange) => void;
}

const firstOfMonth = (iso: ISODate) => {
  const d = parseDate(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1));
};
const shiftMonth = (iso: ISODate, by: number) => {
  const d = parseDate(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth() + by, 1));
};

/** Monday-first grid of the month, padded to whole weeks. */
function monthGrid(first: ISODate): (ISODate | null)[] {
  const d = parseDate(first);
  const lead = (d.getDay() + 6) % 7;
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const cells: (ISODate | null)[] = Array(lead).fill(null);
  for (let i = 0; i < days; i++) cells.push(addDays(first, i));
  while (cells.length % 7) cells.push(null);
  return cells;
}

/**
 * Bottom-sheet calendar for "Pick specific date": tap one day, or a start and
 * an end day for a window of up to a week. Past days can't be picked.
 */
export function DatePicker({ today, initial, onCancel, onDone }: Props) {
  const [start, setStart] = useState<ISODate | undefined>(initial?.start);
  const [end, setEnd] = useState<ISODate | undefined>(initial?.end);
  const [month, setMonth] = useState(firstOfMonth(initial?.start ?? today));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  // While choosing an end date, only days within a week of the start are allowed.
  const pickingEnd = !!start && !end;
  const isDisabled = (d: ISODate) =>
    d < today || (pickingEnd && d > start! && daysBetween(start!, d) >= MAX_RANGE_DAYS);

  const tap = (d: ISODate) => {
    if (!start || end) {
      setStart(d);
      setEnd(undefined);
    } else if (d < start) {
      setStart(d);
    } else {
      setEnd(d);
    }
  };

  const rangeEnd = end ?? start;
  const summary = start ? dateSpan(start, rangeEnd!) : 'No date picked';
  const canGoBack = month > firstOfMonth(today);

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Pick a date or window" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div className="stack stack--4">
            <h2 className="title-l">Pick a date</h2>
            <p className="body-xs sheet__hint">Tap one day, or a start and end day (up to a week).</p>
          </div>
          <button type="button" className="sheet__close" aria-label="Close" onClick={onCancel}>
            <Icon name="x" />
          </button>
        </div>

        <div className="date-picker">
          <div className="date-picker__month">
            <button
              type="button"
              className="date-picker__nav date-picker__nav--prev"
              aria-label="Previous month"
              disabled={!canGoBack}
              onClick={() => setMonth(shiftMonth(month, -1))}
            >
              <Icon name="chevronRight" />
            </button>
            <span className="title-s" aria-live="polite">
              {monthYear(month)}
            </span>
            <button type="button" className="date-picker__nav" aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))}>
              <Icon name="chevronRight" />
            </button>
          </div>

          <div className="date-picker__grid" role="grid">
            {DAY_SHORT.map((d) => (
              <span key={d} className="date-picker__weekday specials-caption" role="columnheader">
                {d}
              </span>
            ))}
            {monthGrid(month).map((d, i) => {
              if (!d) return <span key={`pad-${i}`} />;
              const isStart = d === start;
              const isEnd = d === rangeEnd;
              const inRange = !!start && !!rangeEnd && d > start && d < rangeEnd;
              const cls = [
                'date-picker__day',
                'clickables-s',
                d === today && 'date-picker__day--today',
                (isStart || isEnd) && 'date-picker__day--selected',
                inRange && 'date-picker__day--in-range',
                start && rangeEnd && start !== rangeEnd && isStart && 'date-picker__day--range-start',
                start && rangeEnd && start !== rangeEnd && isEnd && 'date-picker__day--range-end',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={d}
                  type="button"
                  className={cls}
                  disabled={isDisabled(d)}
                  aria-pressed={isStart || isEnd || inRange}
                  aria-label={longDate(d)}
                  onClick={() => tap(d)}
                >
                  {dayOfMonth(d)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sheet__foot">
          <p className="body-s">
            <span className="emphasis">Selected:</span> {summary}
          </p>
          <Button disabled={!start} onClick={() => start && onDone({ start, end: rangeEnd! })}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
