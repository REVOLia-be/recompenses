import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { ageFromBirthdate, balance, lifetimePoints, weekPoints } from '../../domain/logic';
import { Avatar, Button, GlassCard, Screen, formatPoints } from '../../ui';
import { ChildFormSheet } from './ChildFormSheet';
import { useChildModeLauncher } from './ChildModeLauncher';
import { DeleteChildDialog } from './DeleteChildDialog';
import { formatAge } from './validation';

/** Fiche d'un enfant : solde, points de la semaine, total gagné, actions. */
export function ChildScreen() {
  const { id } = useParams();
  const { data } = useApp();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const launcher = useChildModeLauncher();
  const child = data?.children.find((c) => c.id === id);
  if (!data) return null;
  if (!child) return <Navigate to="/parents" replace />;

  const age = formatAge(ageFromBirthdate(child.birthdate));
  const stats = [
    { label: 'Solde actuel', value: balance(data.events, child.id), main: true },
    { label: 'Cette semaine', value: weekPoints(data.events, child.id) },
    { label: 'Total gagné', value: lifetimePoints(data.events, child.id) },
  ];

  return (
    <Screen title={child.name} subtitle={age ?? undefined} back="/parents">
      <GlassCard strong>
        <div className="par-hero">
          <Avatar emoji={child.emoji} color={child.color} size="xl" name={child.name} />
          <p className="muted">
            Compagnon : <strong>{child.companionName || '—'}</strong>
          </p>
        </div>
      </GlassCard>

      <section aria-label="Points" className="par-stats">
        {stats.map((s) => (
          <GlassCard key={s.label} padding="sm" className={s.main ? 'par-stat par-stat--main' : 'par-stat'}>
            <p className="par-stat__value">{formatPoints(s.value)}</p>
            <p className="small muted">{s.label}</p>
          </GlassCard>
        ))}
      </section>

      <Button size="lg" block icon="lock" onClick={() => launcher.start(child.id)}>
        Passer en mode enfant
      </Button>
      <div className="par-actions par-actions--pair">
        <Button variant="secondary" icon="pencil" onClick={() => setEditing(true)}>
          Modifier
        </Button>
        <Button variant="danger" icon="trash" onClick={() => setDeleting(true)}>
          Supprimer
        </Button>
      </div>

      {editing && <ChildFormSheet child={child} onClose={() => setEditing(false)} />}
      {deleting && (
        <DeleteChildDialog child={child} onClose={() => setDeleting(false)} onDeleted={() => navigate('/parents', { replace: true })} />
      )}
      {launcher.node}
    </Screen>
  );
}
