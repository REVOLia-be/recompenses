// PLACEHOLDER — à remplacer par l'écran « Coin Parent ».
import { useApp } from '../../state/AppState';
import { Avatar, Button, GlassCard, Screen } from '../../ui';
import { Placeholder } from '../_shared/Placeholder';

export function ParentsHome() {
  const { data, store, run } = useApp();
  if (!data) return null;
  return (
    <Screen title="Coin Parent" subtitle={`Famille ${data.family.name}`}>
      <GlassCard>
        <div className="row">
          <Avatar emoji={data.me.emoji} name={data.me.name} size="md" />
          <div className="grow">
            <p style={{ fontWeight: 800 }}>{data.me.name}</p>
            <p className="small muted">
              {data.me.roleLabel} · code d’invitation <strong>{data.family.inviteCode}</strong>
            </p>
          </div>
        </div>
      </GlassCard>
      <Placeholder emoji="🛠️" title="Réglages de la famille">
        Ici : enfants, bonnes actions, récompenses, missions, code parent et mode enfant.
      </Placeholder>
      {store.mode === 'supabase' && (
        <Button variant="secondary" icon="logout" block onClick={() => void run((s) => s.signOut())}>
          Se déconnecter
        </Button>
      )}
      {store.mode === 'local' && <p className="small muted center">Mode local : les données restent sur cet appareil.</p>}
    </Screen>
  );
}
