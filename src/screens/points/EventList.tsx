// Liste de lignes du journal de points, avec annulation possible (parents uniquement).
import { useEffect, useState } from 'react';
import type { Child, Parent, PointEvent } from '../../types';
import { useApp } from '../../state/AppState';
import { ConfirmDialog, IconButton, PointsBadge, formatPoints } from '../../ui';
import { relativeTime } from './time';
import './points.css';

const UNDOABLE = new Set<PointEvent['kind']>(['action', 'manual', 'adjustment']);

export function canUndo(e: PointEvent): boolean {
  return UNDOABLE.has(e.kind);
}

/** Horloge qui se rafraîchit chaque minute (pour « il y a 3 min »). */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

interface EventListProps {
  events: PointEvent[];
  children: Child[];
  parents: Parent[];
  /** Affiche le prénom de l'enfant sur chaque ligne (défaut true). */
  showChild?: boolean;
  /** Affiche l'auteur (« par Papa »). */
  showAuthor?: boolean;
  /** Autorise l'annulation (ignoré en mode enfant). */
  allowUndo?: boolean;
  /** Heure absolue plutôt que relative (historique groupé par jour). */
  clock?: boolean;
}

const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

export function EventList({ events, children, parents, showChild = true, showAuthor, allowUndo = true, clock }: EventListProps) {
  const { run, childMode } = useApp();
  const now = useNow();
  const [pending, setPending] = useState<PointEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const undoEnabled = allowUndo && !childMode;
  const childOf = (id: string) => children.find((c) => c.id === id);
  const parentOf = (id: string | null) => (id ? parents.find((p) => p.id === id) : undefined);

  const confirmUndo = async () => {
    if (!pending) return;
    setBusy(true);
    // En cas d'erreur, run() affiche déjà un toast explicite : on referme dans tous les cas.
    await run((s) => s.deleteEvent(pending.id), { success: 'Ligne annulée' });
    setBusy(false);
    setPending(null);
  };

  const pendingChild = pending ? childOf(pending.childId) : undefined;

  return (
    <>
      <ul className="pts-events" role="list">
        {events.map((e) => {
          const child = childOf(e.childId);
          const author = showAuthor ? parentOf(e.createdBy) : undefined;
          const when = clock ? timeFmt.format(new Date(e.createdAt)) : relativeTime(e.createdAt, now);
          return (
            <li key={e.id} className={`pts-event${e.points < 0 ? ' is-negative' : ''}`}>
              <span className="pts-event__emoji emoji" aria-hidden="true">
                {e.emoji || '⭐'}
              </span>
              <div className="pts-event__main">
                <p className="pts-event__label">{e.label}</p>
                <p className="pts-event__meta">
                  {showChild && child && <span className="pts-event__child">{child.name}</span>}
                  {showChild && child && <span aria-hidden="true"> · </span>}
                  <time dateTime={e.createdAt}>{when}</time>
                  {author && <span> · par {author.roleLabel || author.name}</span>}
                </p>
              </div>
              <PointsBadge points={e.points} signed size="sm" tone={e.points < 0 ? 'negative' : 'gold'} />
              {undoEnabled && canUndo(e) && (
                <IconButton
                  className="pts-event__undo"
                  label={`Annuler « ${e.label} » (${formatPoints(e.points, true)}${child ? ` pour ${child.name}` : ''})`}
                  icon="close"
                  variant="plain"
                  onClick={() => setPending(e)}
                />
              )}
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={!!pending}
        title="Annuler cette ligne ?"
        message={
          pending ? (
            <>
              {pending.emoji} {pending.label} : {formatPoints(pending.points, true)}
              {pendingChild ? ` pour ${pendingChild.name}` : ''}. Le solde sera recalculé.
            </>
          ) : undefined
        }
        confirmLabel="Oui, annuler"
        cancelLabel="Garder"
        danger
        busy={busy}
        onConfirm={confirmUndo}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
