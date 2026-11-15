import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_ACTIONS, LocalStore } from './localStore';

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => Array.from(m.keys())[i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

let now = new Date(2026, 10, 11, 12, 0, 0); // mercredi
const clock = () => now;

async function setup() {
  const store = new LocalStore({ storage: memoryStorage(), now: clock });
  await store.createFamily({ familyName: 'Martin', parentName: 'Alex', roleLabel: 'Papa', emoji: '🧔' });
  await store.upsertChild({ name: 'Léa', emoji: '🦊', color: '#ffd6e7', birthdate: null, companionName: 'Pip' });
  const data = (await store.load())!;
  return { store, childId: data.children[0].id };
}

describe('LocalStore', () => {
  beforeEach(() => {
    now = new Date(2026, 10, 11, 12, 0, 0);
  });

  it('session fictive et famille absente au départ', async () => {
    const store = new LocalStore({ storage: memoryStorage() });
    expect(await store.getSession()).toMatchObject({ userId: 'local-user' });
    expect(await store.load()).toBeNull();
  });

  it('createFamily sème les bonnes actions par défaut', async () => {
    const { store } = await setup();
    const data = (await store.load())!;
    expect(data.family.name).toBe('Martin');
    expect(data.family.inviteCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(data.me.name).toBe('Alex');
    expect(data.actions).toHaveLength(DEFAULT_ACTIONS.length);
    expect(data.actions.length).toBeGreaterThanOrEqual(6);
    await expect(store.createFamily({ familyName: 'X', parentName: 'Y', roleLabel: '', emoji: '' })).rejects.toThrow(/existe déjà/);
  });

  it('awardPoints crée un événement par enfant, deleteEvent annule', async () => {
    const { store, childId } = await setup();
    await store.upsertChild({ name: 'Tom', emoji: '🐻', color: '#d0ebff', birthdate: null, companionName: '' });
    let data = (await store.load())!;
    await store.awardPoints({ childIds: data.children.map((c) => c.id), points: 3, label: 'Bravo', emoji: '💛', kind: 'manual' });
    data = (await store.load())!;
    expect(data.events).toHaveLength(2);
    await store.deleteEvent(data.events.find((e) => e.childId === childId)!.id);
    expect((await store.load())!.events).toHaveLength(1);
    await expect(store.awardPoints({ childIds: [], points: 1, label: 'x', emoji: '', kind: 'manual' })).rejects.toThrow(/au moins un enfant/);
  });

  it("redeemReward 'spend' : refuse si solde insuffisant, déduit sinon", async () => {
    const { store, childId } = await setup();
    await store.upsertReward({ title: 'Équitation', emoji: '🐴', imageUrl: null, cost: 5, category: '', mode: 'spend', favorite: true });
    const rewardId = (await store.load())!.rewards[0].id;
    await expect(store.redeemReward(rewardId, childId)).rejects.toThrow('Il manque encore 5 points à Léa.');
    await store.awardPoints({ childIds: [childId], points: 6, label: 'Super', emoji: '⭐', kind: 'manual' });
    await store.redeemReward(rewardId, childId);
    const data = (await store.load())!;
    expect(data.redemptions).toHaveLength(1);
    expect(data.events[0]).toMatchObject({ kind: 'reward', points: -5 });
    await expect(store.deleteEvent(data.events[0].id)).rejects.toThrow();
  });

  it("redeemReward 'weekly' : une fois par semaine, sans déduction", async () => {
    const { store, childId } = await setup();
    await store.upsertReward({ title: 'Film', emoji: '🎬', imageUrl: null, cost: 3, category: '', mode: 'weekly', favorite: false });
    const rewardId = (await store.load())!.rewards[0].id;
    await store.awardPoints({ childIds: [childId], points: 3, label: 'ok', emoji: '⭐', kind: 'manual' });
    await store.redeemReward(rewardId, childId);
    await expect(store.redeemReward(rewardId, childId)).rejects.toThrow(/cette semaine/);
    const data = (await store.load())!;
    expect(data.redemptions[0].weekKey).toBe('2026-11-09');
    expect(data.events.every((e) => e.kind !== 'reward')).toBe(true);
  });

  it('completeMission / uncompleteMission', async () => {
    const { store, childId } = await setup();
    await store.upsertMission({ title: 'Lit fait', emoji: '🛏️', points: 2, recurrence: 'daily', childIds: [], active: true });
    const missionId = (await store.load())!.missions[0].id;
    await store.completeMission(missionId, childId);
    await expect(store.completeMission(missionId, childId)).rejects.toThrow(/aujourd’hui/);
    let data = (await store.load())!;
    expect(data.completions[0].periodKey).toBe('2026-11-11');
    expect(data.events[0]).toMatchObject({ kind: 'mission', points: 2 });
    // le lendemain, nouvelle période
    now = new Date(2026, 10, 12, 9, 0, 0);
    await store.completeMission(missionId, childId);
    data = (await store.load())!;
    expect(data.completions).toHaveLength(2);
    await store.uncompleteMission(data.completions[0].id);
    data = (await store.load())!;
    expect(data.completions).toHaveLength(1);
    expect(data.events).toHaveLength(1);
  });

  it('deleteChild supprime ses données liées', async () => {
    const { store, childId } = await setup();
    await store.awardPoints({ childIds: [childId], points: 2, label: 'ok', emoji: '⭐', kind: 'manual' });
    await store.deleteChild(childId);
    const data = (await store.load())!;
    expect(data.children).toHaveLength(0);
    expect(data.events).toHaveLength(0);
  });

  it('uploadRewardImage renvoie une data URL', async () => {
    const { store } = await setup();
    const url = await store.uploadRewardImage(new Blob(['abc'], { type: 'image/png' }));
    expect(url).toMatch(/^data:image\/png;base64,/);
  });
});
