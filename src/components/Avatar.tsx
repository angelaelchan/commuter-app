export type AvatarSize = 'xs' | 's' | 'm' | 'l' | 'xl';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** Initials use the text style that fits each avatar size. */
const TEXT_STYLE: Record<AvatarSize, string> = {
  xs: 'specials-caption',
  s: 'clickables-xs',
  m: 'clickables-xs',
  l: 'clickables-regular',
  xl: 'title-l',
};

/** Initials avatar built from tokens (replaces the wireframe placeholder photo). */
export function Avatar({ name, size = 'm' }: { name: string; size?: AvatarSize }) {
  return (
    <span className={`avatar avatar--${size} ${TEXT_STYLE[size]}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names }: { names: string[] }) {
  return (
    <span className="avatar-stack" aria-hidden="true">
      {names.slice(0, 3).map((n) => (
        <Avatar key={n} name={n} size="xs" />
      ))}
    </span>
  );
}
