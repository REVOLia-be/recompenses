import { describe, expect, it } from 'vitest';
import type { Child, Mission, PointEvent, Redemption, Reward } from '../types';
import {
  ageFromBirthdate,
  balance,
  companionState,
  currentCompletion,
  dayKey,
  lifetimePoints,
  missionAppliesTo,
  missionPeriodKey,
  rewardStatus,
  weekKey,
  weekPoints,
} from './logic';

const child: Child = {
  id: 'c1',
  familyId: 'f',
  name: 'Léa',
  emoji: '🦊',
  color: '#ffd6e7',
  birthdate: null,
  companionName: 'Pip',
  createdAt: '2026-01-01T00:00:00.000Z',
};

let n = 0;
const ev = (points: number, createdAt: Date, kind: PointEvent['kind'] = 'action', childId = 'c1'): PointEvent => ({
  id: `e${++n}`,
  familyId: 'f',
  childId,
  points,
  label: 'x',
  emoji: '⭐',
  kind,
  refId: null,
  createdBy: null,
  createdAt: createdAt.toISOString(),
});

const reward = (over: Partial<Reward> = {}): Reward => ({
  id: 'r1',
  familyId: 'f',
  title: 'Équitation du samedi',
  emoji: '🐴',
  imageUrl: null,
  cost: 10,
  category: 'Sorties',
  mode: 'spend',
  favorite: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

// Mercredi 11 novembre 2026, midi (heure locale)
const WED = new Date(2026, 10, 11, 12, 0, 0);
const MON = new Date(2026, 10, 9, 8, 0, 0);
const PREV_SUN = new Date(2026, 10, 8, 20, 0, 0);

describe('dates', () => {
  it('dayKey et weekKey (semaine du lundi)', () => {
    expect(dayKey(WED)).toBe('2026-11-11');
    expect(weekKey(WED)).toBe('2026-11-09');
    expect(weekKey(MON)).toBe('2026-11-09');
    expect(weekKey(PREV_SUN)).toBe('2026-11-02');
  });
});

describe('soldes', () => {
  const events = [ev(5, WED), ev(3, PREV_SUN), ev(-4, WED, 'reward'), ev(7, WED, 'action', 'c2')];

  it('balance = gagné − dépensé, par enfant', () => {
    expect(balance(events, 'c1')).toBe(4);
    expect(balance(events, 'c2')).toBe(7);
  });

  it('weekPoints ne compte que depuis lundi, hors dépenses', () => {
    expect(weekPoints(events, 'c1', WED)).toBe(5);
  });

  it('lifetimePoints ignore les dépenses', () => {
    expect(lifetimePoints(events, 'c1')).toBe(8);
  });
});

describe('rewardStatus', () => {
  it("mode 'spend' : manque des points puis éligible", () => {
    const st = rewardStatus(reward(), child, [ev(6, WED)], [], WED);
    expect(st).toMatchObject({ have: 6, missing: 4, canRedeem: false });
    expect(st.progress).toBeCloseTo(0.6);
    expect(rewardStatus(reward(), child, [ev(12, WED)], [], WED).canRedeem).toBe(true);
  });

  it("mode 'weekly' : une seule fois par semaine", () => {
    const r = reward({ mode: 'weekly', cost: 5 });
    const events = [ev(6, WED), ev(50, PREV_SUN)];
    expect(rewardStatus(r, child, events, [], WED)).toMatchObject({ have: 6, canRedeem: true });
    const red: Redemption = {
      id: 'x',
      familyId: 'f',
      rewardId: 'r1',
      childId: 'c1',
      cost: 5,
      weekKey: '2026-11-09',
      createdBy: null,
      createdAt: WED.toISOString(),
    };
    expect(rewardStatus(r, child, events, [red], WED)).toMatchObject({ alreadyClaimed: true, canRedeem: false });
  });
});

describe('missions', () => {
  const m = (recurrence: Mission['recurrence'], childIds: string[] = []): Mission => ({
    id: 'm1',
    familyId: 'f',
    title: 'Ranger',
    emoji: '🧹',
    points: 2,
    recurrence,
    childIds,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  it('clé de période selon la récurrence', () => {
    expect(missionPeriodKey(m('once'), WED)).toBe('once');
    expect(missionPeriodKey(m('daily'), WED)).toBe('2026-11-11');
    expect(missionPeriodKey(m('weekly'), WED)).toBe('2026-11-09');
  });

  it('missionAppliesTo : vide = tous', () => {
    expect(missionAppliesTo(m('once'), 'c1')).toBe(true);
    expect(missionAppliesTo(m('once', ['c2']), 'c1')).toBe(false);
  });

  it('currentCompletion trouve la validation de la période', () => {
    const comp = { id: 'k', familyId: 'f', missionId: 'm1', childId: 'c1', periodKey: '2026-11-11', eventId: null, createdAt: '' };
    expect(currentCompletion(m('daily'), 'c1', [comp], WED)).toBe(comp);
    expect(currentCompletion(m('daily'), 'c1', [comp], new Date(2026, 10, 12))).toBeUndefined();
  });
});

describe('compagnon', () => {
  it('stades et progression', () => {
    expect(companionState([], 'c1')).toMatchObject({ stage: 0, nextAt: 20, progress: 0 });
    const s = companionState([ev(35, WED)], 'c1');
    expect(s).toMatchObject({ stage: 1, nextAt: 50 });
    expect(s.progress).toBeCloseTo(0.5);
    expect(companionState([ev(600, WED)], 'c1')).toMatchObject({ stage: 5, nextAt: null, progress: 1 });
  });
});

describe('âge', () => {
  it('ageFromBirthdate', () => {
    expect(ageFromBirthdate('2018-11-12', WED)).toBe(7);
    expect(ageFromBirthdate('2018-11-11', WED)).toBe(8);
    expect(ageFromBirthdate(null, WED)).toBeNull();
  });
});
