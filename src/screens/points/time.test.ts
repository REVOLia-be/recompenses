import { describe, expect, it } from 'vitest';
import { cappedRemoval, dayLabel, groupByDay, joinNames, relativeTime } from './time';

// Dimanche 15 novembre 2026, 10:00 (heure locale)
const now = new Date(2026, 10, 15, 10, 0, 0);
const at = (...a: [number, number, number, number?, number?]) => new Date(a[0], a[1], a[2], a[3] ?? 0, a[4] ?? 0);

describe('relativeTime', () => {
  it('moins d’une minute', () => {
    expect(relativeTime(new Date(now.getTime() - 20_000), now)).toBe('à l’instant');
  });
  it('minutes', () => {
    expect(relativeTime(new Date(now.getTime() - 5 * 60_000), now)).toBe('il y a 5 min');
    expect(relativeTime(new Date(now.getTime() - 59 * 60_000), now)).toBe('il y a 59 min');
  });
  it('heures le même jour', () => {
    expect(relativeTime(at(2026, 10, 15, 7, 30), now)).toBe('il y a 2 h');
  });
  it('hier, même s’il y a peu d’heures', () => {
    expect(relativeTime(at(2026, 10, 14, 22, 0), now)).toBe('hier');
    const earlyNow = at(2026, 10, 15, 0, 30);
    expect(relativeTime(at(2026, 10, 14, 23, 50), earlyNow)).toBe('il y a 40 min');
    expect(relativeTime(at(2026, 10, 14, 21, 0), earlyNow)).toBe('hier');
  });
  it('jour de la semaine puis date', () => {
    expect(relativeTime(at(2026, 10, 11, 9), now)).toBe('mercredi');
    expect(relativeTime(at(2026, 10, 3, 9), now)).toMatch(/^3 nov\.?$/);
    expect(relativeTime(at(2025, 10, 3, 9), now)).toMatch(/^3 nov\.? 2025$/);
  });
  it('accepte une chaîne ISO et ignore les dates invalides', () => {
    expect(relativeTime(new Date(now.getTime() - 3 * 60_000).toISOString(), now)).toBe('il y a 3 min');
    expect(relativeTime('pas une date', now)).toBe('');
  });
});

describe('dayLabel', () => {
  it('aujourd’hui / hier / date longue', () => {
    expect(dayLabel('2026-11-15', now)).toBe('Aujourd’hui');
    expect(dayLabel('2026-11-14', now)).toBe('Hier');
    expect(dayLabel('2026-11-09', now)).toBe('Lundi 9 novembre');
    expect(dayLabel('2025-12-25', now)).toBe('Jeudi 25 décembre 2025');
  });
});

describe('groupByDay', () => {
  it('regroupe des éléments consécutifs du même jour', () => {
    const items = [
      { id: 'a', createdAt: at(2026, 10, 15, 9).toISOString() },
      { id: 'b', createdAt: at(2026, 10, 15, 8).toISOString() },
      { id: 'c', createdAt: at(2026, 10, 13, 8).toISOString() },
    ];
    const g = groupByDay(items);
    expect(g.map((x) => x.key)).toEqual(['2026-11-15', '2026-11-13']);
    expect(g[0].items.map((x) => x.id)).toEqual(['a', 'b']);
  });
});

describe('joinNames / cappedRemoval', () => {
  it('joint les prénoms', () => {
    expect(joinNames([])).toBe('');
    expect(joinNames(['Léa'])).toBe('Léa');
    expect(joinNames(['Léa', 'Tom'])).toBe('Léa et Tom');
    expect(joinNames(['Léa', 'Tom', 'Zoé'])).toBe('Léa, Tom et Zoé');
  });
  it('plafonne le retrait au solde', () => {
    expect(cappedRemoval(5, 10)).toBe(5);
    expect(cappedRemoval(5, 3)).toBe(3);
    expect(cappedRemoval(5, 0)).toBe(0);
    expect(cappedRemoval(5, -2)).toBe(0);
  });
});
