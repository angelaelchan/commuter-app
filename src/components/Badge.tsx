/** Unread count badge. */
export function Badge({ count, label }: { count: number; label?: string }) {
  return (
    <span className="badge specials-label" aria-label={label ?? `${count} unread`}>
      {count}
    </span>
  );
}
