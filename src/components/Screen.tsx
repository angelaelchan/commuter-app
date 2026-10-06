import type { ReactNode } from 'react';
import { BottomNav, type NavItem } from './BottomNav';

interface Props {
  nav: NavItem;
  header: ReactNode;
  /** 204 px header band (with search field or step bar) instead of 160 px. */
  tall?: boolean;
  /** Content runs edge to edge with no padding (the map). */
  bleed?: boolean;
  children: ReactNode;
  overlay?: ReactNode;
}

export function Screen({ nav, header, tall, bleed, children, overlay }: Props) {
  return (
    <div className="screen">
      <header className={`header-band ${tall ? 'header-band--tall' : ''}`}>{header}</header>
      <main className={bleed ? 'screen__bleed' : 'screen__content'}>{children}</main>
      {overlay}
      <BottomNav active={nav} />
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <h2 className="title-l">{title}</h2>
      {action}
    </div>
  );
}

/** One line of Secondary Text when a filter leaves a list empty. */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty body-s">{children}</p>;
}

/** A control whose destination has no wireframe yet: visible, styled, inert. */
export const inactive = () => {};
