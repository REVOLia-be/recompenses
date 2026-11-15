// Onglet « Bons points » (accueil) : sélection des enfants, distribution rapide, derniers points.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Child } from '../../types';
import { balance, familyTotal, weekPoints } from '../../domain/logic';
import { useApp, useFamilyData } from '../../state/AppState';
import { Avatar, Button, EmptyState, GlassCard, Icon, Screen, formatPoints } from '../../ui';
import { AwardSheet } from './AwardSheet';
import { EventList } from './EventList';
import { ChildHome } from './ChildHome';
import { joinNames } from './time';
import { BigStar, weekText } from './parts';
import './points.css';

export function PointsHome() {
  const { childMode } = useApp();
  return childMode ? <ChildHome childId={childMode} /> : <ParentHome />;
}

function ParentHome() {
  const data = useFamilyData();
  const { selectedChildIds, selectedChildren, toggleChild } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const kids = data.children;
  const total = familyTotal(data);
  const greeting = data.me.roleLabel || data.me.name;
  const recent = data.events.slice(0, 8);

  return (
    <Screen title={`Bonjour ${greeting} ! 👋`} subtitle={`Famille ${data.family.name}`} className="pts-screen">
      <GlassCard strong className="pts-total" aria-label={`${total} ${Math.abs(total) > 1 ? 'points gagnés' : 'point gagné'} en famille`}>
        <BigStar />
        <p className="pts-total__text" aria-hidden="true">
          <span className="pts-total__num">{total}</span>
          <span className="pts-total__caption">{Math.abs(total) > 1 ? 'points gagnés' : 'point gagné'} en famille</span>
        </p>
      </GlassCard>

      {kids.length === 0 ? (
        <GlassCard>
          <EmptyState
            emoji="🧒"
            title="Aucun enfant pour l’instant"
            message="Ajoute tes enfants dans le Coin Parent pour commencer à distribuer des bons points."
            action={
              <Button icon="plus" onClick={() => navigate('/parents')}>
                Aller au Coin Parent
              </Button>
            }
          />
        </GlassCard>
      ) : (
        <>
          <section className="stack" style={{ ['--gap' as string]: 'var(--s-3)' }} aria-labelledby="pts-kids-help">
            <p id="pts-kids-help" className="pts-help">
              {kids.length > 1
                ? 'Sélectionne un ou plusieurs enfants pour leur ajouter des bons points.'
                : `Ajoute des bons points à ${kids[0].name} en deux taps.`}
            </p>
            <div className={`pts-kids${kids.length === 1 ? ' pts-kids--single' : ''}`}>
              {kids.map((c) => (
                <KidTile
                  key={c.id}
                  child={c}
                  bal={balance(data.events, c.id)}
                  week={weekPoints(data.events, c.id)}
                  selected={selectedChildIds.includes(c.id)}
                  onToggle={kids.length > 1 ? () => toggleChild(c.id) : undefined}
                />
              ))}
            </div>
          </section>

          <div className="pts-cta">
            <Button
              block
              size="lg"
              className="pts-cta__btn"
              disabled={selectedChildIds.length === 0}
              onClick={() => setOpen(true)}
            >
              Ajouter des bons points ✨
            </Button>
            <p className="pts-cta__for small muted" aria-live="polite">
              {selectedChildren.length > 0 ? `Pour ${joinNames(selectedChildren.map((c) => c.name))}` : 'Choisis un enfant'}
            </p>
          </div>
        </>
      )}

      {kids.length > 0 && (
        <section className="stack" style={{ ['--gap' as string]: 'var(--s-3)' }} aria-labelledby="pts-recent-title">
          <div className="row-between">
            <h2 id="pts-recent-title" className="section-title">
              Derniers points
            </h2>
            {data.events.length > 0 && (
              <Link to="/historique" className="pts-link">
                Tout l’historique
              </Link>
            )}
          </div>
          {recent.length === 0 ? (
            <GlassCard>
              <p className="muted center">Les bons points distribués apparaîtront ici. À toi de jouer ! 🌟</p>
            </GlassCard>
          ) : (
            <GlassCard padding="sm">
              <EventList events={recent} children={kids} parents={data.parents} />
            </GlassCard>
          )}
        </section>
      )}

      <AwardSheet open={open} onClose={() => setOpen(false)} />
    </Screen>
  );
}

function KidTile({
  child,
  bal,
  week,
  selected,
  onToggle,
}: {
  child: Child;
  bal: number;
  week: number;
  selected: boolean;
  onToggle?: () => void;
}) {
  const content = (
    <>
      <Avatar emoji={child.emoji} color={child.color} size="lg" selected={selected} />
      <span className="pts-kid__name">{child.name}</span>
      <span className="pts-kid__bal">
        <Icon name="starFilled" size={18} />
        {formatPoints(bal)}
      </span>
      <span className={`pts-kid__week${week > 0 ? ' is-up' : ''}`}>{weekText(week)}</span>
    </>
  );
  if (!onToggle) {
    return <div className={`pts-kid is-selected is-static`}>{content}</div>;
  }
  return (
    <button
      type="button"
      className={`pts-kid${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      onClick={onToggle}
      aria-label={`${child.name}, ${formatPoints(bal)}, ${weekText(week)}`}
    >
      {content}
    </button>
  );
}
