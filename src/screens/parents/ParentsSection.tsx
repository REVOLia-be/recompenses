import { useState } from 'react';
import { useApp } from '../../state/AppState';
import type { FamilyData, Parent } from '../../types';
import { ageFromBirthdate } from '../../domain/logic';
import { Avatar, Button, GlassCard, IconButton, Sheet, TextField } from '../../ui';
import { InviteCard } from './InviteCard';
import { ParentProfileSheet } from './ParentProfileSheet';
import { formatAge, validateFamilyName } from './validation';

function ParentRow({ parent, isMe, onEdit }: { parent: Parent; isMe: boolean; onEdit: () => void }) {
  const age = formatAge(ageFromBirthdate(parent.birthdate));
  return (
    <li className="par-row">
      <Avatar emoji={parent.emoji} size="md" />
      <div className="par-row__text">
        <p className="par-row__name">
          {parent.name}
          {isMe && <span className="par-me"> · toi</span>}
        </p>
        <p className="small muted par-ellipsis">{[parent.roleLabel, age].filter(Boolean).join(' · ')}</p>
        {parent.email && <p className="small muted par-ellipsis">{parent.email}</p>}
      </div>
      {isMe && <IconButton label="Modifier mon profil" icon="pencil" onClick={onEdit} />}
    </li>
  );
}

function RenameFamilySheet({ name, onClose }: { name: string; onClose: () => void }) {
  const { run } = useApp();
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const err = validateFamilyName(value);
    setError(err);
    if (err) return;
    setSaving(true);
    const ok = await run(
      async (s) => {
        await s.renameFamily(value.trim());
        return true;
      },
      { success: 'Nom de famille mis à jour ✨' },
    );
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Renommer la famille"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => void save()} loading={saving}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <TextField
          label="Nom de famille"
          maxLength={60}
          value={value}
          error={error}
          data-autofocus
          onChange={(e) => setValue(e.target.value)}
        />
      </form>
    </Sheet>
  );
}

export function ParentsSection({ data }: { data: FamilyData }) {
  const [editing, setEditing] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const me = data.parents.find((p) => p.id === data.me.id) ?? data.me;
  const ordered = [...data.parents].sort((a, b) => (a.id === me.id ? -1 : b.id === me.id ? 1 : 0));

  return (
    <section className="par-section" aria-labelledby="par-parents-title">
      <h2 id="par-parents-title" className="section-title">
        Les parents
      </h2>
      <GlassCard padding="sm">
        <ul className="par-list">
          {ordered.map((p) => (
            <ParentRow key={p.id} parent={p} isMe={p.id === me.id} onEdit={() => setEditing(true)} />
          ))}
        </ul>
        {data.parents.length > 1 && <p className="small muted par-note">Chacun modifie uniquement son propre profil.</p>}
      </GlassCard>
      <InviteCard family={data.family} />
      <GlassCard padding="sm">
        <div className="par-row">
          <span className="par-row__icon emoji" aria-hidden="true">
            🏡
          </span>
          <div className="par-row__text">
            <p className="small muted">Nom de la famille</p>
            <p className="par-row__name">{data.family.name}</p>
          </div>
          <IconButton label="Renommer la famille" icon="pencil" onClick={() => setRenaming(true)} />
        </div>
      </GlassCard>
      {editing && <ParentProfileSheet parent={me} onClose={() => setEditing(false)} />}
      {renaming && <RenameFamilySheet name={data.family.name} onClose={() => setRenaming(false)} />}
    </section>
  );
}
