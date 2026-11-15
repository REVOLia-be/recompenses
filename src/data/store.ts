import type {
  Child,
  FamilyData,
  GoodAction,
  ID,
  Mission,
  Parent,
  PointEventKind,
  Reward,
  Session,
} from '../types';

/** Pour les upsert : sans `id` => création, avec `id` => mise à jour. familyId/createdAt gérés par le store. */
export type Draft<T> = Omit<T, 'id' | 'familyId' | 'createdAt'> & { id?: ID };

export interface ProfileInput {
  parentName: string;
  roleLabel: string;
  emoji: string;
}

export interface AwardInput {
  childIds: ID[];
  /** Positif pour donner, négatif pour retirer. */
  points: number;
  label: string;
  emoji: string;
  kind: PointEventKind;
  refId?: ID | null;
}

/**
 * Accès aux données. Deux implémentations :
 *  - LocalStore   (localStorage, sans compte — mode démo / hors Supabase)
 *  - SupabaseStore (auth email + mot de passe, RLS par famille, temps réel)
 * Toutes les mutations rejettent avec une Error dont le message est en français et affichable.
 */
export interface DataStore {
  readonly mode: 'local' | 'supabase';

  // --- Session -------------------------------------------------------------
  /** En mode local : renvoie toujours une session fictive. */
  getSession(): Promise<Session | null>;
  signIn(email: string, password: string): Promise<void>;
  /** Renvoie { needsEmailConfirmation: true } si l'utilisateur doit confirmer son e-mail avant de se connecter. */
  signUp(email: string, password: string): Promise<{ needsEmailConfirmation: boolean }>;
  signOut(): Promise<void>;
  onAuthChange(cb: (session: Session | null) => void): () => void;

  // --- Famille -------------------------------------------------------------
  /** null si l'utilisateur connecté n'appartient encore à aucune famille. */
  load(): Promise<FamilyData | null>;
  /** Crée la famille + le profil parent + quelques bonnes actions par défaut. */
  createFamily(input: ProfileInput & { familyName: string }): Promise<void>;
  joinFamily(input: ProfileInput & { inviteCode: string }): Promise<void>;
  /** Appelle cb quand les données ont changé ailleurs (autre appareil / onglet). Renvoie la fonction de désabonnement. */
  subscribe(cb: () => void): () => void;

  // --- Mutations -----------------------------------------------------------
  upsertChild(child: Draft<Child>): Promise<void>;
  /** Supprime aussi ses événements, validations et échanges. */
  deleteChild(id: ID): Promise<void>;
  updateParent(id: ID, patch: Partial<Pick<Parent, 'name' | 'roleLabel' | 'emoji' | 'birthdate'>>): Promise<void>;
  renameFamily(name: string): Promise<void>;

  upsertAction(action: Draft<GoodAction>): Promise<void>;
  deleteAction(id: ID): Promise<void>;

  /** Crée un PointEvent par enfant. */
  awardPoints(input: AwardInput): Promise<void>;
  /** Annule une ligne du journal (ne s'applique pas aux lignes kind 'reward' / 'mission'). */
  deleteEvent(id: ID): Promise<void>;

  upsertReward(reward: Draft<Reward>): Promise<void>;
  deleteReward(id: ID): Promise<void>;
  /**
   * Offre la récompense à l'enfant. Vérifie l'éligibilité (voir domain/logic.ts : rewardStatus).
   * mode 'spend'  : crée Redemption + PointEvent négatif (kind 'reward').
   * mode 'weekly' : crée Redemption avec weekKey, sans déduction.
   */
  redeemReward(rewardId: ID, childId: ID): Promise<void>;
  /** Stocke l'image (redimensionnée côté appelant, ≤ 800 px) et renvoie son URL. */
  uploadRewardImage(file: Blob): Promise<string>;

  upsertMission(mission: Draft<Mission>): Promise<void>;
  deleteMission(id: ID): Promise<void>;
  /** Valide la mission pour la période en cours : crée MissionCompletion + PointEvent (kind 'mission'). */
  completeMission(missionId: ID, childId: ID): Promise<void>;
  /** Annule une validation et supprime le PointEvent associé. */
  uncompleteMission(completionId: ID): Promise<void>;
}
