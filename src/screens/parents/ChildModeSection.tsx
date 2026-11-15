import { useApp } from '../../state/AppState';
import { Button, GlassCard } from '../../ui';
import { CHILD_MODE_EXPLANATION, useChildModeLauncher } from './ChildModeLauncher';

export function ChildModeSection() {
  const { hasPin, data } = useApp();
  const launcher = useChildModeLauncher();
  const noChild = (data?.children.length ?? 0) === 0;

  return (
    <section className="par-section" aria-labelledby="par-childmode-title">
      <h2 id="par-childmode-title" className="section-title">
        Mode enfant
      </h2>
      <GlassCard className="par-stack">
        <p>{CHILD_MODE_EXPLANATION}</p>
        <p className="small muted">
          {hasPin ? 'Un code parent est défini sur cet appareil. 🔒' : 'Aucun code parent défini pour le moment : il faut en choisir un d’abord.'}
        </p>
        <div className="par-actions">
          <Button variant="secondary" icon="lock" onClick={launcher.openPinSetup}>
            {hasPin ? 'Modifier le code parent' : 'Définir le code parent'}
          </Button>
          <Button icon="unlock" disabled={noChild} onClick={() => launcher.start()}>
            Passer en mode enfant
          </Button>
        </div>
        {noChild && <p className="small muted">Ajoute d’abord un enfant.</p>}
      </GlassCard>
      {launcher.node}
    </section>
  );
}
