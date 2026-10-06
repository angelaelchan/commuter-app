import type { ReactNode } from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  /** Rendered after the label (e.g. an unread badge). */
  extra?: ReactNode;
  disabled?: boolean;
}

interface Props<T extends string> {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  label: string;
  spread?: boolean;
}

/** Underlined text tabs: quarter tabs, Forum / Private Chat, hangout step bar. */
export function Tabs<T extends string>({ items, active, onChange, label, spread }: Props<T>) {
  return (
    <div className={`tabs ${spread ? 'tabs--spread' : ''}`} role="tablist" aria-label={label}>
      {items.map((item) => (
        <span key={item.id} className="tabs__item">
          <button
            type="button"
            role="tab"
            aria-selected={item.id === active}
            disabled={item.disabled}
            className={`tabs__tab title-regular ${item.id === active ? 'tabs__tab--active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
          {item.extra}
        </span>
      ))}
    </div>
  );
}
