import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  block?: boolean;
  icon?: IconName;
  children: ReactNode;
}

/** Primary button: Primary Accent fill, Primary Background text, 40 px tall. */
export function Button({ block, icon, children, className, type = 'button', ...rest }: Props) {
  return (
    <button type={type} className={`button clickables-regular ${block ? 'button--block' : ''} ${className ?? ''}`} {...rest}>
      {icon && <Icon name={icon} className="button__icon" />}
      {children}
    </button>
  );
}
