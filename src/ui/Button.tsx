import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './icons';
import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Pleine largeur. */
  block?: boolean;
  /** Icône à gauche (nom du jeu d'icônes ou nœud React). */
  icon?: IconName | ReactNode;
  /** Affiche un indicateur et désactive le bouton. */
  loading?: boolean;
}

function renderIcon(icon: IconName | ReactNode, size: number) {
  return typeof icon === 'string' ? <Icon name={icon as IconName} size={size} /> : icon;
}

/** Bouton tactile (≥ 48px en md/lg). primary = dégradé framboise → violet. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block, icon, loading, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('ui-btn', `ui-btn--${variant}`, `ui-btn--${size}`, block && 'ui-btn--block', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="ui-spinner" aria-hidden="true" /> : icon ? renderIcon(icon, size === 'sm' ? 18 : 22) : null}
      {children != null && <span className="ui-btn__label">{children}</span>}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Libellé accessible OBLIGATOIRE (lu par VoiceOver, affiché en infobulle). */
  label: string;
  icon: IconName | ReactNode;
  variant?: 'glass' | 'primary' | 'plain' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

/** Bouton rond contenant seulement une icône. md = 48px. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'glass', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx('ui-iconbtn', `ui-iconbtn--${variant}`, `ui-iconbtn--${size}`, className)}
      {...rest}
    >
      {renderIcon(icon, size === 'sm' ? 18 : size === 'lg' ? 28 : 22)}
    </button>
  );
});
