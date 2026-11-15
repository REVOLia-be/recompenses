import { Avatar, Button, GlassCard, IconButton, PointsBadge, cx } from '../../ui';
import type { Child } from '../../types';
import type { MissionView } from './grouping';
import { RECURRENCE_LABEL } from './suggestions';

export interface MissionCardProps {
  view: MissionView;
  /** Lecture seule (mode enfant) : pas de validation ni d'édition. */
  readOnly?: boolean;
  paused?: boolean;
  busy?: boolean;
  onValidate?: (child: Child) => void;
  onUndo?: (child: Child, completionId: string) => void;
  onEdit?: () => void;
  onResume?: () => void;
}

export function MissionCard({ view, readOnly, paused, busy, onValidate, onUndo, onEdit, onResume }: MissionCardProps) {
  const { mission, kids } = view;
  const single = kids.length === 1 ? kids[0] : null;

  return (
    <GlassCard
      as="li"
      padding="md"
      className={cx('ms-card', paused && 'is-paused', view.done && 'is-done')}
      data-testid="mission-card"
    >
      <div className="ms-card__top">
        <span className="ms-card__emoji emoji" aria-hidden="true">
          {mission.emoji}
        </span>
        <div className="ms-card__main">
          <h3 className="ms-card__title">{mission.title}</h3>
          <div className="ms-card__meta">
            <PointsBadge points={mission.points} signed size="sm" tone={paused ? 'glass' : 'gold'} />
            <span className="ms-pill">{RECURRENCE_LABEL[mission.recurrence]}</span>
            {paused && <span className="ms-pill ms-pill--pause">En pause</span>}
          </div>
        </div>
        {!readOnly && onEdit && (
          <IconButton label={`Modifier la mission ${mission.title}`} icon="pencil" size="sm" variant="plain" onClick={onEdit} />
        )}
      </div>

      {paused ? (
        !readOnly && (
          <div className="ms-card__bottom">
            <Button variant="secondary" size="sm" icon="sparkle" onClick={onResume} disabled={busy}>
              Réactiver
            </Button>
          </div>
        )
      ) : kids.length === 0 ? (
        <p className="ms-card__hint muted small">Aucun enfant concerné pour l’instant.</p>
      ) : readOnly ? (
        <ul className="ms-kids" aria-label="Qui a fait quoi">
          {kids.map((k) => (
            <li key={k.child.id} className={cx('ms-status', k.completion && 'is-done')}>
              <Avatar emoji={k.child.emoji} color={k.child.color} size="xs" />
              <span>{k.completion ? 'Fait ✓' : 'À faire'}</span>
            </li>
          ))}
        </ul>
      ) : single ? (
        single.completion ? (
          <div className="ms-card__bottom ms-card__bottom--between">
            <span className="ms-done-tag">
              <span aria-hidden="true">✅</span> Validé pour {single.child.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUndo?.(single.child, single.completion!.id)}
              aria-label={`Annuler la validation pour ${single.child.name}`}
              disabled={busy}
            >
              Annuler
            </Button>
          </div>
        ) : (
          <div className="ms-card__bottom">
            <Button block size="lg" onClick={() => onValidate?.(single.child)} disabled={busy}>
              Valider ✓
            </Button>
          </div>
        )
      ) : (
        <div className="ms-kids ms-kids--check" role="group" aria-label={`Valider « ${mission.title} » pour…`}>
          {kids.map((k) => {
            const done = !!k.completion;
            return (
              <button
                key={k.child.id}
                type="button"
                role="checkbox"
                aria-checked={done}
                aria-label={`${k.child.name}${done ? ', validé' : ''}`}
                className={cx('ms-kid', done && 'is-done')}
                disabled={busy}
                onClick={() => (done ? onUndo?.(k.child, k.completion!.id) : onValidate?.(k.child))}
              >
                <Avatar emoji={k.child.emoji} color={k.child.color} size="sm" selected={done} />
                <span className="ms-kid__name" aria-hidden="true">
                  {k.child.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
