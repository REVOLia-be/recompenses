import { useRef, useState, type FormEvent } from 'react';
import { useApp } from '../../state/AppState';
import type { Child } from '../../types';
import { Avatar, Button, EmojiPicker, Sheet, TextField } from '../../ui';
import {
  AVATAR_COLORS,
  DEFAULT_COMPANION_NAME,
  NAME_MAX,
  todayIso,
  validateChildForm,
} from './validation';

/** Ajout / modification d'un enfant. À monter uniquement quand il doit être ouvert (l'état se réinitialise). */
export function ChildFormSheet({ child, onClose }: { child?: Child; onClose: () => void }) {
  const { run } = useApp();
  const [name, setName] = useState(child?.name ?? '');
  const [emoji, setEmoji] = useState(child?.emoji ?? '🐣');
  const [color, setColor] = useState(child?.color ?? AVATAR_COLORS[0].value);
  const [birthdate, setBirthdate] = useState(child?.birthdate ?? '');
  const [companionName, setCompanionName] = useState(child?.companionName ?? DEFAULT_COMPANION_NAME);
  const [errors, setErrors] = useState<ReturnType<typeof validateChildForm>>({});
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const birthRef = useRef<HTMLInputElement>(null);
  const companionRef = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const errs = validateChildForm({ name, birthdate, companionName });
    setErrors(errs);
    if (errs.name) return nameRef.current?.focus();
    if (errs.birthdate) return birthRef.current?.focus();
    if (errs.companionName) return companionRef.current?.focus();
    setSaving(true);
    const ok = await run(
      async (s) => {
        await s.upsertChild({
          id: child?.id,
          name: name.trim(),
          emoji,
          color,
          birthdate: birthdate || null,
          companionName: companionName.trim(),
        });
        return true;
      },
      { success: child ? `${name.trim()} est à jour ✨` : `${name.trim()} a rejoint la famille 🎉` },
    );
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={child ? `Modifier ${child.name}` : 'Ajouter un enfant'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="par-child-form" loading={saving}>
            {child ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>
      }
    >
      <form id="par-child-form" className="stack" onSubmit={submit} noValidate>
        <div className="par-form-preview">
          <Avatar emoji={emoji} color={color} size="xl" />
        </div>
        <TextField
          ref={nameRef}
          label="Prénom"
          autoComplete="off"
          maxLength={NAME_MAX}
          value={name}
          error={errors.name}
          data-autofocus
          onChange={(e) => setName(e.target.value)}
        />
        <EmojiPicker label="Emoji" value={emoji} onChange={setEmoji} sets={['animals', 'people', 'magic']} />
        <fieldset className="par-fieldset">
          <legend className="ui-field__label">Couleur de l’avatar</legend>
          <div className="par-swatches">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                className="par-swatch"
                style={{ ['--sw' as string]: c.value }}
                aria-pressed={color === c.value}
                aria-label={c.name}
                onClick={() => setColor(c.value)}
              />
            ))}
          </div>
        </fieldset>
        <TextField
          ref={birthRef}
          label="Date de naissance (facultatif)"
          type="date"
          max={todayIso()}
          min="1900-01-01"
          value={birthdate}
          error={errors.birthdate}
          hint="Sert uniquement à afficher son âge."
          onChange={(e) => setBirthdate(e.target.value)}
        />
        <TextField
          ref={companionRef}
          label="Nom du compagnon"
          maxLength={NAME_MAX}
          value={companionName}
          error={errors.companionName}
          hint="Le petit animal qui grandit avec ses points."
          onChange={(e) => setCompanionName(e.target.value)}
        />
      </form>
    </Sheet>
  );
}
