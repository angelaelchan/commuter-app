import bell from '../assets/icons/bell.svg?raw';
import calendar from '../assets/icons/calendar.svg?raw';
import check from '../assets/icons/check.svg?raw';
import chevronRight from '../assets/icons/chevron-right.svg?raw';
import edit from '../assets/icons/edit.svg?raw';
import graduationCap from '../assets/icons/graduation-cap.svg?raw';
import home from '../assets/icons/home.svg?raw';
import list from '../assets/icons/list.svg?raw';
import mapPin from '../assets/icons/map-pin.svg?raw';
import profile from '../assets/icons/profile.svg?raw';
import search from '../assets/icons/search.svg?raw';
import users from '../assets/icons/users.svg?raw';
import x from '../assets/icons/x.svg?raw';

/** Icons exported from the Figma file (search, map-pin and edit match the same Feather set). */
const ICONS = { bell, calendar, check, chevronRight, edit, graduationCap, home, list, mapPin, profile, search, users, x };

export type IconName = keyof typeof ICONS;

/** Renders the SVG inline so it inherits `color` (all strokes/fills use currentColor). */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <span
      className={`icon ${className ?? ''}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}

export function iconSvg(name: IconName) {
  return ICONS[name];
}
