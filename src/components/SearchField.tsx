import { Icon } from './Icon';

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  /** Inactive search (Home): shown as designed, does nothing yet. */
  inactive?: boolean;
  label?: string;
}

export function SearchField({ value, onChange, inactive, label = 'Search' }: Props) {
  return (
    <label className="search">
      <Icon name="search" className="search__icon" />
      <input
        className="search__input specials-label"
        type="search"
        placeholder="Search"
        aria-label={label}
        value={inactive ? '' : value}
        readOnly={inactive}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </label>
  );
}
