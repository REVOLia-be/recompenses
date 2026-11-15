// Petits composants propres à l'onglet « Cadeaux ».
import { useRef, useState, type ChangeEvent } from 'react';
import type { Reward } from '../../types';
import { Button, IconButton, cx } from '../../ui';
import { categoryTone } from './rewardUtils';

/**
 * Vignette : image si disponible (et lisible), sinon emoji.
 * L'URL d'image peut être signée et changer à chaque chargement : on ne la met pas en cache
 * et, si elle échoue (lien expiré, réseau), on retombe simplement sur l'emoji.
 */
export function RewardThumb({ reward, size = 'card', className }: { reward: Pick<Reward, 'emoji' | 'imageUrl' | 'title'>; size?: 'card' | 'hero' | 'sm'; className?: string }) {
  return (
    <div className={cx('rw-thumb', `rw-thumb--${size}`, className)}>
      <ThumbContent key={reward.imageUrl ?? 'emoji'} emoji={reward.emoji} imageUrl={reward.imageUrl} />
    </div>
  );
}

function ThumbContent({ emoji, imageUrl }: { emoji: string; imageUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  if (imageUrl && !failed) {
    return <img className="rw-thumb__img" src={imageUrl} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />;
  }
  return (
    <span className="rw-thumb__emoji emoji" aria-hidden="true">
      {emoji || '🎁'}
    </span>
  );
}

export function CategoryPill({ category }: { category: string }) {
  const c = category.trim();
  if (!c) return null;
  return (
    <span className="rw-pill" style={{ ['--pill-bg' as string]: `var(--avatar-${categoryTone(c)})` }}>
      {c}
    </span>
  );
}

export function WeeklyBadge({ compact }: { compact?: boolean }) {
  return (
    <span className="rw-weekly" title="Objectif de la semaine : ne retire aucun point">
      <span aria-hidden="true">📅</span> {compact ? 'Semaine' : 'Objectif de la semaine'}
    </span>
  );
}

/**
 * Bouton qui ouvre le sélecteur de fichier (sur téléphone : galerie ou appareil photo).
 * `variant="icon"` = bouton rond appareil photo.
 */
export function ImagePickButton({
  onPick,
  label,
  variant = 'button',
  loading,
  disabled,
}: {
  onPick: (file: File) => void;
  label: string;
  variant?: 'button' | 'icon';
  loading?: boolean;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-choisir le même fichier
    if (file) onPick(file);
  };
  return (
    <>
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onChange} />
      {variant === 'icon' ? (
        <IconButton
          label={label}
          icon={loading ? <span className="ui-spinner" aria-hidden="true" /> : 'camera'}
          variant="primary"
          disabled={disabled || loading}
          aria-busy={loading || undefined}
          onClick={() => input.current?.click()}
        />
      ) : (
        <Button variant="secondary" icon="camera" loading={loading} disabled={disabled} onClick={() => input.current?.click()}>
          {label}
        </Button>
      )}
    </>
  );
}
