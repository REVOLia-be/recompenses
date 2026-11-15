// PLACEHOLDER fonctionnel minimal — créer ou rejoindre une famille (status 'noFamily').
import { useState, type FormEvent } from 'react';
import { useApp } from '../../state/AppState';
import { Button, Chip, EmojiPicker, GlassCard, Screen, SegmentedControl, TextField } from '../../ui';

const ROLES = ['Papa', 'Maman', 'Parent'];

export function FamilySetupScreen() {
  const { run, store } = useApp();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [parentName, setParentName] = useState('');
  const [roleLabel, setRoleLabel] = useState('Parent');
  const [emoji, setEmoji] = useState('🙂');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const profile = { parentName, roleLabel, emoji };
    await run(
      (s) => (tab === 'create' ? s.createFamily({ ...profile, familyName }) : s.joinFamily({ ...profile, inviteCode })),
      { celebrate: { message: 'Bienvenue !', emoji: '🏡' } },
    );
    setLoading(false);
  };

  return (
    <Screen title="Bienvenue !" subtitle="Créons votre espace famille">
      <GlassCard as="section" padding="lg">
        <form className="stack" onSubmit={submit}>
          <SegmentedControl
            label="Créer ou rejoindre"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'create', label: 'Créer une famille' },
              { value: 'join', label: 'Rejoindre' },
            ]}
          />
          {tab === 'create' ? (
            <TextField
              label="Nom de la famille"
              placeholder="Les Martin"
              required
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
          ) : (
            <TextField
              label="Code d’invitation"
              placeholder="ABC123"
              autoCapitalize="characters"
              required
              hint={store.mode === 'local' ? 'En mode local, les données restent sur cet appareil.' : 'Demandez-le à l’autre parent (Coin Parent).'}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          )}
          <TextField label="Votre prénom" required autoComplete="given-name" value={parentName} onChange={(e) => setParentName(e.target.value)} />
          <div className="stack" style={{ ['--gap' as string]: '8px' }}>
            <span className="ui-field__label">Vous êtes</span>
            <div className="row wrap" style={{ ['--gap' as string]: '8px' }}>
              {ROLES.map((r) => (
                <Chip key={r} selected={roleLabel === r} onClick={() => setRoleLabel(r)}>
                  {r}
                </Chip>
              ))}
            </div>
          </div>
          <EmojiPicker label="Votre emoji" value={emoji} onChange={setEmoji} sets={['people', 'animals']} />
          <Button type="submit" size="lg" block loading={loading} icon="sparkle">
            {tab === 'create' ? 'Créer notre famille' : 'Rejoindre la famille'}
          </Button>
        </form>
      </GlassCard>
    </Screen>
  );
}
