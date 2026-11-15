// Route /actions (parents uniquement) : gestion des bonnes actions prédéfinies.
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { GoodAction } from '../../types';
import { useApp, useFamilyData } from '../../state/AppState';
import {
  Button,
  ConfirmDialog,
  EmojiPicker,
  EmptyState,
  GlassCard,
  IconButton,
  NumberStepper,
  Screen,
  Sheet,
  TextField,
  formatPoints,
} from '../../ui';
import './points.css';

type Editing = { action: GoodAction | null } | null;

export function ActionsScreen() {
  const { childMode } = useApp();
  // /actions n'est pas sous PARENT_ONLY_PREFIX : on applique le verrou du mode enfant ici.
  if (childMode) return <Navigate to="/" replace />;
  return <ActionsManager />;
}

function ActionsManager() {
  const data = useFamilyData();
  const { run, busy } = useApp();
  const [editing, setEditing] = useState<Editing>(null);
  const actions = [...data.actions].sort((a, b) => a.sortOrder - b.sortOrder);

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= actions.length) return;
    const order = [...actions];
    [order[index], order[target]] = [order[target], order[index]];
    await run(async (s) => {
      // Renumérote 0..n-1 (corrige aussi d'éventuels doublons de sortOrder).
      for (let i = 0; i < order.length; i++) {
        const a = order[i];
        if (a.sortOrder !== i) await s.upsertAction({ id: a.id, label: a.label, emoji: a.emoji, points: a.points, sortOrder: i });
      }
    });
  };

  return (
    <Screen
      title="Bonnes actions"
      subtitle="Elles s’attribuent en un tap"
      back="/"
      action={<IconButton label="Nouvelle bonne action" icon="plus" variant="primary" onClick={() => setEditing({ action: null })} />}
      className="pts-screen"
    >
      {actions.length === 0 ? (
        <GlassCard>
          <EmptyState
            emoji="🌱"
            title="Aucune bonne action"
            message="Crée les petits gestes que tu veux encourager : ranger sa chambre, mettre la table…"
            action={
              <Button icon="plus" onClick={() => setEditing({ action: null })}>
                Créer une bonne action
              </Button>
            }
          />
        </GlassCard>
      ) : (
        <>
          <p className="pts-help">Touche une action pour la modifier. Les flèches changent l’ordre d’affichage.</p>
          <ul className="pts-manage" role="list">
            {actions.map((a, i) => (
              <GlassCard as="li" padding="sm" key={a.id} className="pts-manage__item">
                <button
                  type="button"
                  className="pts-manage__main"
                  onClick={() => setEditing({ action: a })}
                  aria-label={`Modifier « ${a.label} », ${formatPoints(a.points, true)}`}
                >
                  <span className="pts-manage__emoji emoji" aria-hidden="true">
                    {a.emoji}
                  </span>
                  <span className="pts-manage__label">{a.label}</span>
                  <span className="pts-manage__pts" aria-hidden="true">
                    {formatPoints(a.points, true)}
                  </span>
                </button>
                <div className="pts-manage__order">
                  <IconButton
                    label={`Monter « ${a.label} »`}
                    icon="chevronRight"
                    variant="plain"
                    className="pts-rot-up"
                    disabled={i === 0 || busy}
                    onClick={() => void move(i, -1)}
                  />
                  <IconButton
                    label={`Descendre « ${a.label} »`}
                    icon="chevronRight"
                    variant="plain"
                    className="pts-rot-down"
                    disabled={i === actions.length - 1 || busy}
                    onClick={() => void move(i, 1)}
                  />
                </div>
              </GlassCard>
            ))}
          </ul>
          <Button variant="secondary" block icon="plus" onClick={() => setEditing({ action: null })}>
            Nouvelle bonne action
          </Button>
        </>
      )}

      <ActionEditor
        editing={editing}
        nextOrder={actions.length ? Math.max(...actions.map((a) => a.sortOrder)) + 1 : 0}
        onClose={() => setEditing(null)}
      />
    </Screen>
  );
}

function ActionEditor({ editing, nextOrder, onClose }: { editing: Editing; nextOrder: number; onClose: () => void }) {
  const { run, busy } = useApp();
  const existing = editing?.action ?? null;
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const [points, setPoints] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!editing) return;
    setLabel(existing?.label ?? '');
    setEmoji(existing?.emoji ?? '⭐');
    setPoints(existing?.points ?? 1);
    setError(null);
    setConfirmDelete(false);
  }, [editing, existing]);

  const save = async () => {
    const text = label.trim();
    if (!text) {
      setError('Décris la bonne action (ex. « A rangé sa chambre »).');
      return;
    }
    const ok = await run(
      async (s) => {
        await s.upsertAction({
          ...(existing ? { id: existing.id } : {}),
          label: text,
          emoji: emoji || '⭐',
          points,
          sortOrder: existing ? existing.sortOrder : nextOrder,
        });
        return true;
      },
      { success: existing ? 'Bonne action modifiée' : 'Bonne action ajoutée ✨' },
    );
    if (ok) onClose();
  };

  const remove = async () => {
    if (!existing) return;
    const ok = await run(
      async (s) => {
        await s.deleteAction(existing.id);
        return true;
      },
      { success: 'Bonne action supprimée' },
    );
    setConfirmDelete(false);
    if (ok) onClose();
  };

  return (
    <>
      <Sheet
        open={!!editing}
        onClose={onClose}
        title={existing ? 'Modifier la bonne action' : 'Nouvelle bonne action'}
        footer={
          <>
            {existing && (
              <Button variant="ghost" icon="trash" className="pts-danger-ghost" onClick={() => setConfirmDelete(true)}>
                Supprimer
              </Button>
            )}
            <Button icon="check" loading={busy} onClick={() => void save()}>
              Enregistrer
            </Button>
          </>
        }
      >
        <TextField
          label="Bonne action"
          placeholder="Ex. A rangé sa chambre"
          value={label}
          maxLength={80}
          error={error}
          onChange={(e) => {
            setLabel(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
          }}
          data-autofocus
        />
        <EmojiPicker label="Emoji" value={emoji} onChange={setEmoji} sets={['actions', 'magic']} />
        <NumberStepper label="Points gagnés" value={points} onChange={setPoints} min={1} max={50} unit="pts" />
      </Sheet>
      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer cette bonne action ?"
        message={existing ? `${existing.emoji} ${existing.label} — les points déjà donnés restent dans le journal.` : undefined}
        confirmLabel="Supprimer"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
