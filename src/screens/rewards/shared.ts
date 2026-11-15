import type { Draft } from '../../data/store';
import type { Child, Reward } from '../../types';
import { useApp } from '../../state/AppState';

/** Reward complet → brouillon pour upsertReward (on renvoie l'imageUrl telle quelle : le store sait la relire). */
export function toDraft(r: Reward): Draft<Reward> {
  return {
    id: r.id,
    title: r.title,
    emoji: r.emoji,
    imageUrl: r.imageUrl,
    cost: r.cost,
    category: r.category,
    mode: r.mode,
    favorite: r.favorite,
  };
}

/**
 * L'enfant « concerné » par l'écran : l'enfant du mode enfant, le seul enfant de la famille,
 * ou le seul enfant sélectionné. null s'il y en a plusieurs.
 */
export function useFocusChild(): Child | null {
  const { data, childMode, selectedChildren } = useApp();
  const kids = data?.children ?? [];
  if (childMode) return kids.find((c) => c.id === childMode) ?? null;
  if (kids.length === 1) return kids[0];
  if (selectedChildren.length === 1) return selectedChildren[0];
  return null;
}
