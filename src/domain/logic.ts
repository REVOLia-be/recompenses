// Règles métier pures, partagées par les écrans et les deux stores.
import type {
  Child,
  FamilyData,
  ID,
  Mission,
  MissionCompletion,
  PointEvent,
  Redemption,
  Reward,
} from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Jour local YYYY-MM-DD. */
export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Lundi (local) de la semaine de `d`, YYYY-MM-DD. La semaine va du lundi au dimanche. */
export function weekKey(d: Date = new Date()): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return dayKey(x);
}

/** Solde actuel de l'enfant (gagné − dépensé). */
export function balance(events: PointEvent[], childId: ID): number {
  return events.reduce((s, e) => (e.childId === childId ? s + e.points : s), 0);
}

/** Points gagnés (hors dépenses de récompenses) depuis lundi. */
export function weekPoints(events: PointEvent[], childId: ID, now: Date = new Date()): number {
  const wk = weekKey(now);
  return events.reduce(
    (s, e) =>
      e.childId === childId && e.kind !== 'reward' && weekKey(new Date(e.createdAt)) === wk
        ? s + e.points
        : s,
    0,
  );
}

/** Total gagné depuis toujours (hors dépenses) — fait grandir le compagnon. */
export function lifetimePoints(events: PointEvent[], childId: ID): number {
  return Math.max(
    0,
    events.reduce((s, e) => (e.childId === childId && e.kind !== 'reward' ? s + e.points : s), 0),
  );
}

export function familyTotal(data: Pick<FamilyData, 'children' | 'events'>): number {
  return data.children.reduce((s, c) => s + balance(data.events, c.id), 0);
}

export interface RewardStatus {
  /** Points pris en compte : solde ('spend') ou points de la semaine ('weekly'). */
  have: number;
  missing: number;
  /** 0..1 */
  progress: number;
  /** Récompense 'weekly' déjà offerte cette semaine. */
  alreadyClaimed: boolean;
  canRedeem: boolean;
}

export function rewardStatus(
  reward: Reward,
  child: Child,
  events: PointEvent[],
  redemptions: Redemption[],
  now: Date = new Date(),
): RewardStatus {
  const have = reward.mode === 'weekly' ? weekPoints(events, child.id, now) : balance(events, child.id);
  const missing = Math.max(0, reward.cost - have);
  const alreadyClaimed =
    reward.mode === 'weekly' &&
    redemptions.some(
      (r) => r.rewardId === reward.id && r.childId === child.id && r.weekKey === weekKey(now),
    );
  return {
    have,
    missing,
    progress: reward.cost <= 0 ? 1 : Math.min(1, Math.max(0, have / reward.cost)),
    alreadyClaimed,
    canRedeem: missing === 0 && !alreadyClaimed,
  };
}

/** Clé de période en cours pour une mission. */
export function missionPeriodKey(mission: Mission, now: Date = new Date()): string {
  if (mission.recurrence === 'daily') return dayKey(now);
  if (mission.recurrence === 'weekly') return weekKey(now);
  return 'once';
}

export function missionAppliesTo(mission: Mission, childId: ID): boolean {
  return mission.childIds.length === 0 || mission.childIds.includes(childId);
}

/** Validation de la période en cours, si elle existe. */
export function currentCompletion(
  mission: Mission,
  childId: ID,
  completions: MissionCompletion[],
  now: Date = new Date(),
): MissionCompletion | undefined {
  const key = missionPeriodKey(mission, now);
  return completions.find(
    (c) => c.missionId === mission.id && c.childId === childId && c.periodKey === key,
  );
}

// --- Compagnon ---------------------------------------------------------------

export const COMPANION_STAGES = [
  { stage: 0, at: 0, label: 'Œuf endormi' },
  { stage: 1, at: 20, label: 'Œuf qui frémit' },
  { stage: 2, at: 50, label: 'Éclosion' },
  { stage: 3, at: 120, label: 'Bébé' },
  { stage: 4, at: 250, label: 'Grand' },
  { stage: 5, at: 500, label: 'Légendaire' },
] as const;

export interface CompanionState {
  stage: number;
  label: string;
  lifetime: number;
  /** Seuil du stade suivant, null au stade maximum. */
  nextAt: number | null;
  /** 0..1 vers le stade suivant. */
  progress: number;
}

export function companionState(events: PointEvent[], childId: ID): CompanionState {
  const lifetime = lifetimePoints(events, childId);
  let i = 0;
  while (i + 1 < COMPANION_STAGES.length && lifetime >= COMPANION_STAGES[i + 1].at) i++;
  const cur = COMPANION_STAGES[i];
  const next = COMPANION_STAGES[i + 1];
  return {
    stage: cur.stage,
    label: cur.label,
    lifetime,
    nextAt: next ? next.at : null,
    progress: next ? (lifetime - cur.at) / (next.at - cur.at) : 1,
  };
}

export function ageFromBirthdate(birthdate: string | null, now: Date = new Date()): number | null {
  if (!birthdate) return null;
  const b = new Date(birthdate + 'T00:00:00');
  if (Number.isNaN(b.getTime())) return null;
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  return age;
}
