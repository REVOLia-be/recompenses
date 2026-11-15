// Implémentation de DataStore sur localStorage (mode 'local', sans compte).
// Toutes les données d'une famille tiennent dans une seule clé JSON.
import type {
  Child,
  Family,
  FamilyData,
  GoodAction,
  ID,
  Mission,
  MissionCompletion,
  Parent,
  PointEvent,
  Redemption,
  Reward,
  Session,
} from '../types';
import type { AwardInput, DataStore, Draft, ProfileInput } from './store';
import { missionAppliesTo, missionPeriodKey, rewardStatus, weekKey } from '../domain/logic';

export const LOCAL_DB_KEY = 'pepites:db:v1';
export const LOCAL_SESSION: Session = { userId: 'local-user', email: null };

interface LocalDB {
  version: 1;
  family: Family | null;
  meId: ID | null;
  parents: Parent[];
  children: Child[];
  actions: GoodAction[];
  /** Du plus récent au plus ancien. */
  events: PointEvent[];
  rewards: Reward[];
  redemptions: Redemption[];
  missions: Mission[];
  completions: MissionCompletion[];
}

const emptyDB = (): LocalDB => ({
  version: 1,
  family: null,
  meId: null,
  parents: [],
  children: [],
  actions: [],
  events: [],
  rewards: [],
  redemptions: [],
  missions: [],
  completions: [],
});

/** Bonnes actions semées à la création de la famille. */
export const DEFAULT_ACTIONS: ReadonlyArray<Pick<GoodAction, 'label' | 'emoji' | 'points'>> = [
  { label: 'A rangé sa chambre', emoji: '🧸', points: 2 },
  { label: 'A mis la table', emoji: '🍽️', points: 1 },
  { label: 'A aidé sans qu’on demande', emoji: '💛', points: 3 },
  { label: 'Devoirs faits', emoji: '📚', points: 2 },
  { label: 'S’est brossé les dents', emoji: '🪥', points: 1 },
  { label: 'A été gentil·le avec son frère ou sa sœur', emoji: '🤝', points: 2 },
  { label: 'S’est habillé·e tout·e seul·e', emoji: '👕', points: 1 },
  { label: 'A goûté un nouvel aliment', emoji: '🥦', points: 2 },
];

export function newId(): ID {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function makeInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function fail(message: string): never {
  throw new Error(message);
}

function requireText(value: string | undefined | null, message: string): string {
  const v = (value ?? '').trim();
  if (!v) fail(message);
  return v;
}

function requirePoints(n: number, message = 'Le nombre de points doit être un entier.'): number {
  if (!Number.isFinite(n) || !Number.isInteger(n)) fail(message);
  return n;
}

const plural = (n: number) => (Math.abs(n) > 1 ? 'points' : 'point');

export interface LocalStoreOptions {
  /** Par défaut window.localStorage. */
  storage?: Storage;
  key?: string;
  /** Horloge injectable (tests). */
  now?: () => Date;
}

export class LocalStore implements DataStore {
  readonly mode = 'local' as const;
  private readonly storage: Storage;
  private readonly key: string;
  private readonly now: () => Date;
  private authListeners = new Set<(s: Session | null) => void>();

  constructor(opts: LocalStoreOptions = {}) {
    this.storage = opts.storage ?? window.localStorage;
    this.key = opts.key ?? LOCAL_DB_KEY;
    this.now = opts.now ?? (() => new Date());
  }

  // --- Persistance ---------------------------------------------------------

  private read(): LocalDB {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return emptyDB();
      const parsed = JSON.parse(raw) as Partial<LocalDB>;
      return { ...emptyDB(), ...parsed, version: 1 };
    } catch {
      return emptyDB();
    }
  }

  private write(db: LocalDB): void {
    try {
      this.storage.setItem(this.key, JSON.stringify(db));
    } catch {
      fail('Impossible d’enregistrer : la mémoire de l’appareil est pleine (essayez une image plus petite).');
    }
  }

  /** Lit, applique la mutation, écrit. La famille doit exister. */
  private mutate<T>(fn: (db: LocalDB, family: Family) => T): T {
    const db = this.read();
    if (!db.family) fail('Aucune famille sur cet appareil. Créez-en une d’abord.');
    const result = fn(db, db.family);
    this.write(db);
    return result;
  }

  private iso(): string {
    return this.now().toISOString();
  }

  // --- Session -------------------------------------------------------------

  async getSession(): Promise<Session | null> {
    return LOCAL_SESSION;
  }

  async signIn(): Promise<void> {
    this.authListeners.forEach((cb) => cb(LOCAL_SESSION));
  }

  async signUp(): Promise<{ needsEmailConfirmation: boolean }> {
    return { needsEmailConfirmation: false };
  }

  /** En mode local, il n'y a pas de compte : la déconnexion est sans effet. */
  async signOut(): Promise<void> {
    this.authListeners.forEach((cb) => cb(LOCAL_SESSION));
  }

  onAuthChange(cb: (session: Session | null) => void): () => void {
    this.authListeners.add(cb);
    return () => {
      this.authListeners.delete(cb);
    };
  }

  // --- Famille -------------------------------------------------------------

  async load(): Promise<FamilyData | null> {
    const db = this.read();
    if (!db.family) return null;
    const me = db.parents.find((p) => p.id === db.meId) ?? db.parents[0];
    if (!me) return null;
    return {
      family: db.family,
      me,
      parents: db.parents,
      children: db.children,
      actions: [...db.actions].sort((a, b) => a.sortOrder - b.sortOrder),
      events: [...db.events].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0)),
      rewards: db.rewards,
      redemptions: db.redemptions,
      missions: db.missions,
      completions: db.completions,
    };
  }

  async createFamily(input: ProfileInput & { familyName: string }): Promise<void> {
    const db = this.read();
    if (db.family) fail('Une famille existe déjà sur cet appareil.');
    const familyName = requireText(input.familyName, 'Donnez un nom à votre famille.');
    const parentName = requireText(input.parentName, 'Indiquez votre prénom.');
    const createdAt = this.iso();
    const family: Family = { id: newId(), name: familyName, inviteCode: makeInviteCode(), createdAt };
    const me: Parent = {
      id: newId(),
      familyId: family.id,
      userId: null,
      name: parentName,
      roleLabel: input.roleLabel.trim() || 'Parent',
      emoji: input.emoji || '🙂',
      birthdate: null,
      email: null,
    };
    const next = emptyDB();
    next.family = family;
    next.meId = me.id;
    next.parents = [me];
    next.actions = DEFAULT_ACTIONS.map((a, i) => ({ ...a, id: newId(), familyId: family.id, sortOrder: i }));
    this.write(next);
  }

  /**
   * En mode local, rejoindre n'a de sens que sur le même appareil : ajoute un 2e profil parent
   * à la famille existante si le code correspond.
   */
  async joinFamily(input: ProfileInput & { inviteCode: string }): Promise<void> {
    const db = this.read();
    const code = input.inviteCode.trim().toUpperCase();
    if (!db.family || db.family.inviteCode !== code) {
      fail('Code d’invitation introuvable. En mode local, les données restent sur cet appareil.');
    }
    const me: Parent = {
      id: newId(),
      familyId: db.family.id,
      userId: null,
      name: requireText(input.parentName, 'Indiquez votre prénom.'),
      roleLabel: input.roleLabel.trim() || 'Parent',
      emoji: input.emoji || '🙂',
      birthdate: null,
      email: null,
    };
    db.parents.push(me);
    db.meId = me.id;
    this.write(db);
  }

  subscribe(cb: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = (e: StorageEvent) => {
      if (e.key === null || e.key === this.key) cb();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }

  // --- Enfants / parents ---------------------------------------------------

  async upsertChild(child: Draft<Child>): Promise<void> {
    const name = requireText(child.name, 'Le prénom de l’enfant est obligatoire.');
    this.mutate((db, family) => {
      const clean = { ...child, name, companionName: child.companionName.trim() };
      if (child.id) {
        const i = db.children.findIndex((c) => c.id === child.id);
        if (i < 0) fail('Enfant introuvable.');
        db.children[i] = { ...db.children[i], ...clean, id: child.id };
      } else {
        db.children.push({ ...clean, id: newId(), familyId: family.id, createdAt: this.iso() });
      }
    });
  }

  async deleteChild(id: ID): Promise<void> {
    this.mutate((db) => {
      db.children = db.children.filter((c) => c.id !== id);
      db.events = db.events.filter((e) => e.childId !== id);
      db.completions = db.completions.filter((c) => c.childId !== id);
      db.redemptions = db.redemptions.filter((r) => r.childId !== id);
      db.missions = db.missions.map((m) => ({ ...m, childIds: m.childIds.filter((c) => c !== id) }));
    });
  }

  async updateParent(
    id: ID,
    patch: Partial<Pick<Parent, 'name' | 'roleLabel' | 'emoji' | 'birthdate'>>,
  ): Promise<void> {
    if (patch.name !== undefined) requireText(patch.name, 'Le prénom est obligatoire.');
    this.mutate((db) => {
      const i = db.parents.findIndex((p) => p.id === id);
      if (i < 0) fail('Parent introuvable.');
      db.parents[i] = { ...db.parents[i], ...patch };
    });
  }

  async renameFamily(name: string): Promise<void> {
    const n = requireText(name, 'Le nom de la famille est obligatoire.');
    this.mutate((db, family) => {
      db.family = { ...family, name: n };
    });
  }

  // --- Bonnes actions ------------------------------------------------------

  async upsertAction(action: Draft<GoodAction>): Promise<void> {
    const label = requireText(action.label, 'Décrivez la bonne action.');
    requirePoints(action.points);
    this.mutate((db, family) => {
      if (action.id) {
        const i = db.actions.findIndex((a) => a.id === action.id);
        if (i < 0) fail('Bonne action introuvable.');
        db.actions[i] = { ...db.actions[i], ...action, label, id: action.id };
      } else {
        db.actions.push({ ...action, label, id: newId(), familyId: family.id });
      }
    });
  }

  async deleteAction(id: ID): Promise<void> {
    this.mutate((db) => {
      db.actions = db.actions.filter((a) => a.id !== id);
    });
  }

  // --- Points --------------------------------------------------------------

  async awardPoints(input: AwardInput): Promise<void> {
    if (input.childIds.length === 0) fail('Choisissez au moins un enfant.');
    requirePoints(input.points);
    if (input.points === 0) fail('Le nombre de points ne peut pas être zéro.');
    const label = requireText(input.label, 'Ajoutez un petit mot pour ces points.');
    this.mutate((db, family) => {
      const createdAt = this.iso();
      for (const childId of input.childIds) {
        if (!db.children.some((c) => c.id === childId)) fail('Enfant introuvable.');
        db.events.unshift({
          id: newId(),
          familyId: family.id,
          childId,
          points: input.points,
          label,
          emoji: input.emoji || '⭐',
          kind: input.kind,
          refId: input.refId ?? null,
          createdBy: db.meId,
          createdAt,
        });
      }
    });
  }

  async deleteEvent(id: ID): Promise<void> {
    this.mutate((db) => {
      const ev = db.events.find((e) => e.id === id);
      if (!ev) fail('Ligne introuvable.');
      if (ev.kind === 'reward') fail('Une récompense offerte ne peut pas être annulée depuis le journal.');
      if (ev.kind === 'mission') fail('Pour annuler une mission, décochez-la dans l’onglet Missions.');
      db.events = db.events.filter((e) => e.id !== id);
    });
  }

  // --- Récompenses ---------------------------------------------------------

  async upsertReward(reward: Draft<Reward>): Promise<void> {
    const title = requireText(reward.title, 'Donnez un nom à la récompense.');
    requirePoints(reward.cost, 'Le prix doit être un nombre entier de points.');
    if (reward.cost < 0) fail('Le prix ne peut pas être négatif.');
    this.mutate((db, family) => {
      if (reward.id) {
        const i = db.rewards.findIndex((r) => r.id === reward.id);
        if (i < 0) fail('Récompense introuvable.');
        db.rewards[i] = { ...db.rewards[i], ...reward, title, id: reward.id };
      } else {
        db.rewards.push({ ...reward, title, id: newId(), familyId: family.id, createdAt: this.iso() });
      }
    });
  }

  async deleteReward(id: ID): Promise<void> {
    this.mutate((db) => {
      db.rewards = db.rewards.filter((r) => r.id !== id);
    });
  }

  async redeemReward(rewardId: ID, childId: ID): Promise<void> {
    this.mutate((db, family) => {
      const reward = db.rewards.find((r) => r.id === rewardId) ?? fail('Récompense introuvable.');
      const child = db.children.find((c) => c.id === childId) ?? fail('Enfant introuvable.');
      const now = this.now();
      const st = rewardStatus(reward, child, db.events, db.redemptions, now);
      if (st.alreadyClaimed) fail(`${child.name} a déjà reçu « ${reward.title} » cette semaine.`);
      if (!st.canRedeem) {
        fail(
          reward.mode === 'weekly'
            ? `Il manque encore ${st.missing} ${plural(st.missing)} cette semaine à ${child.name}.`
            : `Il manque encore ${st.missing} ${plural(st.missing)} à ${child.name}.`,
        );
      }
      const createdAt = now.toISOString();
      db.redemptions.push({
        id: newId(),
        familyId: family.id,
        rewardId,
        childId,
        cost: reward.cost,
        weekKey: reward.mode === 'weekly' ? weekKey(now) : null,
        createdBy: db.meId,
        createdAt,
      });
      if (reward.mode === 'spend' && reward.cost > 0) {
        db.events.unshift({
          id: newId(),
          familyId: family.id,
          childId,
          points: -reward.cost,
          label: reward.title,
          emoji: reward.emoji || '🎁',
          kind: 'reward',
          refId: reward.id,
          createdBy: db.meId,
          createdAt,
        });
      }
    });
  }

  /** Stocke l'image en data URL directement dans les données. */
  uploadRewardImage(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Impossible de lire cette image.'));
      reader.readAsDataURL(file);
    });
  }

  // --- Missions ------------------------------------------------------------

  async upsertMission(mission: Draft<Mission>): Promise<void> {
    const title = requireText(mission.title, 'Donnez un titre à la mission.');
    requirePoints(mission.points);
    this.mutate((db, family) => {
      if (mission.id) {
        const i = db.missions.findIndex((m) => m.id === mission.id);
        if (i < 0) fail('Mission introuvable.');
        db.missions[i] = { ...db.missions[i], ...mission, title, id: mission.id };
      } else {
        db.missions.push({ ...mission, title, id: newId(), familyId: family.id, createdAt: this.iso() });
      }
    });
  }

  async deleteMission(id: ID): Promise<void> {
    this.mutate((db) => {
      db.missions = db.missions.filter((m) => m.id !== id);
      db.completions = db.completions.filter((c) => c.missionId !== id);
    });
  }

  async completeMission(missionId: ID, childId: ID): Promise<void> {
    this.mutate((db, family) => {
      const mission = db.missions.find((m) => m.id === missionId) ?? fail('Mission introuvable.');
      const child = db.children.find((c) => c.id === childId) ?? fail('Enfant introuvable.');
      if (!mission.active) fail('Cette mission est en pause.');
      if (!missionAppliesTo(mission, childId)) fail(`Cette mission ne concerne pas ${child.name}.`);
      const now = this.now();
      const periodKey = missionPeriodKey(mission, now);
      const already = db.completions.some(
        (c) => c.missionId === missionId && c.childId === childId && c.periodKey === periodKey,
      );
      if (already) {
        fail(
          mission.recurrence === 'daily'
            ? `${child.name} a déjà validé cette mission aujourd’hui.`
            : mission.recurrence === 'weekly'
              ? `${child.name} a déjà validé cette mission cette semaine.`
              : `${child.name} a déjà validé cette mission.`,
        );
      }
      const createdAt = now.toISOString();
      const eventId = newId();
      db.events.unshift({
        id: eventId,
        familyId: family.id,
        childId,
        points: mission.points,
        label: mission.title,
        emoji: mission.emoji || '🚩',
        kind: 'mission',
        refId: mission.id,
        createdBy: db.meId,
        createdAt,
      });
      db.completions.push({
        id: newId(),
        familyId: family.id,
        missionId,
        childId,
        periodKey,
        eventId,
        createdAt,
      });
    });
  }

  async uncompleteMission(completionId: ID): Promise<void> {
    this.mutate((db) => {
      const comp = db.completions.find((c) => c.id === completionId) ?? fail('Validation introuvable.');
      db.completions = db.completions.filter((c) => c.id !== completionId);
      if (comp.eventId) db.events = db.events.filter((e) => e.id !== comp.eventId);
    });
  }
}

export function createLocalStore(opts?: LocalStoreOptions): DataStore {
  return new LocalStore(opts);
}
