import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from './cx';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Espacement intérieur (défaut 'md'). */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Verre plus opaque (meilleure lisibilité sur un fond chargé). */
  strong?: boolean;
  /** Élément HTML rendu (défaut 'div'). */
  as?: 'div' | 'section' | 'article' | 'li';
}

/** Carte en verre dépoli, coins très arrondis. */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { padding = 'md', strong, as: Tag = 'div', className, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref as never}
      className={cx('ui-card', `ui-card--pad-${padding}`, strong && 'ui-card--strong', className)}
      {...rest}
    />
  );
});
