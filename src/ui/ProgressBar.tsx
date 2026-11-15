import type { ReactNode } from 'react';
import { cx } from './cx';

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  /** Libellé accessible (ex. « Progression vers Équitation »). */
  label: string;
  /** Texte annoncé (ex. « 40 sur 100 points »). */
  valueText?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Contenu affiché à droite au-dessus de la barre (ex. « 40 / 100 »). */
  caption?: ReactNode;
  className?: string;
}

/** Barre de progression dégradée avec petite étoile en bout de course. */
export function ProgressBar({ value, label, valueText, size = 'md', caption, className }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0)) * 100);
  return (
    <div className={cx('ui-progress', `ui-progress--${size}`, pct >= 100 && 'is-complete', className)}>
      {caption != null && <div className="ui-progress__caption">{caption}</div>}
      <div
        className="ui-progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={valueText ?? `${pct} %`}
      >
        <div className="ui-progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
