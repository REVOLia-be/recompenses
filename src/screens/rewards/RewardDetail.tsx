// Détail d'une récompense : progression de chaque enfant, offrir, historique, édition / suppression.
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Child, Reward } from '../../types';
import { balance, rewardStatus, type RewardStatus } from '../../domain/logic';
import { useApp, useFamilyData } from '../../state/AppState';
import {
  Avatar,
  Button,
  ConfirmDialog,
  EmptyState,
  GlassCard,
  IconButton,
  PointsBadge,
  ProgressBar,
  Screen,
  cx,
  formatPoints,
} from '../../ui';
import { CategoryPill, ImagePickButton, RewardThumb, WeeklyBadge } from './RewardBits';
import { encouragement, formatDay, plural, resizeImage } from './rewardUtils';
import { toDraft } from './shared';
import './rewards.css';

export function RewardDetail() {
  const { id } = useParams();
  const data = useFamilyData();
  const { childMode, run, busy } = useApp();
  const navigate = useNavigate();
  const [offerTo, setOfferTo] = useState<Child | null>(null);
  const [askDelete, setAskDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const reward = data.rewards.find((r) => r.id === id);
  const isParent = !childMode;

  if (!reward) {
    return (
      <Screen title="Cadeaux" back="/cadeaux" action={childMode ? <span className="rw-lock-space" aria-hidden="true" /> : undefined}>
        <EmptyState
          emoji="🔍"
          title="Récompense introuvable"
          message="Elle a peut-être été supprimée."
          action={<Button onClick={() => navigate('/cadeaux')}>Retour aux cadeaux</Button>}
        />
      </Screen>
    );
  }

  const kids = childMode ? data.children.filter((c) => c.id === childMode) : data.children;
  const history = data.redemptions
    .filter((r) => r.rewardId === reward.id && (!childMode || r.childId === childMode))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const changeImage = async (file: File) => {
    setUploading(true);
    await run(
      async (s) => {
        const blob = await resizeImage(file);
        const url = await s.uploadRewardImage(blob);
        await s.upsertReward({ ...toDraft(reward), imageUrl: url });
      },
      { success: 'Nouvelle image enregistrée 📸' },
    );
    setUploading(false);
  };

  const offer = async () => {
    const child = offerTo;
    if (!child) return;
    const ok = await run((s) => s.redeemReward(reward.id, child.id).then(() => true), {
      celebrate: { message: `${reward.title} pour ${child.name} !`, emoji: reward.emoji || '🎁' },
    });
    if (ok) setOfferTo(null);
  };

  const remove = async () => {
    const ok = await run((s) => s.deleteReward(reward.id).then(() => true), { success: 'Récompense supprimée' });
    if (ok) navigate('/cadeaux', { replace: true });
    else setAskDelete(false);
  };

  return (
    <Screen
      title={reward.title}
      back="/cadeaux"
      className="rw-detail"
      action={
        isParent ? (
          <IconButton label="Modifier la récompense" icon="pencil" onClick={() => navigate(`/cadeaux/${reward.id}/modifier`)} />
        ) : (
          <span className="rw-lock-space" aria-hidden="true" />
        )
      }
    >
      <GlassCard className="rw-hero" padding="md" strong>
        <div className="rw-hero__media">
          <RewardThumb reward={reward} size="hero" />
          {isParent && (
            <div className="rw-hero__camera">
              <ImagePickButton
                variant="icon"
                label={reward.imageUrl ? 'Changer la photo' : 'Ajouter une photo'}
                onPick={(f) => void changeImage(f)}
                loading={uploading}
              />
            </div>
          )}
        </div>
        <div className="rw-hero__meta">
          <PointsBadge points={reward.cost} size="lg" />
          <div className="rw-hero__tags">
            {reward.mode === 'weekly' && <WeeklyBadge />}
            <CategoryPill category={reward.category} />
          </div>
          <p className="rw-hero__explain small">
            {reward.mode === 'weekly'
              ? `Se débloque avec ${formatPoints(reward.cost)} gagnés depuis lundi. Offert une fois par semaine, sans rien retirer du solde.`
              : `Se paie avec le solde : ${formatPoints(reward.cost)} sont retirés quand on l’offre.`}
          </p>
        </div>
      </GlassCard>

      <section className="stack" aria-labelledby="rw-progress-title">
        <h2 id="rw-progress-title" className="section-title">
          {childMode ? 'Ta progression' : 'Où en sont les enfants ?'}
        </h2>
        {kids.length === 0 ? (
          <GlassCard padding="md">
            <p className="muted">Ajoute tes enfants dans le Coin Parent pour suivre leur progression.</p>
          </GlassCard>
        ) : (
          <ul className="rw-kidlist">
            {kids.map((c) => (
              <ChildProgress
                key={c.id}
                reward={reward}
                child={c}
                st={rewardStatus(reward, c, data.events, data.redemptions)}
                you={!!childMode}
                onOffer={isParent ? () => setOfferTo(c) : undefined}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="stack" aria-labelledby="rw-history-title">
        <h2 id="rw-history-title" className="section-title">
          Déjà offert
        </h2>
        {history.length === 0 ? (
          <GlassCard padding="md">
            <p className="muted small">Pas encore offert. Le premier sera fêté comme il se doit 🎉</p>
          </GlassCard>
        ) : (
          <GlassCard as="section" padding="sm">
            <ul className="rw-history">
              {history.map((h) => {
                const kid = data.children.find((c) => c.id === h.childId);
                const by = data.parents.find((p) => p.id === h.createdBy);
                return (
                  <li key={h.id} className="rw-history__item">
                    <Avatar emoji={kid?.emoji ?? '🧒'} color={kid?.color} size="sm" />
                    <div className="grow">
                      <p className="rw-history__who">{kid?.name ?? 'Enfant supprimé'}</p>
                      <p className="small muted">
                        {formatDay(h.createdAt)}
                        {by ? ` · par ${by.roleLabel || by.name}` : ''}
                      </p>
                    </div>
                    {h.weekKey ? (
                      <span className="rw-history__tag">Objectif ✓</span>
                    ) : (
                      <PointsBadge points={-h.cost} size="sm" tone="glass" />
                    )}
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        )}
      </section>

      {isParent && (
        <Button variant="ghost" icon="trash" className="rw-delete" onClick={() => setAskDelete(true)}>
          Supprimer la récompense
        </Button>
      )}

      <ConfirmDialog
        open={!!offerTo}
        title={offerTo ? `Offrir « ${reward.title} » à ${offerTo.name} ?` : ''}
        message={offerTo ? <OfferMessage reward={reward} child={offerTo} /> : undefined}
        confirmLabel="Offrir 🎁"
        busy={busy}
        onConfirm={offer}
        onCancel={() => setOfferTo(null)}
      />
      <ConfirmDialog
        open={askDelete}
        danger
        title="Supprimer cette récompense ?"
        message="Elle disparaîtra de la liste. Les points déjà dépensés ne sont pas rendus."
        confirmLabel="Supprimer"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setAskDelete(false)}
      />
    </Screen>
  );
}

function OfferMessage({ reward, child }: { reward: Reward; child: Child }) {
  const data = useFamilyData();
  if (reward.mode === 'weekly') {
    return (
      <p>
        Rien n’est retiré : c’est l’objectif de la semaine. {child.name} garde tous ses points et pourra le regagner
        dès lundi.
      </p>
    );
  }
  const left = balance(data.events, child.id) - reward.cost;
  return (
    <p>
      <strong>
        {reward.cost} {plural(reward.cost)}
      </strong>{' '}
      {reward.cost > 1 ? 'seront retirés' : 'sera retiré'} du solde de {child.name} (il lui en restera {left}).
    </p>
  );
}

function ChildProgress({
  reward,
  child,
  st,
  you,
  onOffer,
}: {
  reward: Reward;
  child: Child;
  st: RewardStatus;
  you: boolean;
  onOffer?: () => void;
}) {
  const weekly = reward.mode === 'weekly';
  let status: JSX.Element;
  if (st.alreadyClaimed) {
    status = (
      <>
        <p className="rw-kid__status is-claimed">Déjà offert cette semaine ✓</p>
        <p className="small muted">{you ? 'Rendez-vous lundi pour un nouveau défi !' : 'De nouveau possible dès lundi.'}</p>
      </>
    );
  } else if (st.canRedeem) {
    status = (
      <>
        <p className="rw-kid__status is-unlocked">Débloqué ! 🎉</p>
        {onOffer ? (
          <Button block onClick={onOffer} className="rw-kid__offer">
            Offrir à {child.name} 🎁
          </Button>
        ) : (
          <p className="rw-kid__ask">Demande à papa ou maman ! 💌</p>
        )}
      </>
    );
  } else {
    status = (
      <>
        <p className="rw-kid__status">
          {you ? 'Il te manque' : 'Il manque'} {st.missing} {plural(st.missing)}
          {weekly ? ' cette semaine' : ''}
        </p>
        <p className="small muted">{encouragement(st.progress, you)}</p>
      </>
    );
  }

  return (
    <li className={cx('rw-kid', st.canRedeem && 'is-unlocked', st.alreadyClaimed && 'is-claimed')}>
      <div className="rw-kid__top">
        <Avatar emoji={child.emoji} color={child.color} size="md" />
        <div className="grow rw-kid__text">
          <p className="rw-kid__name">{child.name}</p>
          {status}
        </div>
      </div>
      <ProgressBar
        value={st.alreadyClaimed ? 1 : st.progress}
        label={`Progression de ${child.name} vers ${reward.title}`}
        valueText={`${st.have} sur ${reward.cost} points${weekly ? ' cette semaine' : ''}`}
        caption={
          <span className="small">
            {weekly ? 'Cette semaine : ' : 'Solde : '}
            <strong>
              {Math.max(0, st.have)} / {reward.cost}
            </strong>
          </span>
        }
      />
    </li>
  );
}
