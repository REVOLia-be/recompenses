// Mémorise, par enfant et sur cet appareil, le dernier stade de compagnon déjà montré,
// pour jouer la séquence d'évolution quand un nouveau stade est franchi.
import type { ID } from '../../types';

export const seenKey = (childId: ID) => `pepites:companion-seen:${childId}`;

export function readSeenStage(childId: ID): number | null {
  try {
    const raw = window.localStorage.getItem(seenKey(childId));
    if (raw == null) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function writeSeenStage(childId: ID, stage: number): void {
  try {
    window.localStorage.setItem(seenKey(childId), String(stage));
  } catch {
    /* stockage indisponible : la célébration sera simplement rejouée */
  }
}

export type SeenDecision = { kind: 'none' } | { kind: 'record' } | { kind: 'evolve'; from: number };

/**
 * Que faire en arrivant sur le compagnon ?
 *  - jamais vu : on mémorise sans célébrer (première rencontre) ;
 *  - stade supérieur au dernier vu : on célèbre l'évolution ;
 *  - stade inférieur (points annulés) : on mémorise silencieusement.
 */
export function seenDecision(seen: number | null, stage: number): SeenDecision {
  if (seen === null) return { kind: 'record' };
  if (stage > seen) return { kind: 'evolve', from: seen };
  if (stage < seen) return { kind: 'record' };
  return { kind: 'none' };
}
