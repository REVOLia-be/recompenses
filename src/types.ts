// Contrat de données partagé par toute l'application.
// Ne pas modifier sans mettre à jour les deux stores (local + Supabase) et la migration SQL.

export type ID = string;

export interface Family {
  id: ID;
  name: string;
  /** Code court à partager pour que le 2e parent rejoigne la famille. */
  inviteCode: string;
  createdAt: string;
}

export interface Parent {
  id: ID;
  familyId: ID;
  /** auth.users.id (null en mode local). */
  userId: string | null;
  name: string;
  /** « Papa », « Maman », … */
  roleLabel: string;
  emoji: string;
  birthdate: string | null; // YYYY-MM-DD
  email: string | null;
}

export interface Child {
  id: ID;
  familyId: ID;
  name: string;
  emoji: string;
  /** Couleur de fond de l'avatar (hex). */
  color: string;
  birthdate: string | null;
  /** Nom du compagnon de l'enfant. */
  companionName: string;
  createdAt: string;
}

/** Bonne action prédéfinie, attribuable en un tap. */
export interface GoodAction {
  id: ID;
  familyId: ID;
  label: string;
  emoji: string;
  points: number;
  sortOrder: number;
}

export type PointEventKind = 'action' | 'manual' | 'mission' | 'reward' | 'adjustment';

/** Ligne du journal de points. points > 0 = gagné, < 0 = dépensé / retiré. */
export interface PointEvent {
  id: ID;
  familyId: ID;
  childId: ID;
  points: number;
  label: string;
  emoji: string;
  kind: PointEventKind;
  /** id de l'action / mission / récompense liée, le cas échéant. */
  refId: ID | null;
  /** Parent.id de l'auteur. */
  createdBy: ID | null;
  createdAt: string;
}

/**
 * 'spend'  : la récompense coûte des points, déduits du solde de l'enfant.
 * 'weekly' : objectif de la semaine — débloquée quand les points gagnés depuis lundi
 *            atteignent `cost` ; réclamable une fois par semaine, sans déduction.
 */
export type RewardMode = 'spend' | 'weekly';

export interface Reward {
  id: ID;
  familyId: ID;
  title: string;
  emoji: string;
  imageUrl: string | null;
  cost: number;
  category: string;
  mode: RewardMode;
  favorite: boolean;
  createdAt: string;
}

export interface Redemption {
  id: ID;
  familyId: ID;
  rewardId: ID;
  childId: ID;
  cost: number;
  /** Clé de semaine (lundi, YYYY-MM-DD) pour les récompenses 'weekly', sinon null. */
  weekKey: string | null;
  createdBy: ID | null;
  createdAt: string;
}

export type MissionRecurrence = 'once' | 'daily' | 'weekly';

export interface Mission {
  id: ID;
  familyId: ID;
  title: string;
  emoji: string;
  points: number;
  recurrence: MissionRecurrence;
  /** Enfants concernés ; tableau vide = tous les enfants. */
  childIds: ID[];
  active: boolean;
  createdAt: string;
}

export interface MissionCompletion {
  id: ID;
  familyId: ID;
  missionId: ID;
  childId: ID;
  /** 'once' | jour YYYY-MM-DD (daily) | lundi YYYY-MM-DD (weekly). Unique par (mission, enfant, période). */
  periodKey: string;
  /** PointEvent créé par la validation (supprimé si on annule). */
  eventId: ID | null;
  createdAt: string;
}

export interface FamilyData {
  family: Family;
  /** Le parent connecté. */
  me: Parent;
  parents: Parent[];
  children: Child[];
  actions: GoodAction[];
  /** Triés du plus récent au plus ancien. */
  events: PointEvent[];
  rewards: Reward[];
  redemptions: Redemption[];
  missions: Mission[];
  completions: MissionCompletion[];
}

export interface Session {
  userId: string;
  email: string | null;
}
