import { useRef, useState, type FormEvent } from 'react';
import { errorMessage, useApp } from '../../state/AppState';
import { Button, Chip, EmojiPicker, SegmentedControl, TextField } from '../../ui';
import { AuthLayout } from './AuthLayout';
import {
  hasErrors,
  INVITE_CODE_LENGTH,
  normalizeInviteCode,
  validateFamilySetup,
  type Errors,
} from './validation';

const ROLES = ['Papa', 'Maman'];
const OTHER = '__other__';

type Mode = 'create' | 'join';
type FieldErrors = Errors<'familyName' | 'inviteCode' | 'parentName' | 'roleLabel'>;

/** Créer sa famille ou rejoindre celle de l'autre parent (status « noFamily »). */
export function FamilySetupScreen() {
  const { store, refresh, celebrate, run } = useApp();
  const [mode, setMode] = useState<Mode>('create');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [parentName, setParentName] = useState('');
  const [role, setRole] = useState<string>('Maman');
  const [customRole, setCustomRole] = useState('');
  const [emoji, setEmoji] = useState('👩');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const refs = {
    familyName: useRef<HTMLInputElement>(null),
    inviteCode: useRef<HTMLInputElement>(null),
    parentName: useRef<HTMLInputElement>(null),
    roleLabel: useRef<HTMLInputElement>(null),
  };

  const codeLength = store.mode === 'supabase' ? INVITE_CODE_LENGTH : 6;
  const roleLabel = role === OTHER ? customRole.trim() : role;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const errs = validateFamilySetup({ mode, familyName, inviteCode, parentName, roleLabel }, codeLength);
    setErrors(errs);
    setFormError(null);
    if (hasErrors(errs)) {
      const first = (['familyName', 'inviteCode', 'parentName', 'roleLabel'] as const).find((k) => errs[k]);
      if (first) refs[first].current?.focus();
      return;
    }
    setLoading(true);
    const profile = { parentName: parentName.trim(), roleLabel, emoji };
    try {
      if (mode === 'create') await store.createFamily({ ...profile, familyName: familyName.trim() });
      else await store.joinFamily({ ...profile, inviteCode: normalizeInviteCode(inviteCode) });
      await refresh();
      celebrate({ message: 'Bienvenue dans la famille !', emoji: '🏡' });
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Bienvenue 💛"
      intro={
        mode === 'create'
          ? 'Crée l’espace de votre famille : tu pourras ensuite inviter l’autre parent.'
          : 'Saisis le code que l’autre parent t’a envoyé (Coin Parent, section « Les parents »).'
      }
    >
      <form className="stack" onSubmit={submit} noValidate>
        <SegmentedControl
          label="Créer ou rejoindre une famille"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setErrors({});
            setFormError(null);
          }}
          options={[
            { value: 'create', label: 'Créer notre famille' },
            { value: 'join', label: 'Rejoindre une famille' },
          ]}
        />

        {mode === 'create' ? (
          <TextField
            ref={refs.familyName}
            label="Nom de famille"
            placeholder="Les Martin"
            autoComplete="family-name"
            maxLength={60}
            value={familyName}
            error={errors.familyName}
            onChange={(e) => setFamilyName(e.target.value)}
          />
        ) : (
          <TextField
            ref={refs.inviteCode}
            className="auth-code"
            label="Code d’invitation"
            placeholder={'•'.repeat(codeLength)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={codeLength + 3}
            value={inviteCode}
            hint="Majuscules ou minuscules, comme tu veux."
            error={errors.inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        )}

        <TextField
          ref={refs.parentName}
          label="Ton prénom"
          autoComplete="given-name"
          maxLength={40}
          value={parentName}
          error={errors.parentName}
          onChange={(e) => setParentName(e.target.value)}
        />

        <fieldset className="auth-fieldset">
          <legend className="ui-field__label">Tu es…</legend>
          <div className="auth-roles">
            {ROLES.map((r) => (
              <Chip
                key={r}
                selected={role === r}
                onClick={() => {
                  setRole(r);
                  setErrors((x) => ({ ...x, roleLabel: undefined }));
                }}
              >
                {r}
              </Chip>
            ))}
            <Chip selected={role === OTHER} onClick={() => setRole(OTHER)}>
              Autre
            </Chip>
          </div>
          {role === OTHER && (
            <TextField
              ref={refs.roleLabel}
              label="Ton rôle"
              placeholder="Beau-papa, Mamie, Tonton…"
              maxLength={30}
              value={customRole}
              error={errors.roleLabel}
              onChange={(e) => setCustomRole(e.target.value)}
            />
          )}
        </fieldset>

        <EmojiPicker label="Ton emoji" value={emoji} onChange={setEmoji} sets={['people', 'animals', 'magic']} />

        {formError && (
          <p className="auth-form-error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" block loading={loading} icon="sparkle">
          {mode === 'create' ? 'Créer notre famille' : 'Rejoindre la famille'}
        </Button>
      </form>

      {store.mode === 'supabase' && (
        <p className="auth-switch">
          <button
            type="button"
            className="auth-link"
            onClick={() => void run((s) => s.signOut(), { allowInChildMode: true })}
          >
            Se déconnecter
          </button>
        </p>
      )}
    </AuthLayout>
  );
}
