// Onglet « Cadeaux » : liste des récompenses (tri, favoris, progression de l'enfant concerné).
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Child, Reward } from '../../types';
import { rewardStatus } from '../../domain/logic';
import { useApp, useFamilyData } from '../../state/AppState';
import { Avatar, Button, Chip, EmptyState, Icon, PointsBadge, ProgressBar, Screen, SegmentedControl, cx } from '../../ui';
import { CategoryPill, RewardThumb, WeeklyBadge } from './RewardBits';
import { filterRewards, plural, sortRewards, SORT_OPTIONS, type RewardSort } from './rewardUtils';
import { toDraft, useFocusChild } from './shared';
import './rewards.css';

const SORT_KEY = 'pepites:rw:sort';
const FAV_KEY = 'pepites:rw:fav';

function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writePref(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* préférence non mémorisée : sans gravité */
  }
}

export function RewardsHome() {
  const data = useFamilyData();
  const { childMode, selectedChildIds, toggleChild } = useApp();
  const navigate = useNavigate();
  const focus = useFocusChild();
  const [sort, setSort] = useState<RewardSort>(() => {
    const v = readPref(SORT_KEY);
    return v === 'az' || v === 'recent' || v === 'points' ? v : 'points';
  });
  const [favOnly, setFavOnly] = useState(() => readPref(FAV_KEY) === '1');

  const rewards = useMemo(() => sortRewards(filterRewards(data.rewards, favOnly), sort), [data.rewards, favOnly, sort]);
  const isParent = !childMode;
  const kids = data.children;

  const changeSort = (v: RewardSort) => {
    setSort(v);
    writePref(SORT_KEY, v);
  };
  const changeFav = () => {
    setFavOnly((f) => {
      writePref(FAV_KEY, f ? '0' : '1');
      return !f;
    });
  };

  const header = (
    <div className="rw-head stack">
      {isParent && (
        <Button size="lg" block icon="plus" onClick={() => navigate('/cadeaux/nouveau')}>
          Ajouter une récompense
        </Button>
      )}
      {isParent && kids.length > 1 && (
        <div className="rw-kids" role="group" aria-label="Voir la progression de">
          <span className="rw-kids__label small">Progression de :</span>
          <div className="rw-kids__list">
            {kids.map((c) => (
              <Avatar
                key={c.id}
                emoji={c.emoji}
                color={c.color}
                name={c.name}
                size={44}
                selected={selectedChildIds.includes(c.id)}
                onClick={() => toggleChild(c.id)}
              />
            ))}
          </div>
        </div>
      )}
      {data.rewards.length > 0 && (
        <div className="rw-toolbar">
          <SegmentedControl label="Trier les récompenses" options={SORT_OPTIONS} value={sort} onChange={changeSort} className="rw-toolbar__sort" />
          <Chip selected={favOnly} onClick={changeFav} className="rw-favchip" aria-label="Seulement les favoris">
            <span aria-hidden="true" className="rw-favchip__heart">
              <Icon name="heart" size={20} />
            </span>
          </Chip>
        </div>
      )}
    </div>
  );

  return (
    <Screen
      title="Cadeaux"
      subtitle="Débloque tes cadeaux grâce à tes bons points ✨"
      action={childMode ? <span className="rw-lock-space" aria-hidden="true" /> : undefined}
      headerExtra={header}
    >
      {isParent && kids.length > 1 && !focus && data.rewards.length > 0 && (
        <p className="rw-hint small muted">Choisis un seul enfant pour voir sa progression sur chaque carte.</p>
      )}
      {data.rewards.length === 0 ? (
        <EmptyState
          emoji="🎁"
          title={isParent ? 'Ta vitrine à cadeaux est vide' : 'Pas encore de cadeaux'}
          message={
            isParent
              ? 'Ajoute une première récompense : une glace, un film en famille… ou l’équitation du samedi comme objectif de la semaine !'
              : 'Demande à papa ou maman d’ajouter des cadeaux à débloquer avec tes bons points 🌟'
          }
          action={
            isParent ? (
              <Button icon="plus" onClick={() => navigate('/cadeaux/nouveau')}>
                Créer une récompense
              </Button>
            ) : undefined
          }
        />
      ) : rewards.length === 0 ? (
        <EmptyState
          emoji="💖"
          title="Aucun favori pour l’instant"
          message={isParent ? 'Touche le cœur d’une récompense pour la retrouver ici.' : 'Aucun cadeau favori pour le moment.'}
          action={
            <Button variant="secondary" onClick={changeFav}>
              Voir toutes les récompenses
            </Button>
          }
        />
      ) : (
        <ul className="rw-grid" aria-label={favOnly ? 'Récompenses favorites' : 'Récompenses'}>
          {rewards.map((r) => (
            <RewardCard key={r.id} reward={r} child={focus} canEdit={isParent} you={!!childMode} />
          ))}
        </ul>
      )}
    </Screen>
  );
}

function RewardCard({ reward, child, canEdit, you }: { reward: Reward; child: Child | null; canEdit: boolean; you: boolean }) {
  const data = useFamilyData();
  const { run } = useApp();
  const [pending, setPending] = useState(false);
  const st = child ? rewardStatus(reward, child, data.events, data.redemptions) : null;

  const toggleFav = async () => {
    if (pending) return;
    setPending(true);
    await run((s) => s.upsertReward({ ...toDraft(reward), favorite: !reward.favorite }));
    setPending(false);
  };

  return (
    <li className={cx('rw-card', st?.canRedeem && 'is-unlocked', st?.alreadyClaimed && 'is-claimed')}>
      <div className="rw-card__media">
        <RewardThumb reward={reward} />
        {reward.mode === 'weekly' && (
          <span className="rw-card__weekly">
            <WeeklyBadge compact />
          </span>
        )}
      </div>
      <div className="rw-card__body">
        <PointsBadge points={reward.cost} size="sm" />
        <h3 className="rw-card__title">
          <Link to={`/cadeaux/${reward.id}`} className="rw-card__link">
            {reward.title}
          </Link>
        </h3>
        <CategoryPill category={reward.category} />
        {child && st && <CardProgress reward={reward} child={child} st={st} you={you} />}
      </div>
      {canEdit ? (
        <button
          type="button"
          className={cx('rw-heart', reward.favorite && 'is-on')}
          aria-pressed={reward.favorite}
          aria-label={reward.favorite ? `Retirer « ${reward.title} » des favoris` : `Ajouter « ${reward.title} » aux favoris`}
          onClick={() => void toggleFav()}
          disabled={pending}
        >
          <Icon name="heart" size={22} />
        </button>
      ) : (
        reward.favorite && (
          <span className="rw-heart is-on is-static" role="img" aria-label="Favori">
            <Icon name="heart" size={22} />
          </span>
        )
      )}
    </li>
  );
}

function CardProgress({
  reward,
  child,
  st,
  you,
}: {
  reward: Reward;
  child: Child;
  st: ReturnType<typeof rewardStatus>;
  you: boolean;
}) {
  if (st.alreadyClaimed) {
    return <p className="rw-card__state is-claimed">Offert cette semaine ✓</p>;
  }
  if (st.canRedeem) {
    return <p className="rw-card__state is-unlocked">Débloqué ! 🎉</p>;
  }
  const who = you ? 'toi' : child.name;
  return (
    <ProgressBar
      size="sm"
      className="rw-card__progress"
      value={st.progress}
      label={`Progression de ${who} vers ${reward.title}`}
      valueText={`${st.have} sur ${reward.cost} points, il manque ${st.missing} ${plural(st.missing)}`}
      caption={
        <span className="rw-card__caption">
          {Math.max(0, st.have)}/{reward.cost}
          {reward.mode === 'weekly' ? ' cette sem.' : ''}
        </span>
      }
    />
  );
}
