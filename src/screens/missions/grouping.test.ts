import { describe, expect, it } from 'vitest';
import type { Child, Mission, MissionCompletion } from '../../types';
import { buildSections, normalizeChildIds, progressText } from './grouping';

const NOW = new Date(2026, 10, 18, 10); // mercredi 18 nov. 2026 (lundi = 2026-11-16)
const kid = (id: string): Child => ({
  id,
  familyId: 'f',
  name: id,
  emoji: '🦊',
  color: '#fff',
  birthdate: null,
  companionName: 'x',
  createdAt: '',
});
const A = kid('a');
const B = kid('b');
let i = 0;
const mission = (p: Partial<Mission>): Mission => ({
  id: `m${++i}`,
  familyId: 'f',
  title: 't',
  emoji: '⭐',
  points: 1,
  recurrence: 'daily',
  childIds: [],
  active: true,
  createdAt: `2026-01-${String(10 + i).padStart(2, '0')}`,
  ...p,
});
const comp = (m: Mission, childId: string, periodKey: string): MissionCompletion => ({
  id: `c${++i}`,
  familyId: 'f',
  missionId: m.id,
  childId,
  periodKey,
  eventId: null,
  createdAt: '',
});

describe('buildSections', () => {
  it('range les missions par récurrence, pause et terminées', () => {
    const d = mission({ recurrence: 'daily' });
    const w = mission({ recurrence: 'weekly' });
    const o1 = mission({ recurrence: 'once' });
    const o2 = mission({ recurrence: 'once', childIds: ['a'] });
    const p = mission({ active: false });
    const s = buildSections([d, w, o1, o2, p], [A, B], [comp(o2, 'a', 'once')], NOW);
    expect(s.daily.map((v) => v.mission.id)).toEqual([d.id]);
    expect(s.weekly.map((v) => v.mission.id)).toEqual([w.id]);
    expect(s.challenges.map((v) => v.mission.id)).toEqual([o1.id]);
    expect(s.finished.map((v) => v.mission.id)).toEqual([o2.id]);
    expect(s.paused.map((v) => v.mission.id)).toEqual([p.id]);
  });

  it('une mission once pour tous n’est terminée que si chaque enfant a validé', () => {
    const o = mission({ recurrence: 'once' });
    expect(buildSections([o], [A, B], [comp(o, 'a', 'once')], NOW).finished).toHaveLength(0);
    const s = buildSections([o], [A, B], [comp(o, 'a', 'once'), comp(o, 'b', 'once')], NOW);
    expect(s.finished).toHaveLength(1);
  });

  it('compte la progression du jour : une mission est faite quand tous ses enfants ont validé', () => {
    const m1 = mission({});
    const m2 = mission({});
    const m3 = mission({ childIds: ['b'] });
    const s = buildSections(
      [m1, m2, m3],
      [A, B],
      [comp(m1, 'a', '2026-11-18'), comp(m1, 'b', '2026-11-18'), comp(m2, 'a', '2026-11-18'), comp(m3, 'b', '2026-11-17')],
      NOW,
    );
    expect(s.dailyProgress).toEqual({ done: 1, total: 3 });
  });

  it('ignore les validations d’une autre période', () => {
    const w = mission({ recurrence: 'weekly' });
    const old = buildSections([w], [A], [comp(w, 'a', '2026-11-09')], NOW);
    expect(old.weeklyProgress).toEqual({ done: 0, total: 1 });
    const cur = buildSections([w], [A], [comp(w, 'a', '2026-11-16')], NOW);
    expect(cur.weeklyProgress).toEqual({ done: 1, total: 1 });
  });

  it('en mode enfant (un seul enfant), ne garde que ses missions', () => {
    const mine = mission({ childIds: ['a'] });
    const other = mission({ childIds: ['b'] });
    const all = mission({});
    const s = buildSections([mine, other, all], [A], [], NOW);
    expect(s.daily.map((v) => v.mission.id)).toEqual([mine.id, all.id]);
  });
});

describe('progressText / normalizeChildIds', () => {
  it('formule la progression', () => {
    expect(progressText({ done: 2, total: 5 }, 'aujourd’hui')).toBe('2 missions sur 5 aujourd’hui');
    expect(progressText({ done: 1, total: 3 }, 'cette semaine')).toBe('1 mission sur 3 cette semaine');
    expect(progressText({ done: 3, total: 3 }, 'aujourd’hui')).toMatch(/bravo/);
  });
  it('tous cochés = tableau vide', () => {
    expect(normalizeChildIds(['a', 'b'], [A, B])).toEqual([]);
    expect(normalizeChildIds(['a'], [A, B])).toEqual(['a']);
    expect(normalizeChildIds(['zzz'], [A, B])).toEqual([]);
  });
});
