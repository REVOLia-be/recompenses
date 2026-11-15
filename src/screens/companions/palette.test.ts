import { describe, expect, it } from 'vitest';
import { baseCompanionHue, companionHues, hexHue } from './palette';
import { seenDecision } from './seen';

const kid = (id: string, color: string, i: number) => ({ id, color, createdAt: `2026-01-0${i + 1}T00:00:00Z` });
const dist = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

describe('palette des compagnons', () => {
  it('lit la teinte d’une couleur hex', () => {
    expect(hexHue('#ff0000')).toBe(0);
    expect(hexHue('#00ff00')).toBe(120);
    expect(hexHue('#888888')).toBeNull();
    expect(hexHue('pas une couleur')).toBeNull();
  });

  it('est stable pour un même enfant', () => {
    expect(baseCompanionHue({ id: 'a', color: '#ffd6e7' })).toBe(baseCompanionHue({ id: 'a', color: '#ffd6e7' }));
  });

  it('écarte les teintes de deux enfants de même couleur', () => {
    const hues = companionHues([kid('a', '#ffd6e7', 0), kid('b', '#ffd6e7', 1), kid('c', '#ffd6e7', 2)]);
    const [a, b, c] = ['a', 'b', 'c'].map((id) => hues.get(id)!);
    expect(dist(a, b)).toBeGreaterThanOrEqual(40);
    expect(dist(a, c)).toBeGreaterThanOrEqual(40);
    expect(dist(b, c)).toBeGreaterThanOrEqual(40);
  });

  it('garde la teinte naturelle du premier enfant', () => {
    const k = kid('a', '#e5dbff', 0);
    expect(companionHues([k, kid('b', '#e5dbff', 1)]).get('a')).toBe(baseCompanionHue(k));
  });
});

describe('seenDecision', () => {
  it('mémorise sans célébrer la première fois', () => expect(seenDecision(null, 3)).toEqual({ kind: 'record' }));
  it('célèbre un nouveau stade', () => expect(seenDecision(1, 3)).toEqual({ kind: 'evolve', from: 1 }));
  it('ne fait rien au même stade', () => expect(seenDecision(2, 2)).toEqual({ kind: 'none' }));
  it('mémorise une baisse en silence', () => expect(seenDecision(4, 2)).toEqual({ kind: 'record' }));
});
