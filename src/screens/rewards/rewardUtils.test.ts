import { describe, expect, it } from 'vitest';
import type { Reward } from '../../types';
import { categoryTone, filterRewards, fitWithin, formatDay, sortRewards } from './rewardUtils';

const r = (id: string, title: string, cost: number, createdAt: string, favorite = false): Reward => ({
  id,
  familyId: 'f',
  title,
  emoji: '🎁',
  imageUrl: null,
  cost,
  category: '',
  mode: 'spend',
  favorite,
  createdAt,
});

const list = [
  r('1', 'équitation', 50, '2026-11-01T10:00:00Z'),
  r('2', 'Cinéma', 100, '2026-11-10T10:00:00Z', true),
  r('3', 'Glace', 10, '2026-11-05T10:00:00Z'),
  r('4', 'Écran 30 min', 10, '2026-11-12T10:00:00Z', true),
];

describe('sortRewards', () => {
  it('trie de A à Z en ignorant accents et casse', () => {
    expect(sortRewards(list, 'az').map((x) => x.title)).toEqual(['Cinéma', 'Écran 30 min', 'équitation', 'Glace']);
  });
  it('trie par date de création décroissante', () => {
    expect(sortRewards(list, 'recent').map((x) => x.id)).toEqual(['4', '2', '3', '1']);
  });
  it('trie par coût croissant, puis par titre', () => {
    expect(sortRewards(list, 'points').map((x) => x.id)).toEqual(['4', '3', '1', '2']);
  });
  it('ne modifie pas la liste d’origine', () => {
    const before = list.map((x) => x.id);
    sortRewards(list, 'points');
    expect(list.map((x) => x.id)).toEqual(before);
  });
});

describe('filterRewards', () => {
  it('garde seulement les favoris', () => {
    expect(filterRewards(list, true).map((x) => x.id)).toEqual(['2', '4']);
    expect(filterRewards(list, false)).toHaveLength(4);
  });
});

describe('fitWithin', () => {
  it('réduit le plus grand côté à 800 px en gardant les proportions', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(1080, 1920)).toEqual({ width: 450, height: 800 });
  });
  it('n’agrandit jamais une petite image', () => {
    expect(fitWithin(320, 200)).toEqual({ width: 320, height: 200 });
  });
  it('gère les dimensions invalides et extrêmes', () => {
    expect(fitWithin(0, 100)).toEqual({ width: 0, height: 0 });
    expect(fitWithin(10000, 2)).toEqual({ width: 800, height: 1 });
  });
});

describe('categoryTone', () => {
  it('est stable et dans 1..6', () => {
    expect(categoryTone('Sortie')).toBe(categoryTone(' sortie '));
    for (const c of ['Fun', 'Lego', 'Piscine', '']) {
      const t = categoryTone(c);
      expect(t).toBeGreaterThanOrEqual(1);
      expect(t).toBeLessThanOrEqual(6);
    }
  });
});

describe('formatDay', () => {
  const now = new Date(2026, 10, 15, 18, 0);
  it('dit aujourd’hui / hier', () => {
    expect(formatDay(new Date(2026, 10, 15, 8).toISOString(), now)).toBe('aujourd’hui');
    expect(formatDay(new Date(2026, 10, 14, 23).toISOString(), now)).toBe('hier');
  });
  it('affiche l’année seulement si elle diffère', () => {
    expect(formatDay(new Date(2025, 0, 3).toISOString(), now)).toContain('2025');
    expect(formatDay(new Date(2026, 10, 8).toISOString(), now)).not.toContain('2026');
  });
});
