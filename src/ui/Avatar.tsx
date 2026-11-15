import type { CSSProperties, MouseEventHandler } from 'react';
import { Icon } from './icons';
import { cx } from './cx';

const SIZES = { xs: 32, sm: 40, md: 52, lg: 72, xl: 104 } as const;
export type AvatarSize = keyof typeof SIZES | number;

export interface AvatarProps {
  emoji: string;
  /** Couleur de la pastille (hex), défaut lilas pâle. */
  color?: string;
  size?: AvatarSize;
  /** Nom de la personne : sert de libellé accessible (et s'affiche dessous si showName). */
  name?: string;
  showName?: boolean;
  /** Affiche la coche de sélection et l'anneau. */
  selected?: boolean;
  /** Si fourni, l'avatar devient un bouton (aria-pressed = selected). */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
}

/** Emoji sur pastille colorée, avec option de coche de sélection. */
export function Avatar({ emoji, color, size = 'md', name, showName, selected, onClick, disabled, className }: AvatarProps) {
  const px = typeof size === 'number' ? size : SIZES[size];
  const style = { '--av-size': `${px}px`, '--av-color': color || 'var(--avatar-2)' } as CSSProperties;
  const disc = (
    <span className="ui-avatar__disc" aria-hidden="true">
      <span className="emoji ui-avatar__emoji">{emoji}</span>
      {selected && (
        <span className="ui-avatar__check">
          <Icon name="check" size={Math.max(12, Math.round(px * 0.22))} strokeWidth={3} />
        </span>
      )}
    </span>
  );
  const nameEl = showName && name ? <span className="ui-avatar__name">{name}</span> : null;
  const cls = cx('ui-avatar', selected && 'is-selected', onClick && 'is-button', className);

  if (onClick) {
    return (
      <button type="button" className={cls} style={style} onClick={onClick} disabled={disabled} aria-pressed={!!selected} aria-label={name}>
        {disc}
        {nameEl}
      </button>
    );
  }
  return (
    <span className={cls} style={style} role={name ? 'img' : undefined} aria-label={name}>
      {disc}
      {nameEl}
    </span>
  );
}
