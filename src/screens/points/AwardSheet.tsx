// Feuille « Ajouter des bons points » : bonnes actions en un tap, points libres, retrait de points.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GoodAction } from '../../types';
import { balance } from '../../domain/logic';
import { useApp, useFamilyData } from '../../state/AppState';
import {
  Avatar,
  Button,
  ConfirmDialog,
  EmojiPicker,
  NumberStepper,
  SegmentedControl,
  Sheet,
  TextField,
  formatPoints,
} from '../../ui';
import { cappedRemoval, joinNames } from './time';
import './points.css';

type Mode = 'give' | 'remove';

const GIVE_EMOJIS = ['⭐', '🌟', '✨', '💖', '🏆', '👏', '🎉', '🌈', '💪', '🦸', '🎵', '🙏'];
const REMOVE_EMOJIS = ['🌧️', '😕', '🙈', '🗯️', '⏰', '🧹', '📵', '🔇'];

export function AwardSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useFamilyData();
  const { run, busy, selectedChildren, selectedChildIds, toggleChild } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('give');
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const [points, setPoints] = useState(1);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Réinitialise le formulaire à chaque ouverture.
  useEffect(() => {
    if (!open) return;
    setMode('give');
    setLabel('');
    setEmoji('⭐');
    setPoints(1);
    setLabelError(null);
    setConfirmRemove(false);
  }, [open]);

  const names = selectedChildren.map((c) => c.name);
  const forWho = joinNames(names);
  const actions = [...data.actions].sort((a, b) => a.sortOrder - b.sortOrder);

  const switchMode = (m: Mode) => {
    setMode(m);
    setLabelError(null);
    setEmoji(m === 'give' ? '⭐' : '🌧️');
  };

  const giveAction = async (a: GoodAction) => {
    const ok = await run(
      async (s) => {
        await s.awardPoints({ childIds: selectedChildIds, points: a.points, label: a.label, emoji: a.emoji, kind: 'action', refId: a.id });
        return true;
      },
      { celebrate: { message: `${formatPoints(a.points, true)} pour ${forWho} !`, emoji: a.emoji } },
    );
    if (ok) onClose();
  };

  const giveManual = async () => {
    const text = label.trim() || 'Bons points';
    const ok = await run(
      async (s) => {
        await s.awardPoints({ childIds: selectedChildIds, points, label: text, emoji: emoji || '⭐', kind: 'manual' });
        return true;
      },
      { celebrate: { message: `${formatPoints(points, true)} pour ${forWho} !`, emoji: emoji || '⭐' } },
    );
    if (ok) onClose();
  };

  // --- Retrait : plafonné au solde de chaque enfant ---
  const removal = selectedChildren.map((c) => {
    const bal = balance(data.events, c.id);
    return { child: c, balance: bal, amount: cappedRemoval(points, bal) };
  });
  const capped = removal.filter((r) => r.amount < points);
  const nothingToRemove = removal.every((r) => r.amount === 0);

  const askRemove = () => {
    if (!label.trim()) {
      setLabelError('Dis en quelques mots pourquoi (ex. « A tapé sa sœur »).');
      return;
    }
    if (nothingToRemove) return;
    setConfirmRemove(true);
  };

  const doRemove = async () => {
    const text = label.trim();
    const ok = await run(
      async (s) => {
        for (const r of removal) {
          if (r.amount <= 0) continue;
          await s.awardPoints({ childIds: [r.child.id], points: -r.amount, label: text, emoji: emoji || '🌧️', kind: 'adjustment' });
        }
        return true;
      },
      { success: 'Points retirés' },
    );
    setConfirmRemove(false);
    if (ok) onClose();
  };

  const removalSummary = joinNames(
    removal.filter((r) => r.amount > 0).map((r) => `${formatPoints(r.amount)} à ${r.child.name}`),
  );

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={mode === 'give' ? 'Ajouter des bons points' : 'Retirer des points'}
        description={forWho ? `Pour ${forWho}` : undefined}
        className="pts-sheet"
      >
        {data.children.length > 1 && (
          <div className="pts-sheet__kids" role="group" aria-label="Enfants concernés">
            {data.children.map((c) => (
              <Avatar
                key={c.id}
                emoji={c.emoji}
                color={c.color}
                name={c.name}
                showName
                size="sm"
                selected={selectedChildIds.includes(c.id)}
                onClick={() => toggleChild(c.id)}
              />
            ))}
          </div>
        )}

        <SegmentedControl<Mode>
          label="Donner ou retirer des points"
          value={mode}
          onChange={switchMode}
          options={[
            { value: 'give', label: 'Donner ✨' },
            { value: 'remove', label: 'Retirer des points' },
          ]}
        />

        {mode === 'give' ? (
          <>
            <section className="stack" style={{ ['--gap' as string]: 'var(--s-3)' }} aria-labelledby="pts-actions-title">
              <div className="row-between">
                <h3 id="pts-actions-title" className="pts-subtitle">
                  Bonnes actions
                </h3>
                <button
                  type="button"
                  className="pts-link"
                  onClick={() => {
                    onClose();
                    navigate('/actions');
                  }}
                >
                  Gérer les bonnes actions
                </button>
              </div>
              {actions.length === 0 ? (
                <p className="muted small">Aucune bonne action pour l’instant : crée la première avec « Gérer les bonnes actions ».</p>
              ) : (
                <div className="pts-action-grid">
                  {actions.map((a, i) => (
                    <button
                      key={a.id}
                      type="button"
                      className="pts-action"
                      disabled={busy}
                      onClick={() => void giveAction(a)}
                      data-autofocus={i === 0 ? true : undefined}
                      aria-label={`${a.label}, ${formatPoints(a.points, true)} pour ${forWho}`}
                    >
                      <span className="pts-action__emoji emoji" aria-hidden="true">
                        {a.emoji}
                      </span>
                      <span className="pts-action__label">{a.label}</span>
                      <span className="pts-action__pts" aria-hidden="true">
                        {formatPoints(a.points, true)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="pts-other" aria-labelledby="pts-other-title">
              <h3 id="pts-other-title" className="pts-subtitle">
                Autre
              </h3>
              <TextField
                label="Pour quoi ? (facultatif)"
                placeholder="Bons points"
                value={label}
                maxLength={80}
                onChange={(e) => setLabel(e.target.value)}
              />
              <EmojiPicker label="Emoji" value={emoji} onChange={setEmoji} emojis={GIVE_EMOJIS} />
              <NumberStepper label="Nombre de points" value={points} onChange={setPoints} min={1} max={100} unit="pts" />
              <Button block size="lg" icon="sparkle" loading={busy} onClick={() => void giveManual()}>
                Donner {formatPoints(points)}
              </Button>
            </section>
          </>
        ) : (
          <section className="pts-other" aria-label="Retirer des points">
            <p className="small muted">
              Ça arrive ! Retire quelques points en expliquant pourquoi : l’enfant le verra dans son journal.
            </p>
            <TextField
              label="Pourquoi ?"
              placeholder="Ex. N’a pas rangé ses jouets"
              value={label}
              maxLength={80}
              required
              error={labelError}
              onChange={(e) => {
                setLabel(e.target.value);
                if (labelError) setLabelError(null);
              }}
              data-autofocus
            />
            <EmojiPicker label="Emoji" value={emoji} onChange={setEmoji} emojis={REMOVE_EMOJIS} />
            <NumberStepper label="Points à retirer" value={points} onChange={setPoints} min={1} max={100} unit="pts" />
            {capped.length > 0 && (
              <p className="pts-note" role="status">
                Le solde ne descend jamais sous zéro :{' '}
                {capped
                  .map((r) =>
                    r.amount === 0
                      ? `${r.child.name} n’a aucun point à retirer`
                      : `${r.child.name} n’a que ${formatPoints(r.balance)}, on en retirera ${r.amount}`,
                  )
                  .join(' ; ')}
                .
              </p>
            )}
            <Button block size="lg" variant="danger" icon="minus" disabled={nothingToRemove} loading={busy} onClick={askRemove}>
              Retirer {formatPoints(points)}
            </Button>
          </section>
        )}
      </Sheet>
      <ConfirmDialog
        open={confirmRemove}
        title="Retirer des points ?"
        message={`On retire ${removalSummary}, pour « ${label.trim()} ».`}
        confirmLabel="Retirer"
        danger
        busy={busy}
        onConfirm={doRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </>
  );
}
