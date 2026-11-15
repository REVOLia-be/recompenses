// Route /historique : journal complet groupé par jour, filtrable par enfant.
import { useMemo, useState } from 'react';
import { useApp, useFamilyData } from '../../state/AppState';
import { Button, Chip, GlassCard, PointsBadge, Screen } from '../../ui';
import { EventList, useNow } from './EventList';
import { dayLabel, groupByDay } from './time';
import './points.css';

const PAGE = 60;

export function HistoryScreen() {
  const data = useFamilyData();
  const { childMode } = useApp();
  const now = useNow();
  const [filter, setFilter] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);

  // En mode enfant, l'historique est restreint à l'enfant.
  const childFilter = childMode ?? filter;
  const events = useMemo(
    () => (childFilter ? data.events.filter((e) => e.childId === childFilter) : data.events),
    [data.events, childFilter],
  );
  const shown = events.slice(0, limit);
  const groups = groupByDay(shown);
  const kids = data.children;
  const child = childMode ? kids.find((c) => c.id === childMode) : undefined;

  return (
    <Screen
      title={child ? 'Tout ton historique' : 'Historique'}
      subtitle={child ? `Les points de ${child.name}` : 'Tous les points de la famille'}
      back="/"
      className="pts-screen"
    >
      {!childMode && kids.length > 1 && (
        <div className="pts-filters" role="group" aria-label="Filtrer par enfant">
          <Chip
            selected={filter === null}
            onClick={() => {
              setFilter(null);
              setLimit(PAGE);
            }}
          >
            Tous
          </Chip>
          {kids.map((c) => (
            <Chip
              key={c.id}
              emoji={c.emoji}
              selected={filter === c.id}
              onClick={() => {
                setFilter(c.id);
                setLimit(PAGE);
              }}
            >
              {c.name}
            </Chip>
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <GlassCard>
          <p className="muted center">Aucun point pour l’instant. Les premiers arrivent bientôt ! 🌟</p>
        </GlassCard>
      ) : (
        groups.map((g) => {
          const sum = g.items.reduce((s, e) => s + e.points, 0);
          return (
            <section key={g.key} className="stack" style={{ ['--gap' as string]: 'var(--s-2)' }} aria-label={dayLabel(g.key, now)}>
              <div className="row-between pts-day">
                <h2 className="pts-day__title">{dayLabel(g.key, now)}</h2>
                <PointsBadge points={sum} signed size="sm" tone="glass" />
              </div>
              <GlassCard padding="sm">
                <EventList
                  events={g.items}
                  children={kids}
                  parents={data.parents}
                  showChild={!childFilter}
                  showAuthor={!childMode}
                  clock
                />
              </GlassCard>
            </section>
          );
        })
      )}

      {events.length > shown.length && (
        <Button variant="secondary" block onClick={() => setLimit((n) => n + PAGE)}>
          Voir plus ancien
        </Button>
      )}
    </Screen>
  );
}
