// Point d'entrée unique des données : `import { store } from '../data'`.
// Supabase si VITE_SUPABASE_URL et VITE_SUPABASE_KEY sont définis, sinon LocalStore (localStorage).
// supabase-js est chargé par import dynamique : il n'alourdit pas le mode local.
import type { DataStore } from './store';
import { createLocalStore } from './localStore';

export type { DataStore, Draft, AwardInput, ProfileInput } from './store';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_KEY?.trim();

/**
 * Enveloppe synchrone d'un store chargé en différé : chaque méthode attend le module,
 * et les abonnements (onAuthChange / subscribe) sont branchés dès qu'il est prêt.
 */
function lazyStore(load: () => Promise<DataStore>): DataStore {
  let pending: Promise<DataStore> | null = null;
  const get = () => (pending ??= load());

  const deferredSubscription = (attach: (s: DataStore) => () => void): (() => void) => {
    let unsub: (() => void) | null = null;
    let cancelled = false;
    get().then(
      (s) => {
        if (!cancelled) unsub = attach(s);
      },
      () => {},
    );
    return () => {
      cancelled = true;
      unsub?.();
    };
  };

  return {
    mode: 'supabase',
    getSession: () => get().then((s) => s.getSession()),
    signIn: (email, password) => get().then((s) => s.signIn(email, password)),
    signUp: (email, password) => get().then((s) => s.signUp(email, password)),
    signOut: () => get().then((s) => s.signOut()),
    onAuthChange: (cb) => deferredSubscription((s) => s.onAuthChange(cb)),
    load: () => get().then((s) => s.load()),
    createFamily: (input) => get().then((s) => s.createFamily(input)),
    joinFamily: (input) => get().then((s) => s.joinFamily(input)),
    subscribe: (cb) => deferredSubscription((s) => s.subscribe(cb)),
    upsertChild: (c) => get().then((s) => s.upsertChild(c)),
    deleteChild: (id) => get().then((s) => s.deleteChild(id)),
    updateParent: (id, patch) => get().then((s) => s.updateParent(id, patch)),
    renameFamily: (name) => get().then((s) => s.renameFamily(name)),
    upsertAction: (a) => get().then((s) => s.upsertAction(a)),
    deleteAction: (id) => get().then((s) => s.deleteAction(id)),
    awardPoints: (input) => get().then((s) => s.awardPoints(input)),
    deleteEvent: (id) => get().then((s) => s.deleteEvent(id)),
    upsertReward: (r) => get().then((s) => s.upsertReward(r)),
    deleteReward: (id) => get().then((s) => s.deleteReward(id)),
    redeemReward: (rewardId, childId) => get().then((s) => s.redeemReward(rewardId, childId)),
    uploadRewardImage: (file) => get().then((s) => s.uploadRewardImage(file)),
    upsertMission: (m) => get().then((s) => s.upsertMission(m)),
    deleteMission: (id) => get().then((s) => s.deleteMission(id)),
    completeMission: (missionId, childId) => get().then((s) => s.completeMission(missionId, childId)),
    uncompleteMission: (id) => get().then((s) => s.uncompleteMission(id)),
  };
}

export const store: DataStore =
  url && key
    ? lazyStore(() => import('./supabaseStore').then((m) => m.createSupabaseStore(url, key)))
    : createLocalStore();
