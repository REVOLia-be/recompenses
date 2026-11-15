import { useRef, useState, type FormEvent } from 'react';
import { useApp } from '../../state/AppState';
import type { Parent } from '../../types';
import { Button, Chip, EmojiPicker, Sheet, TextField } from '../../ui';
import { NAME_MAX, todayIso, validateParentForm } from './validation';

const OTHER = '__other__';
const PRESET = ['Papa', 'Maman'];

/** Modification de son propre profil de parent. À monter quand il doit être ouvert. */
export function ParentProfileSheet({ parent, onClose }: { parent: Parent; onClose: () => void }) {
  const { run, store } = useApp();
  const isPreset = PRESET.includes(parent.roleLabel);
  const [name, setName] = useState(parent.name);
  const [role, setRole] = useState(isPreset ? parent.roleLabel : OTHER);
  const [customRole, setCustomRole] = useState(isPreset ? '' : parent.roleLabel);
  const [emoji, setEmoji] = useState(parent.emoji);
  const [birthdate, setBirthdate] = useState(parent.birthdate ?? '');
  const [errors, setErrors] = useState<ReturnType<typeof validateParentForm>>({});
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const birthRef = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const roleLabel = role === OTHER ? customRole.trim() : role;
    const errs = validateParentForm({ name, roleLabel, birthdate });
    setErrors(errs);
    if (errs.name) return nameRef.current?.focus();
    if (errs.roleLabel) return roleRef.current?.focus();
    if (errs.birthdate) return birthRef.current?.focus();
    setSaving(true);
    const ok = await run(
      async (s) => {
        await s.updateParent(parent.id, { name: name.trim(), roleLabel, emoji, birthdate: birthdate || null });
        return true;
      },
      { success: 'Ton profil est à jour ✨' },
    );
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Mon profil"
      description={parent.email ?? undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="par-parent-form" loading={saving}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="par-parent-form" className="stack" onSubmit={submit} noValidate>
        <TextField
          ref={nameRef}
          label="Prénom"
          autoComplete="given-name"
          maxLength={NAME_MAX}
          value={name}
          error={errors.name}
          data-autofocus
          onChange={(e) => setName(e.target.value)}
        />
        <fieldset className="par-fieldset">
          <legend className="ui-field__label">Rôle</legend>
          <div className="par-chips">
            {PRESET.map((r) => (
              <Chip key={r} selected={role === r} onClick={() => setRole(r)}>
                {r}
              </Chip>
            ))}
            <Chip selected={role === OTHER} onClick={() => setRole(OTHER)}>
              Autre
            </Chip>
          </div>
          {role === OTHER && (
            <TextField
              ref={roleRef}
              label="Ton rôle"
              placeholder="Beau-papa, Mamie, Tonton…"
              maxLength={30}
              value={customRole}
              error={errors.roleLabel}
              onChange={(e) => setCustomRole(e.target.value)}
            />
          )}
        </fieldset>
        <EmojiPicker label="Emoji" value={emoji} onChange={setEmoji} sets={['people', 'animals', 'magic']} />
        <TextField
          ref={birthRef}
          label="Date de naissance (facultatif)"
          type="date"
          max={todayIso()}
          min="1900-01-01"
          value={birthdate}
          error={errors.birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
        />
        {store.mode === 'local' && <p className="small muted">Les autres parents ne peuvent modifier que leur propre profil.</p>}
      </form>
    </Sheet>
  );
}
