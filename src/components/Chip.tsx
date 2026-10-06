import type { ReactNode } from 'react';

interface Props {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

/** Single-select chip. Selected uses Primary Accent. */
export function Chip({ selected, onClick, children }: Props) {
  return (
    <button
      type="button"
      className={`chip specials-label ${selected ? 'chip--selected' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
