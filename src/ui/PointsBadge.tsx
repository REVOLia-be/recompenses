import { cx } from './cx';

export interface PointsBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  /** Affiche le signe (+3 / −2) — utile dans un journal. */
  signed?: boolean;
  /** 'gold' (défaut), 'glass' (discret) ou 'negative'. 'auto' = negative si points < 0. */
  tone?: 'gold' | 'glass' | 'negative' | 'auto';
  className?: string;
}

/** « pts » / « pt » selon la valeur. */
export function formatPoints(points: number, signed = false): string {
  const abs = Math.abs(points);
  const sign = signed ? (points > 0 ? '+' : points < 0 ? '−' : '') : points < 0 ? '−' : '';
  return `${sign}${abs} ${abs > 1 ? 'pts' : 'pt'}`;
}

/** Étoile dorée + « 9 pts ». */
export function PointsBadge({ points, size = 'md', signed, tone = 'auto', className }: PointsBadgeProps) {
  const t = tone === 'auto' ? (points < 0 ? 'negative' : 'gold') : tone;
  const abs = Math.abs(points);
  return (
    <span
      className={cx('ui-points', `ui-points--${size}`, `ui-points--${t}`, className)}
      aria-label={`${signed && points > 0 ? 'plus ' : points < 0 ? 'moins ' : ''}${abs} ${abs > 1 ? 'points' : 'point'}`}
      role="img"
    >
      <svg className="ui-points__star" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.6l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 16.9l-5.6 2.9 1.1-6.2L3 9.2l6.2-.9z" />
      </svg>
      <span aria-hidden="true">{formatPoints(points, signed)}</span>
    </span>
  );
}
