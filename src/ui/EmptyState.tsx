import type { ReactNode } from 'react';
import { cx } from './cx';

export interface EmptyStateProps {
  emoji?: string;
  title: ReactNode;
  message?: ReactNode;
  /** Bouton(s) d'action. */
  action?: ReactNode;
  className?: string;
}

/** État vide illustré (gros emoji flottant + texte + action). */
export function EmptyState({ emoji = '✨', title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cx('ui-empty', className)}>
      <div className="ui-empty__art" aria-hidden="true">
        <span className="emoji">{emoji}</span>
      </div>
      <h2 className="ui-empty__title">{title}</h2>
      {message && <p className="ui-empty__msg">{message}</p>}
      {action && <div className="ui-empty__action">{action}</div>}
    </div>
  );
}
