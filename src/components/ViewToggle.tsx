import type { ViewMode } from '../app/state';
import { Icon } from './Icon';

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="view-toggle" role="group" aria-label="View">
      {(['list', 'calendar'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          className={`view-toggle__button ${value === mode ? 'view-toggle__button--active' : ''}`}
          aria-pressed={value === mode}
          aria-label={mode === 'list' ? 'List view' : 'Calendar view'}
          onClick={() => onChange(mode)}
        >
          <Icon name={mode} />
        </button>
      ))}
    </div>
  );
}
