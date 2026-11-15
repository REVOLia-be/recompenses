import { useEffect, useState, type FormEvent } from 'react';
import {
  Avatar,
  Button,
  Chip,
  EmojiPicker,
  NumberStepper,
  SegmentedControl,
  Sheet,
  TextField,
  cx,
} from '../../ui';
import type { Child, ID, Mission, MissionRecurrence } from '../../types';
import { normalizeChildIds } from './grouping';
import { RECURRENCE_HELP, SUGGESTIONS } from './suggestions';

export interface MissionFormValues {
  title: string;
  emoji: string;
  points: number;
  recurrence: MissionRecurrence;
  childIds: ID[];
  active: boolean;
}

export interface MissionFormProps {
  open: boolean;
  /** Mission à modifier ; absent = création. */
  mission?: Mission | null;
  childrenList: Child[];
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: MissionFormValues) => void;
  onDelete?: () => void;
}

const EMPTY: MissionFormValues = { title: '', emoji: '🌟', points: 1, recurrence: 'daily', childIds: [], active: true };

const FORM_ID = 'ms-mission-form';

export function MissionForm({ open, mission, childrenList, busy, onClose, onSubmit, onDelete }: MissionFormProps) {
  const [v, setV] = useState<MissionFormValues>(EMPTY);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setV(
      mission
        ? {
            title: mission.title,
            emoji: mission.emoji,
            points: mission.points,
            recurrence: mission.recurrence,
            childIds: mission.childIds,
            active: mission.active,
          }
        : EMPTY,
    );
  }, [open, mission]);

  const patch = (p: Partial<MissionFormValues>) => setV((x) => ({ ...x, ...p }));
  const titleError = touched && !v.title.trim() ? 'Donne un nom à la mission.' : undefined;
  const allSelected = v.childIds.length === 0;

  const toggleKid = (id: ID) => {
    const current = allSelected ? childrenList.map((c) => c.id) : v.childIds;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    if (next.length === 0) return; // au moins un enfant
    patch({ childIds: normalizeChildIds(next, childrenList) });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!v.title.trim()) return;
    onSubmit({ ...v, title: v.title.trim() });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mission ? 'Modifier la mission' : 'Nouvelle mission'}
      description={mission ? undefined : 'Un petit défi pour gagner des points, un pas après l’autre.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Annuler
          </Button>
          <Button type="submit" form={FORM_ID} loading={busy}>
            {mission ? 'Enregistrer' : 'Créer la mission'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} className="ms-form" onSubmit={submit} noValidate>
        {!mission && (
          <section className="ms-form__sec" aria-labelledby="ms-sugg">
            <h3 id="ms-sugg" className="ms-form__h">
              Une idée ? Touche pour pré-remplir
            </h3>
            <div className="ms-sugg">
              {SUGGESTIONS.map((s) => (
                <Chip
                  key={s.title}
                  emoji={s.emoji}
                  selected={v.title === s.title}
                  onClick={() => patch({ title: s.title, emoji: s.emoji, points: s.points, recurrence: s.recurrence })}
                >
                  {s.title}
                </Chip>
              ))}
            </div>
          </section>
        )}

        <TextField
          label="Nom de la mission"
          value={v.title}
          maxLength={80}
          placeholder="Ex. : Ranger ses jouets"
          error={titleError}
          onChange={(e) => patch({ title: e.target.value })}
          data-autofocus
        />

        <EmojiPicker label="Emoji" value={v.emoji} onChange={(emoji) => patch({ emoji })} sets={['actions', 'animals', 'magic']} />

        <NumberStepper label="Points gagnés" unit="pts" min={1} max={100} value={v.points} onChange={(points) => patch({ points })} />

        <section className="ms-form__sec">
          <SegmentedControl<MissionRecurrence>
            label="Récurrence"
            value={v.recurrence}
            onChange={(recurrence) => patch({ recurrence })}
            options={[
              { value: 'daily', label: 'Chaque jour' },
              { value: 'weekly', label: 'Chaque semaine' },
              { value: 'once', label: 'Une fois' },
            ]}
          />
          <p className="ms-form__help" aria-live="polite">
            {RECURRENCE_HELP[v.recurrence]}
          </p>
        </section>

        {childrenList.length > 0 && (
          <section className="ms-form__sec" aria-labelledby="ms-kids-h">
            <h3 id="ms-kids-h" className="ms-form__h">
              Pour qui ?
            </h3>
            <div className="ms-form__kids">
              <Chip selected={allSelected} emoji="👨‍👩‍👧" onClick={() => patch({ childIds: [] })}>
                Tout le monde
              </Chip>
              {childrenList.map((c) => {
                const on = allSelected || v.childIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-label={c.name}
                    className={cx('ms-kid', on && 'is-done')}
                    onClick={() => toggleKid(c.id)}
                  >
                    <Avatar emoji={c.emoji} color={c.color} size="sm" selected={on} />
                    <span className="ms-kid__name" aria-hidden="true">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {mission && (
          <label className="ms-switch">
            <input type="checkbox" checked={v.active} onChange={(e) => patch({ active: e.target.checked })} />
            <span className="ms-switch__track" aria-hidden="true" />
            <span className="ms-switch__text">
              <strong>{v.active ? 'Mission active' : 'Mission en pause'}</strong>
              <small>{v.active ? 'Elle apparaît dans la liste des enfants.' : 'Cachée des enfants jusqu’à sa réactivation.'}</small>
            </span>
          </label>
        )}

        {mission && onDelete && (
          <Button variant="danger" type="button" icon="trash" onClick={onDelete}>
            Supprimer cette mission
          </Button>
        )}
      </form>
    </Sheet>
  );
}
