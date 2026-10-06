import { Icon } from './Icon';

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  /** Called when Enter is pressed. */
  onEnter?: () => void;
}

export function SearchField({ value, onChange, label = 'Search', placeholder = 'Search', onEnter }: Props) {
  return (
    <label className="search">
      <Icon name="search" className="search__icon" />
      <input
        className="search__input specials-label"
        type="search"
        placeholder={placeholder}
        aria-label={label}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      />
    </label>
  );
}
