// Logique propre à l'onglet « Cadeaux » : tri, catégories, textes d'encouragement, redimensionnement d'image.
import type { Reward } from '../../types';

export type RewardSort = 'az' | 'recent' | 'points';

export const SORT_OPTIONS: ReadonlyArray<{ value: RewardSort; label: string; ariaLabel: string }> = [
  { value: 'az', label: 'A → Z', ariaLabel: 'Trier de A à Z' },
  { value: 'recent', label: 'Récentes', ariaLabel: 'Les plus récentes d’abord' },
  { value: 'points', label: 'Points', ariaLabel: 'Les moins chères d’abord' },
];

const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });

/** Renvoie une copie triée. 'points' = du moins cher au plus cher, 'recent' = du plus récent au plus ancien. */
export function sortRewards(rewards: readonly Reward[], sort: RewardSort): Reward[] {
  const byTitle = (a: Reward, b: Reward) => collator.compare(a.title.trim(), b.title.trim());
  const time = (r: Reward) => {
    const t = Date.parse(r.createdAt);
    return Number.isFinite(t) ? t : 0;
  };
  const list = [...rewards];
  if (sort === 'az') return list.sort((a, b) => byTitle(a, b) || a.id.localeCompare(b.id));
  if (sort === 'recent') return list.sort((a, b) => time(b) - time(a) || byTitle(a, b));
  return list.sort((a, b) => a.cost - b.cost || byTitle(a, b));
}

export function filterRewards(rewards: readonly Reward[], favoritesOnly: boolean): Reward[] {
  return favoritesOnly ? rewards.filter((r) => r.favorite) : [...rewards];
}

export const CATEGORY_SUGGESTIONS: ReadonlyArray<{ label: string; emoji: string }> = [
  { label: 'Fun', emoji: '🎉' },
  { label: 'Sortie', emoji: '🎡' },
  { label: 'Écran', emoji: '📺' },
  { label: 'Gourmandise', emoji: '🍦' },
  { label: 'Cadeau', emoji: '🎁' },
  { label: 'Temps ensemble', emoji: '🤗' },
];

/** Teinte pastel stable pour une catégorie (index 1..6 des couleurs d'avatar). */
export function categoryTone(category: string): number {
  const key = category.trim().toLocaleLowerCase('fr');
  const known = CATEGORY_SUGGESTIONS.findIndex((c) => c.label.toLocaleLowerCase('fr') === key);
  if (known >= 0) return known + 1;
  let h = 0;
  for (const ch of key) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return (h % 6) + 1;
}

export const plural = (n: number, one = 'point', many = 'points') => (Math.abs(n) > 1 ? many : one);

/** Petite phrase d'encouragement selon l'avancement (0..1). `you` = s'adresse directement à l'enfant. */
export function encouragement(progress: number, you: boolean): string {
  if (progress <= 0) return you ? 'Chaque bonne action te rapproche ✨' : 'Chaque bonne action compte ✨';
  if (progress < 0.4) return you ? 'C’est bien parti, continue !' : 'C’est bien parti !';
  if (progress < 0.75) return you ? 'Tu es sur la bonne voie 🌈' : 'Sur la bonne voie 🌈';
  return you ? 'Presque ! Encore un petit effort 💪' : 'Presque ! Encore un petit effort 💪';
}

// --- Image -------------------------------------------------------------------

export const MAX_IMAGE_SIDE = 800;
export const JPEG_QUALITY = 0.82;

/** Dimensions réduites pour que le plus grand côté fasse au plus `max` (jamais agrandi). */
export function fitWithin(width: number, height: number, max = MAX_IMAGE_SIDE): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) return { width: 0, height: 0 };
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Impossible de lire cette image. Essaie une photo au format JPEG ou PNG.'));
    };
    img.src = url;
  });
}

/**
 * Redimensionne l'image (plus grand côté ≤ 800 px) et la recompresse en JPEG via un canvas.
 * Les erreurs sont des messages en français affichables.
 */
export async function resizeImage(file: Blob, max = MAX_IMAGE_SIDE, quality = JPEG_QUALITY): Promise<Blob> {
  if (file.type && !file.type.startsWith('image/')) throw new Error('Ce fichier n’est pas une image.');
  const img = await loadImage(file);
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, max);
  if (!width || !height) throw new Error('Cette image semble vide.');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Ton navigateur ne permet pas de préparer l’image.');
  // Fond blanc : les zones transparentes (PNG) ne deviennent pas noires en JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new Error('Impossible de compresser cette image.');
  return blob;
}

/** Date courte et chaleureuse : « aujourd’hui », « hier », « sam. 8 nov. », « 3 janv. 2025 ». */
export function formatDay(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diff === 0) return 'aujourd’hui';
  if (diff === 1) return 'hier';
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === now.getFullYear()
      ? { weekday: 'short', day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat('fr-FR', opts).format(d);
}
