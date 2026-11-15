// Création / édition d'une récompense (routes /cadeaux/nouveau et /cadeaux/:id/modifier).
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import type { Reward, RewardMode } from '../../types';
import { useApp, useFamilyData } from '../../state/AppState';
import { Button, Chip, EmojiPicker, EmptyState, GlassCard, Icon, NumberStepper, Screen, TextField, cx } from '../../ui';
import { ImagePickButton, RewardThumb } from './RewardBits';
import { CATEGORY_SUGGESTIONS, resizeImage } from './rewardUtils';
import './rewards.css';

const COST_PRESETS = [5, 10, 20, 50, 100];

const MODES: ReadonlyArray<{ value: RewardMode; emoji: string; title: string; text: string }> = [
  {
    value: 'spend',
    emoji: '⭐',
    title: 'Cadeau à points',
    text: 'Se paie avec le solde : les points sont retirés quand tu l’offres.',
  },
  {
    value: 'weekly',
    emoji: '📅',
    title: 'Objectif de la semaine',
    text: 'Se débloque avec les points gagnés depuis lundi, une fois par semaine, sans rien retirer.',
  },
];

export function RewardForm() {
  const { id } = useParams();
  const data = useFamilyData();
  const { childMode } = useApp();
  const existing = id ? data.rewards.find((r) => r.id === id) : undefined;

  if (childMode) return <Navigate to={id ? `/cadeaux/${id}` : '/cadeaux'} replace />;
  if (id && !existing) {
    return (
      <Screen title="Modifier" back="/cadeaux">
        <EmptyState emoji="🔍" title="Récompense introuvable" message="Elle a peut-être été supprimée." />
      </Screen>
    );
  }
  // key : repart d'un formulaire propre si on passe d'une récompense à une autre.
  return <RewardFormInner key={existing?.id ?? 'new'} existing={existing} />;
}

function RewardFormInner({ existing }: { existing?: Reward }) {
  const { run, busy } = useApp();
  const navigate = useNavigate();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '🎁');
  const [cost, setCost] = useState(existing?.cost ?? 20);
  const [mode, setMode] = useState<RewardMode>(existing?.mode ?? 'spend');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [favorite, setFavorite] = useState(existing?.favorite ?? false);
  /** Image actuelle conservée (URL du store, jamais comparée ni mise en cache). */
  const [keepImage, setKeepImage] = useState(!!existing?.imageUrl);
  /** Nouvelle image déjà redimensionnée, envoyée à l'enregistrement. */
  const [newImage, setNewImage] = useState<Blob | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  const previewUrl = useMemo(() => (newImage ? URL.createObjectURL(newImage) : null), [newImage]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const shownImage = previewUrl ?? (keepImage ? (existing?.imageUrl ?? null) : null);
  const isSuggested = CATEGORY_SUGGESTIONS.some((c) => c.label === category);

  const pickImage = async (file: File) => {
    setImageError(null);
    setPreparing(true);
    try {
      setNewImage(await resizeImage(file));
    } catch (e) {
      setImageError(e instanceof Error ? e.message : 'Impossible de préparer cette image.');
    } finally {
      setPreparing(false);
    }
  };

  const removeImage = () => {
    setNewImage(null);
    setKeepImage(false);
    setImageError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setTitleError('Donne un nom à la récompense.');
      document.getElementById('rw-title')?.focus();
      return;
    }
    const savedId = await run(
      async (s) => {
        let imageUrl = keepImage ? (existing?.imageUrl ?? null) : null;
        if (newImage) imageUrl = await s.uploadRewardImage(newImage);
        await s.upsertReward({
          id: existing?.id,
          title: t,
          emoji: emoji || '🎁',
          imageUrl,
          cost,
          category: category.trim(),
          mode,
          favorite,
        });
        return existing?.id ?? 'new';
      },
      { success: existing ? 'Récompense mise à jour ✨' : 'Nouvelle récompense ajoutée ✨' },
    );
    if (!savedId) return; // erreur déjà affichée en toast ; on reste sur le formulaire
    if (existing) navigate(`/cadeaux/${existing.id}`, { replace: true });
    else navigate('/cadeaux', { replace: true });
  };

  return (
    <Screen title={existing ? 'Modifier la récompense' : 'Nouvelle récompense'} back={existing ? `/cadeaux/${existing.id}` : '/cadeaux'} className="rw-form-screen">
      <form className="rw-form stack" onSubmit={submit} noValidate>
        <GlassCard padding="md" className="stack">
          <TextField
            id="rw-title"
            label="Nom de la récompense"
            placeholder="Ex. : Équitation samedi"
            value={title}
            maxLength={60}
            autoComplete="off"
            enterKeyHint="next"
            error={titleError}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(null);
            }}
          />
        </GlassCard>

        <GlassCard padding="md" className="stack">
          <h2 className="section-title">Type de récompense</h2>
          <p className="rw-form__explain small">
            Un <strong>cadeau à points</strong> se paie avec le solde de l’enfant, alors qu’un{' '}
            <strong>objectif de la semaine</strong> se débloque avec les points gagnés depuis lundi et ne retire rien.
          </p>
          <div className="rw-modes" role="radiogroup" aria-label="Type de récompense">
            {MODES.map((m) => (
              <label key={m.value} className={cx('rw-mode', mode === m.value && 'is-selected')}>
                <input
                  type="radio"
                  name="rw-mode"
                  value={m.value}
                  checked={mode === m.value}
                  onChange={() => setMode(m.value)}
                  className="rw-mode__input"
                />
                <span className="rw-mode__emoji emoji" aria-hidden="true">
                  {m.emoji}
                </span>
                <span className="rw-mode__text">
                  <span className="rw-mode__title">{m.title}</span>
                  <span className="rw-mode__desc small">{m.text}</span>
                </span>
                <span className="rw-mode__check" aria-hidden="true">
                  <Icon name="check" size={16} strokeWidth={3} />
                </span>
              </label>
            ))}
          </div>
        </GlassCard>

        <GlassCard padding="md" className="stack">
          <NumberStepper
            label={mode === 'weekly' ? 'Points à gagner dans la semaine' : 'Prix en points'}
            value={cost}
            onChange={setCost}
            min={0}
            max={9999}
            unit="pts"
          />
          <div className="rw-presets" role="group" aria-label="Valeurs rapides">
            {COST_PRESETS.map((p) => (
              <Chip key={p} selected={cost === p} onClick={() => setCost(p)} aria-label={`${p} points`}>
                {p}
              </Chip>
            ))}
          </div>
        </GlassCard>

        <GlassCard padding="md" className="stack">
          <h2 className="section-title">Image</h2>
          <div className="rw-imagepick">
            <RewardThumb reward={{ emoji, imageUrl: shownImage, title }} size="sm" />
            <div className="stack rw-imagepick__actions">
              <ImagePickButton
                label={shownImage ? 'Changer la photo' : 'Ajouter une photo'}
                onPick={(f) => void pickImage(f)}
                loading={preparing}
              />
              {shownImage && (
                <Button variant="ghost" size="sm" icon="trash" onClick={removeImage}>
                  Retirer la photo
                </Button>
              )}
            </div>
          </div>
          {imageError ? (
            <p className="rw-form__error small" role="alert">
              {imageError}
            </p>
          ) : (
            <p className="small muted">Optionnel : sans photo, on affiche l’emoji.</p>
          )}
          <EmojiPicker label="Emoji" value={emoji} onChange={setEmoji} sets={['rewards', 'magic']} />
        </GlassCard>

        <GlassCard padding="md" className="stack">
          <h2 className="section-title" id="rw-cat-title">
            Catégorie
          </h2>
          <div className="rw-cats" role="group" aria-labelledby="rw-cat-title">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <Chip
                key={c.label}
                emoji={c.emoji}
                selected={category === c.label}
                onClick={() => setCategory(category === c.label ? '' : c.label)}
              >
                {c.label}
              </Chip>
            ))}
          </div>
          <TextField
            label="Ou une autre catégorie"
            placeholder="Ex. : Sport"
            value={isSuggested ? '' : category}
            maxLength={24}
            autoComplete="off"
            onChange={(e) => setCategory(e.target.value)}
          />
        </GlassCard>

        <GlassCard padding="md">
          <label className="rw-fav">
            <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} className="rw-fav__input" />
            <span className={cx('rw-fav__heart', favorite && 'is-on')} aria-hidden="true">
              <Icon name="heart" size={24} />
            </span>
            <span className="grow">
              <span className="rw-fav__title">Favori</span>
              <span className="small muted rw-fav__desc">Pour la retrouver vite avec le filtre ♥</span>
            </span>
          </label>
        </GlassCard>

        <div className="rw-form__actions">
          <Button type="submit" size="lg" block loading={busy} disabled={preparing}>
            {existing ? 'Enregistrer' : 'Ajouter la récompense'}
          </Button>
        </div>
      </form>
    </Screen>
  );
}
