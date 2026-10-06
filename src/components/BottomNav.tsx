import { useApp } from '../app/state';
import { Icon, type IconName } from './Icon';

export type NavItem = 'home' | 'friends' | 'classes' | 'profile';

const ITEMS: { id: NavItem; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'friends', label: 'Friends', icon: 'users' },
  { id: 'classes', label: 'Classes', icon: 'graduationCap' },
  { id: 'profile', label: 'Profile', icon: 'profile' },
];

export function BottomNav({ active }: { active: NavItem }) {
  const { navigate } = useApp();
  const go = (id: NavItem) => {
    if (id === 'home') navigate({ name: 'home' });
    if (id === 'friends') navigate({ name: 'friends' });
    if (id === 'classes') navigate({ name: 'classes' });
    // Profile: no wireframe yet — inactive.
  };
  return (
    <nav className="bottom-nav" aria-label="Main">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`bottom-nav__item ${item.id === active ? 'bottom-nav__item--active' : ''}`}
          aria-label={item.label}
          aria-current={item.id === active ? 'page' : undefined}
          onClick={() => go(item.id)}
        >
          <span className="bottom-nav__icon">
            <Icon name={item.icon} />
          </span>
          <span className="specials-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
