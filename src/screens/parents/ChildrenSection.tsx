import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FamilyData } from '../../types';
import { ageFromBirthdate, balance } from '../../domain/logic';
import { Avatar, Button, EmptyState, GlassCard, Icon, PointsBadge } from '../../ui';
import { ChildFormSheet } from './ChildFormSheet';
import { formatAge } from './validation';

export function ChildrenSection({ data }: { data: FamilyData }) {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  return (
    <section className="par-section" aria-labelledby="par-children-title">
      <h2 id="par-children-title" className="section-title">
        Les enfants
      </h2>
      {data.children.length === 0 ? (
        <GlassCard>
          <EmptyState
            emoji="🐣"
            title="Aucun enfant pour l’instant"
            message="Ajoute ton premier enfant pour commencer à distribuer des bons points."
          />
        </GlassCard>
      ) : (
        <GlassCard padding="sm">
          <ul className="par-list">
            {data.children.map((c) => {
              const age = formatAge(ageFromBirthdate(c.birthdate));
              return (
                <li key={c.id}>
                  <button type="button" className="par-row par-row--button" onClick={() => navigate(`/parents/enfants/${c.id}`)}>
                    <Avatar emoji={c.emoji} color={c.color} size="md" />
                    <span className="par-row__text">
                      <span>
                        <span className="par-row__name">{c.name}</span>
                        {age && <span className="small muted"> · {age}</span>}
                      </span>
                      <span className="par-row__sub small muted">Voir la fiche</span>
                    </span>
                    <PointsBadge points={balance(data.events, c.id)} size="sm" tone="auto" />
                    <Icon name="chevronRight" size={20} />
                  </button>
                </li>
              );
            })}
          </ul>
        </GlassCard>
      )}
      <Button variant="secondary" icon="plus" block onClick={() => setAdding(true)}>
        Ajouter un enfant
      </Button>
      {adding && <ChildFormSheet onClose={() => setAdding(false)} />}
    </section>
  );
}
