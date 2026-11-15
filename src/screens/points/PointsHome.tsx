// PLACEHOLDER — à remplacer par l'écran « Bons points ».
import { Link } from 'react-router-dom';
import { balance } from '../../domain/logic';
import { useApp } from '../../state/AppState';
import { Avatar, GlassCard, PointsBadge, Screen } from '../../ui';
import { Placeholder } from '../_shared/Placeholder';

export function PointsHome() {
  const { data, selectedChildIds, toggleChild } = useApp();
  const kids = data?.children ?? [];
  return (
    <Screen title="Bons points" subtitle={data ? `Famille ${data.family.name}` : undefined}>
      {kids.length > 0 ? (
        <GlassCard>
          <div className="row wrap" style={{ ['--gap' as string]: '20px' }}>
            {kids.map((c) => (
              <div key={c.id} className="stack" style={{ alignItems: 'center', ['--gap' as string]: '6px' }}>
                <Avatar
                  emoji={c.emoji}
                  color={c.color}
                  name={c.name}
                  showName
                  size="lg"
                  selected={selectedChildIds.includes(c.id)}
                  onClick={() => toggleChild(c.id)}
                />
                <PointsBadge points={balance(data?.events ?? [], c.id)} />
              </div>
            ))}
          </div>
        </GlassCard>
      ) : (
        <Placeholder emoji="🧒" title="Aucun enfant pour l’instant">
          Ajoutez vos enfants dans le <Link to="/parents">Coin Parent</Link> pour commencer à distribuer des bons points.
        </Placeholder>
      )}
      <Placeholder emoji="⭐" title="Distribution des bons points">
        Ici : les bonnes actions en un tap, les points manuels et le journal.
      </Placeholder>
    </Screen>
  );
}
