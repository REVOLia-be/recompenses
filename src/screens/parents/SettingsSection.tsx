import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { Button, ConfirmDialog, GlassCard, Icon } from '../../ui';
import pkg from '../../../package.json';

export function SettingsSection() {
  const { store, run, session } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const synced = store.mode === 'supabase';

  const signOut = async () => {
    setBusy(true);
    await run(async (s) => {
      await s.signOut();
      return true;
    });
    setBusy(false);
    setConfirming(false);
  };

  return (
    <section className="par-section" aria-labelledby="par-settings-title">
      <h2 id="par-settings-title" className="section-title">
        Réglages
      </h2>
      <GlassCard padding="sm">
        <ul className="par-list">
          <li className="par-row">
            <span className="par-row__icon emoji" aria-hidden="true">
              {synced ? '☁️' : '📱'}
            </span>
            <div className="par-row__text">
              <p className="par-row__name">{synced ? 'Synchronisé entre vos appareils' : 'Données sur cet appareil uniquement'}</p>
              {synced && session?.email && <p className="small muted par-ellipsis">Connecté : {session.email}</p>}
              {!synced && <p className="small muted">Elles ne partent pas sur internet.</p>}
            </div>
          </li>
          <li>
            <Link to="/actions" className="par-row par-row--button">
              <span className="par-row__icon emoji" aria-hidden="true">
                ⭐
              </span>
              <span className="par-row__text">
                <span className="par-row__name">Gérer les bonnes actions</span>
                <span className="par-row__sub small muted">Ajouter, modifier, réordonner</span>
              </span>
              <Icon name="chevronRight" size={20} />
            </Link>
          </li>
        </ul>
      </GlassCard>
      {synced && (
        <Button variant="secondary" icon="logout" block onClick={() => setConfirming(true)}>
          Se déconnecter
        </Button>
      )}
      <p className="small muted center">Pépites · version {pkg.version}</p>
      {confirming && (
        <ConfirmDialog
          open
          title="Te déconnecter ?"
          message="Tes données restent bien au chaud dans la famille. Tu pourras te reconnecter avec ton e-mail et ton mot de passe."
          confirmLabel="Me déconnecter"
          busy={busy}
          onCancel={() => setConfirming(false)}
          onConfirm={signOut}
        />
      )}
    </section>
  );
}
