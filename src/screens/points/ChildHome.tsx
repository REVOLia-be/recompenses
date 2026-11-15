// Accueil en mode enfant : lecture seule, centré sur l'enfant, ton encourageant.
import { Link } from 'react-router-dom';
import type { ID } from '../../types';
import { balance, weekPoints } from '../../domain/logic';
import { useFamilyData } from '../../state/AppState';
import { Avatar, GlassCard, Screen, formatPoints } from '../../ui';
import { EventList } from './EventList';
import { BigStar, weekText } from './parts';
import './points.css';

function cheer(week: number): string {
  if (week >= 20) return 'Quelle semaine incroyable, tu brilles comme une étoile ! 🌟';
  if (week >= 10) return 'Super semaine, continue comme ça ! 💪';
  if (week > 0) return 'C’est bien parti, chaque bon point compte ! ✨';
  return 'Une nouvelle semaine commence : à toi de briller ! 🌈';
}

export function ChildHome({ childId }: { childId: ID }) {
  const data = useFamilyData();
  const child = data.children.find((c) => c.id === childId);
  if (!child) return null;
  const bal = balance(data.events, child.id);
  const week = weekPoints(data.events, child.id);
  const mine = data.events.filter((e) => e.childId === child.id);
  const recent = mine.slice(0, 8);

  return (
    <Screen title={`Coucou ${child.name} ! 🌟`} subtitle="Voici tes bons points" className="pts-screen pts-screen--child">
      <GlassCard strong className="pts-me">
        <Avatar emoji={child.emoji} color={child.color} size="xl" />
        <div className="pts-me__bal" aria-label={`Tu as ${formatPoints(bal)}`} role="img">
          <BigStar size={44} />
          <span className="pts-me__num" aria-hidden="true">
            {bal}
          </span>
          <span className="pts-me__unit" aria-hidden="true">
            {Math.abs(bal) > 1 ? 'points' : 'point'}
          </span>
        </div>
        <p className={`pts-me__week${week > 0 ? ' is-up' : ''}`}>{weekText(week)}</p>
        <p className="pts-me__cheer">{cheer(week)}</p>
      </GlassCard>

      <section className="stack" style={{ ['--gap' as string]: 'var(--s-3)' }} aria-labelledby="pts-child-recent">
        <div className="row-between">
          <h2 id="pts-child-recent" className="section-title">
            Tes derniers points
          </h2>
          {mine.length > recent.length && (
            <Link to="/historique" className="pts-link">
              Tout voir
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <GlassCard>
            <p className="muted center">Tes premiers bons points vont bientôt arriver ici. Courage ! 🍀</p>
          </GlassCard>
        ) : (
          <GlassCard padding="sm">
            <EventList events={recent} children={data.children} parents={data.parents} showChild={false} allowUndo={false} />
          </GlassCard>
        )}
      </section>
    </Screen>
  );
}
