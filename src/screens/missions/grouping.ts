// Logique pure de l'écran Missions : regroupement par section et progression.
import type { Child, ID, Mission, MissionCompletion, MissionRecurrence } from '../../types';
import { currentCompletion, missionAppliesTo } from '../../domain/logic';

export interface KidStatus {
  child: Child;
  /** Validation de la période en cours, si elle existe. */
  completion?: MissionCompletion;
}

export interface MissionView {
  mission: Mission;
  kids: KidStatus[];
  /** Nombre d'enfants concernés ayant validé la période en cours. */
  doneCount: number;
  /** Tous les enfants concernés ont validé (faux s'il n'y a aucun enfant concerné). */
  done: boolean;
}

export interface Progress {
  done: number;
  total: number;
}

export interface MissionSections {
  daily: MissionView[];
  weekly: MissionView[];
  /** Défis (once) pas encore terminés. */
  challenges: MissionView[];
  /** Défis (once) validés par tous les enfants concernés. */
  finished: MissionView[];
  /** Missions en pause. */
  paused: MissionView[];
  dailyProgress: Progress;
  weeklyProgress: Progress;
}

export function missionView(
  mission: Mission,
  children: Child[],
  completions: MissionCompletion[],
  now: Date = new Date(),
): MissionView {
  const kids = children
    .filter((c) => missionAppliesTo(mission, c.id))
    .map((child) => ({ child, completion: currentCompletion(mission, child.id, completions, now) }));
  const doneCount = kids.filter((k) => k.completion).length;
  return { mission, kids, doneCount, done: kids.length > 0 && doneCount === kids.length };
}

function progressOf(views: MissionView[]): Progress {
  return { done: views.filter((v) => v.done).length, total: views.length };
}

/**
 * Regroupe les missions. `children` = enfants pris en compte (en mode enfant : l'enfant seul).
 * Avec `onlyForChildren`, les missions ne concernant aucun de ces enfants sont ignorées.
 */
export function buildSections(
  missions: Mission[],
  children: Child[],
  completions: MissionCompletion[],
  now: Date = new Date(),
): MissionSections {
  const views = missions
    .map((m) => missionView(m, children, completions, now))
    // Une mission qui ne concerne aucun enfant visible n'a rien à afficher (sauf s'il n'y a aucun enfant).
    .filter((v) => children.length === 0 || v.kids.length > 0);
  const byDate = (a: MissionView, b: MissionView) => a.mission.createdAt.localeCompare(b.mission.createdAt);
  const pick = (rec: MissionRecurrence) =>
    views.filter((v) => v.mission.active && v.mission.recurrence === rec).sort(byDate);
  const onceViews = pick('once');
  const daily = pick('daily');
  const weekly = pick('weekly');
  return {
    daily,
    weekly,
    challenges: onceViews.filter((v) => !v.done),
    finished: onceViews.filter((v) => v.done),
    paused: views.filter((v) => !v.mission.active).sort(byDate),
    dailyProgress: progressOf(daily),
    weeklyProgress: progressOf(weekly),
  };
}

/** Phrase de progression, ex. « 2 missions sur 5 aujourd'hui ». */
export function progressText(p: Progress, period: 'aujourd’hui' | 'cette semaine'): string {
  if (p.total > 0 && p.done === p.total) {
    return period === 'aujourd’hui' ? 'Tout est fait aujourd’hui, bravo !' : 'Tout est fait cette semaine, bravo !';
  }
  return `${p.done} ${p.done > 1 ? 'missions' : 'mission'} sur ${p.total} ${period}`;
}

/** Normalise la sélection du formulaire : tous les enfants cochés = « tous » (tableau vide). */
export function normalizeChildIds(selected: ID[], allChildren: Child[]): ID[] {
  const valid = allChildren.filter((c) => selected.includes(c.id)).map((c) => c.id);
  return valid.length === allChildren.length ? [] : valid;
}
