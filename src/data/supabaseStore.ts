import { createClient } from '@supabase/supabase-js';
import type { AwardInput, DataStore, Draft, ProfileInput } from './store';
import { missionAppliesTo, missionPeriodKey, rewardStatus, weekKey } from '../domain/logic';
import type {
  Child,
  Family,
  FamilyData,
  GoodAction,
  ID,
  Mission,
  MissionCompletion,
  MissionRecurrence,
  Parent,
  PointEvent,
  PointEventKind,
  Redemption,
  Reward,
  RewardMode,
  Session,
} from '../types';

// =============================================================================
// Constantes
// =============================================================================

const SCHEMA = 'pepites';
const BUCKET = 'pepites-rewards';
/** Marge de sécurité : PostgREST plafonne à 1000 lignes par requête par défaut. */
const PAGE_SIZE = 1000;
/** Plafond de pages pour le journal (50 000 lignes) : évite une boucle sans fin. */
const MAX_PAGES = 50;
/** Durée de validité des URLs signées d'images (7 jours). */
const SIGNED_URL_TTL_S = 7 * 24 * 3600;
/** On re-signe une image quand il lui reste moins d'1 jour de validité. */
const SIGNED_URL_REFRESH_MS = 24 * 3600 * 1000;
const REALTIME_DEBOUNCE_MS = 300;

// =============================================================================
// Lignes SQL (snake_case)
// =============================================================================

interface FamilyRow {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}
interface ParentRow {
  id: string;
  family_id: string;
  user_id: string;
  name: string;
  role_label: string;
  emoji: string;
  birthdate: string | null;
  email: string | null;
}
interface ChildRow {
  id: string;
  family_id: string;
  name: string;
  emoji: string;
  color: string;
  birthdate: string | null;
  companion_name: string;
  created_at: string;
}
interface ActionRow {
  id: string;
  family_id: string;
  label: string;
  emoji: string;
  points: number;
  sort_order: number;
}
interface EventRow {
  id: string;
  family_id: string;
  child_id: string;
  points: number;
  label: string;
  emoji: string;
  kind: PointEventKind;
  ref_id: string | null;
  created_by: string | null;
  created_at: string;
}
interface RewardRow {
  id: string;
  family_id: string;
  title: string;
  emoji: string;
  image_url: string | null;
  cost: number;
  category: string;
  mode: RewardMode;
  favorite: boolean;
  created_at: string;
}
interface RedemptionRow {
  id: string;
  family_id: string;
  reward_id: string;
  child_id: string;
  cost: number;
  week_key: string | null;
  created_by: string | null;
  created_at: string;
}
interface MissionRow {
  id: string;
  family_id: string;
  title: string;
  emoji: string;
  points: number;
  recurrence: MissionRecurrence;
  child_ids: string[] | null;
  active: boolean;
  created_at: string;
}
interface CompletionRow {
  id: string;
  family_id: string;
  mission_id: string;
  child_id: string;
  period_key: string;
  event_id: string | null;
  created_at: string;
}

// =============================================================================
// Mappers snake_case -> types TS
// =============================================================================

const mapFamily = (r: FamilyRow): Family => ({
  id: r.id,
  name: r.name,
  inviteCode: r.invite_code,
  createdAt: r.created_at,
});

const mapParent = (r: ParentRow): Parent => ({
  id: r.id,
  familyId: r.family_id,
  userId: r.user_id,
  name: r.name,
  roleLabel: r.role_label,
  emoji: r.emoji,
  birthdate: r.birthdate,
  email: r.email,
});

const mapChild = (r: ChildRow): Child => ({
  id: r.id,
  familyId: r.family_id,
  name: r.name,
  emoji: r.emoji,
  color: r.color,
  birthdate: r.birthdate,
  companionName: r.companion_name,
  createdAt: r.created_at,
});

const mapAction = (r: ActionRow): GoodAction => ({
  id: r.id,
  familyId: r.family_id,
  label: r.label,
  emoji: r.emoji,
  points: r.points,
  sortOrder: r.sort_order,
});

const mapEvent = (r: EventRow): PointEvent => ({
  id: r.id,
  familyId: r.family_id,
  childId: r.child_id,
  points: r.points,
  label: r.label,
  emoji: r.emoji,
  kind: r.kind,
  refId: r.ref_id,
  createdBy: r.created_by,
  createdAt: r.created_at,
});

/** `imageUrl` est la valeur déjà résolue (URL affichable). */
const mapReward = (r: RewardRow, imageUrl: string | null): Reward => ({
  id: r.id,
  familyId: r.family_id,
  title: r.title,
  emoji: r.emoji,
  imageUrl,
  cost: r.cost,
  category: r.category,
  mode: r.mode,
  favorite: r.favorite,
  createdAt: r.created_at,
});

const mapRedemption = (r: RedemptionRow): Redemption => ({
  id: r.id,
  familyId: r.family_id,
  rewardId: r.reward_id,
  childId: r.child_id,
  cost: r.cost,
  weekKey: r.week_key,
  createdBy: r.created_by,
  createdAt: r.created_at,
});

const mapMission = (r: MissionRow): Mission => ({
  id: r.id,
  familyId: r.family_id,
  title: r.title,
  emoji: r.emoji,
  points: r.points,
  recurrence: r.recurrence,
  childIds: r.child_ids ?? [],
  active: r.active,
  createdAt: r.created_at,
});

const mapCompletion = (r: CompletionRow): MissionCompletion => ({
  id: r.id,
  familyId: r.family_id,
  missionId: r.mission_id,
  childId: r.child_id,
  periodKey: r.period_key,
  eventId: r.event_id,
  createdAt: r.created_at,
});

// =============================================================================
// Erreurs : tout est converti en Error avec un message français affichable
// =============================================================================

class StoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoreError';
  }
}

interface ErrorLike {
  message?: unknown;
  code?: unknown;
  status?: unknown;
  name?: unknown;
  details?: unknown;
}

const isObject = (e: unknown): e is ErrorLike => typeof e === 'object' && e !== null;

const GENERIC_ERROR = 'Une erreur est survenue. Réessaie dans un instant.';

function toError(e: unknown, fallback: string = GENERIC_ERROR): StoreError {
  if (e instanceof StoreError) return e;
  const o: ErrorLike = isObject(e) ? e : {};
  const msg = typeof o.message === 'string' ? o.message : typeof e === 'string' ? e : '';
  const low = msg.toLowerCase();
  const code = typeof o.code === 'string' ? o.code : '';
  const name = typeof o.name === 'string' ? o.name : '';

  // Réseau
  if (
    name === 'AuthRetryableFetchError' ||
    low.includes('failed to fetch') ||
    low.includes('networkerror') ||
    low.includes('network request failed') ||
    low.includes('load failed') ||
    low.includes('fetch failed')
  ) {
    return new StoreError('Connexion impossible. Vérifie ta connexion internet et réessaie.');
  }

  // Authentification
  if (code === 'invalid_credentials' || low.includes('invalid login credentials')) {
    return new StoreError('E-mail ou mot de passe incorrect.');
  }
  if (code === 'email_not_confirmed' || low.includes('email not confirmed')) {
    return new StoreError(
      'Adresse e-mail non confirmée. Clique sur le lien reçu par e-mail, puis reconnecte-toi.',
    );
  }
  if (code === 'user_already_exists' || low.includes('user already registered')) {
    return new StoreError('Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.');
  }
  if (code === 'weak_password' || low.includes('password should be at least')) {
    return new StoreError('Mot de passe trop faible (6 caractères minimum).');
  }
  if (code === 'signup_disabled' || low.includes('signups not allowed')) {
    return new StoreError('Les inscriptions sont désactivées pour ce projet.');
  }
  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    low.includes('rate limit') ||
    low.includes('too many requests')
  ) {
    return new StoreError('Trop de tentatives. Patiente quelques minutes avant de réessayer.');
  }
  if (code === 'email_address_invalid' || low.includes('unable to validate email') || low.includes('invalid email')) {
    return new StoreError('Adresse e-mail invalide.');
  }
  if (name === 'AuthSessionMissingError' || low.includes('auth session missing')) {
    return new StoreError('Tu n\'es pas connecté. Connecte-toi pour continuer.');
  }
  if (code === 'PGRST301' || code === 'PGRST303' || low.includes('jwt expired') || low.includes('invalid jwt')) {
    return new StoreError('Ta session a expiré. Reconnecte-toi.');
  }

  // Base / API
  if (code === 'PGRST106' || low.includes('invalid schema')) {
    return new StoreError(
      `Le schéma « ${SCHEMA} » n'est pas exposé : ajoute-le dans Supabase → Settings → API → Exposed schemas.`,
    );
  }
  if (code === 'PGRST202' || code === 'PGRST205' || code === '42P01' || code === '42883') {
    return new StoreError('La base de données n\'est pas à jour : la migration 0001_init.sql n\'a pas été appliquée.');
  }
  if (code === '42501' || low.includes('row-level security') || low.includes('permission denied')) {
    return new StoreError('Action non autorisée.');
  }
  if (code === '23505') return new StoreError('Cet élément existe déjà.');
  if (code === '23503') return new StoreError('Un élément lié est introuvable (il a peut-être été supprimé).');
  if (code === '23514' || code === '22P02' || code === '22007' || code === '22008') {
    return new StoreError('Valeur invalide.');
  }
  // Erreurs levées par nos fonctions SQL (`raise exception`) : messages déjà en français.
  if (code === 'P0001' && msg) return new StoreError(msg);

  // Storage
  if (low.includes('mime type') || low.includes('not supported')) {
    return new StoreError('Format d\'image non accepté (JPEG, PNG ou WebP).');
  }
  if (low.includes('maximum allowed size') || low.includes('payload too large') || code === '413') {
    return new StoreError('Image trop lourde (2 Mo maximum).');
  }
  if (low.includes('bucket not found')) {
    return new StoreError('Espace de stockage introuvable : la migration n\'a pas été appliquée.');
  }

  return new StoreError(fallback);
}

/** Exécute `fn` et convertit toute erreur en Error française. */
async function guard<T>(fn: () => Promise<T>, fallback?: string): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw toError(e, fallback);
  }
}

/** Renvoie `data` d'une réponse Supabase, ou lève l'erreur. */
function unwrap<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

function unwrapVoid(res: { error: unknown }): void {
  if (res.error) throw res.error;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// =============================================================================
// Images de récompenses
// -----------------------------------------------------------------------------
// Choix : on STOCKE LE CHEMIN de l'objet (« <family_id>/<uuid>.jpg ») dans
// rewards.image_url et on RE-SIGNE à chaque load() (URLs valables 7 jours, mises en
// cache mémoire et renouvelées quand il reste < 1 jour). Une URL signée stockée en base
// expirerait un jour et casserait toutes les images ; le chemin, lui, est permanent.
// Le client manipule des URLs signées (Reward.imageUrl) : à l'écriture on retrouve le
// chemin à partir de l'URL (`/object/sign/pepites-rewards/<chemin>?token=…`).
// Les URLs externes (http…) qui ne pointent pas vers notre bucket sont conservées telles quelles.
// =============================================================================

const SIGN_PATH_RE = new RegExp(`/object/(?:sign|authenticated|public)/${BUCKET}/([^?#]+)`);

/** URL signée (ou chemin brut) -> chemin de stockage ; null si ce n'est pas une image du bucket. */
function storagePathFromImageUrl(url: string | null): string | null {
  if (!url) return null;
  const m = SIGN_PATH_RE.exec(url);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }
  // chemin brut « <uuid>/<uuid>.ext »
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith('/')) return url;
  return null;
}

// =============================================================================
// Fabrique
// =============================================================================

interface Ctx {
  userId: string;
  familyId: string;
  parentId: string;
}

export function createSupabaseStore(url: string, key: string): DataStore {
  const supabase = createClient(url, key, {
    db: { schema: SCHEMA },
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  // --- Cache de contexte (famille / parent connecté) --------------------------
  let ctx: Ctx | null = null;
  const signedCache = new Map<string, { url: string; expiresAt: number }>();

  async function currentUser(): Promise<{ id: string; email: string | null }> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const user = data.session?.user;
    if (!user) throw new StoreError('Tu n\'es pas connecté. Connecte-toi pour continuer.');
    return { id: user.id, email: user.email ?? null };
  }

  async function getCtx(): Promise<Ctx> {
    const user = await currentUser();
    if (ctx && ctx.userId === user.id) return ctx;
    const res = await supabase
      .from('parents')
      .select('id, family_id')
      .eq('user_id', user.id)
      .maybeSingle<{ id: string; family_id: string }>();
    const row = unwrap(res);
    if (!row) throw new StoreError('Crée ou rejoins d\'abord une famille.');
    ctx = { userId: user.id, familyId: row.family_id, parentId: row.id };
    return ctx;
  }

  // --- Pagination : récupère TOUTES les lignes (PostgREST limite à 1000/requête) --
  async function fetchAll<T>(
    table: string,
    opts: {
      order: Array<{ column: string; ascending: boolean }>;
      filter?: { column: string; value: string };
      maxPages?: number;
    },
  ): Promise<T[]> {
    const out: T[] = [];
    const maxPages = opts.maxPages ?? MAX_PAGES;
    for (let page = 0; page < maxPages; page++) {
      let q = supabase.from(table).select('*');
      if (opts.filter) q = q.eq(opts.filter.column, opts.filter.value);
      for (const o of opts.order) q = q.order(o.column, { ascending: o.ascending });
      const from = page * PAGE_SIZE;
      const res = await q.range(from, from + PAGE_SIZE - 1);
      const rows = unwrap<T[]>(res as { data: T[] | null; error: unknown });
      out.push(...rows);
      if (rows.length < PAGE_SIZE) break;
    }
    return out;
  }

  const eventOrder = [
    { column: 'created_at', ascending: false },
    { column: 'id', ascending: false },
  ];

  // --- Signature des images ----------------------------------------------------
  async function signPaths(paths: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const now = Date.now();
    const toSign: string[] = [];
    for (const p of new Set(paths)) {
      const cached = signedCache.get(p);
      if (cached && cached.expiresAt - now > SIGNED_URL_REFRESH_MS) result.set(p, cached.url);
      else toSign.push(p);
    }
    if (toSign.length > 0) {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(toSign, SIGNED_URL_TTL_S);
      if (error) {
        // Non bloquant : les récompenses s'affichent sans image plutôt que de casser le chargement.
        console.warn('Signature des images impossible :', error.message);
      } else {
        for (const item of data) {
          if (item.path && item.signedUrl) {
            signedCache.set(item.path, { url: item.signedUrl, expiresAt: now + SIGNED_URL_TTL_S * 1000 });
            result.set(item.path, item.signedUrl);
          }
        }
      }
    }
    return result;
  }

  /** image_url en base -> valeur affichable. */
  function resolveImage(raw: string | null, signed: Map<string, string>): string | null {
    if (!raw) return null;
    const path = storagePathFromImageUrl(raw);
    if (path === null) return raw; // URL externe
    return signed.get(path) ?? null;
  }

  const imageColumnValue = (imageUrl: string | null): string | null => {
    if (!imageUrl) return null;
    return storagePathFromImageUrl(imageUrl) ?? imageUrl;
  };

  // --- Écriture générique ---------------------------------------------------------
  /** UPDATE ciblé qui échoue si aucune ligne n'a été touchée (RLS ou id inconnu). */
  async function updateOne(
    table: string,
    id: ID,
    patch: Record<string, unknown>,
    notFound = 'Élément introuvable ou modification non autorisée.',
  ): Promise<void> {
    const res = await supabase.from(table).update(patch).eq('id', id).select('id');
    const rows = unwrap<Array<{ id: string }>>(res);
    if (rows.length === 0) throw new StoreError(notFound);
  }

  async function deleteById(table: string, id: ID): Promise<void> {
    unwrapVoid(await supabase.from(table).delete().eq('id', id));
  }

  const store: DataStore = {
    mode: 'supabase',

    // ------------------------------------------------------------------ Session
    async getSession(): Promise<Session | null> {
      return guard(async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = data.session?.user;
        return user ? { userId: user.id, email: user.email ?? null } : null;
      });
    },

    async signIn(email, password) {
      return guard(async () => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }, 'Connexion impossible. Vérifie tes identifiants.');
    },

    async signUp(email, password) {
      return guard(async () => {
        const redirect =
          typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined;
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: redirect ? { emailRedirectTo: redirect } : undefined,
        });
        if (error) throw error;
        // Avec la confirmation d'e-mail active, un e-mail déjà inscrit renvoie un faux
        // utilisateur sans identité (anti-énumération) : on le signale clairement.
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          throw new StoreError('Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.');
        }
        return { needsEmailConfirmation: data.session === null };
      }, 'Inscription impossible. Réessaie dans un instant.');
    },

    async signOut() {
      return guard(async () => {
        const { error } = await supabase.auth.signOut();
        ctx = null;
        // Une session déjà absente côté serveur ne doit pas bloquer la déconnexion locale.
        if (error && !/session/i.test(error.message)) throw error;
      });
    },

    onAuthChange(cb) {
      let last: string | null | undefined;
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const userId = session?.user?.id ?? null;
        if (userId === last) return; // ignore TOKEN_REFRESHED, SIGNED_IN répétés, etc.
        last = userId;
        ctx = null;
        cb(session?.user ? { userId: session.user.id, email: session.user.email ?? null } : null);
      });
      return () => data.subscription.unsubscribe();
    },

    // ------------------------------------------------------------------- Famille
    async load(): Promise<FamilyData | null> {
      return guard(async () => {
        const user = await currentUser();
        const meRes = await supabase
          .from('parents')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle<ParentRow>();
        const meRow = unwrap(meRes);
        if (!meRow) {
          ctx = null;
          return null;
        }
        ctx = { userId: user.id, familyId: meRow.family_id, parentId: meRow.id };

        const [familyRes, parents, children, actions, rewards, redemptions, missions, completions, events] =
          await Promise.all([
            supabase.from('families').select('*').eq('id', meRow.family_id).maybeSingle<FamilyRow>(),
            fetchAll<ParentRow>('parents', { order: [{ column: 'created_at', ascending: true }, { column: 'id', ascending: true }] }),
            fetchAll<ChildRow>('children', { order: [{ column: 'created_at', ascending: true }, { column: 'id', ascending: true }] }),
            fetchAll<ActionRow>('actions', { order: [{ column: 'sort_order', ascending: true }, { column: 'created_at', ascending: true }, { column: 'id', ascending: true }] }),
            fetchAll<RewardRow>('rewards', { order: [{ column: 'created_at', ascending: true }, { column: 'id', ascending: true }] }),
            fetchAll<RedemptionRow>('redemptions', { order: [{ column: 'created_at', ascending: false }, { column: 'id', ascending: false }] }),
            fetchAll<MissionRow>('missions', { order: [{ column: 'created_at', ascending: true }, { column: 'id', ascending: true }] }),
            fetchAll<CompletionRow>('mission_completions', { order: [{ column: 'created_at', ascending: false }, { column: 'id', ascending: false }] }),
            // Toutes les lignes du journal : les soldes sont calculés côté client, ils doivent être exacts.
            fetchAll<EventRow>('point_events', { order: eventOrder }),
          ]);

        const familyRow = unwrap(familyRes);
        if (!familyRow) return null;

        const paths: string[] = [];
        for (const r of rewards) {
          const p = storagePathFromImageUrl(r.image_url);
          if (p !== null) paths.push(p);
        }
        const signed = paths.length > 0 ? await signPaths(paths) : new Map<string, string>();

        return {
          family: mapFamily(familyRow),
          me: mapParent(meRow),
          parents: parents.map(mapParent),
          children: children.map(mapChild),
          actions: actions.map(mapAction),
          events: events.map(mapEvent),
          rewards: rewards.map((r) => mapReward(r, resolveImage(r.image_url, signed))),
          redemptions: redemptions.map(mapRedemption),
          missions: missions.map(mapMission),
          completions: completions.map(mapCompletion),
        };
      }, 'Chargement impossible. Réessaie dans un instant.');
    },

    async createFamily(input: ProfileInput & { familyName: string }) {
      return guard(async () => {
        await currentUser();
        unwrapVoid(
          await supabase.rpc('create_family', {
            p_family_name: input.familyName,
            p_parent_name: input.parentName,
            p_role_label: input.roleLabel,
            p_emoji: input.emoji,
          }),
        );
        ctx = null;
      }, 'Création de la famille impossible.');
    },

    async joinFamily(input: ProfileInput & { inviteCode: string }) {
      return guard(async () => {
        await currentUser();
        unwrapVoid(
          await supabase.rpc('join_family', {
            p_invite_code: input.inviteCode,
            p_parent_name: input.parentName,
            p_role_label: input.roleLabel,
            p_emoji: input.emoji,
          }),
        );
        ctx = null;
      }, 'Impossible de rejoindre la famille.');
    },

    subscribe(cb) {
      let closed = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const fire = () => {
        if (closed) return;
        if (timer !== undefined) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = undefined;
          if (!closed) cb();
        }, REALTIME_DEBOUNCE_MS);
      };
      // Un seul canal pour tout le schéma ; la RLS filtre les évènements par famille.
      const channel = supabase
        .channel(`pepites-${uuid()}`)
        .on('postgres_changes', { event: '*', schema: SCHEMA }, fire)
        .subscribe();
      return () => {
        closed = true;
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
        void supabase.removeChannel(channel);
      };
    },

    // ----------------------------------------------------------------- Mutations
    async upsertChild(child: Draft<Child>) {
      return guard(async () => {
        const payload = {
          name: child.name,
          emoji: child.emoji,
          color: child.color,
          birthdate: child.birthdate,
          companion_name: child.companionName,
        };
        if (child.id) {
          await updateOne('children', child.id, payload);
        } else {
          const c = await getCtx();
          unwrapVoid(await supabase.from('children').insert({ ...payload, family_id: c.familyId }));
        }
      }, 'Enregistrement de l\'enfant impossible.');
    },

    async deleteChild(id) {
      return guard(() => deleteById('children', id), 'Suppression de l\'enfant impossible.');
    },

    async updateParent(id, patch) {
      return guard(async () => {
        const payload: Record<string, unknown> = {};
        if (patch.name !== undefined) payload.name = patch.name;
        if (patch.roleLabel !== undefined) payload.role_label = patch.roleLabel;
        if (patch.emoji !== undefined) payload.emoji = patch.emoji;
        if (patch.birthdate !== undefined) payload.birthdate = patch.birthdate;
        if (Object.keys(payload).length === 0) return;
        await updateOne('parents', id, payload, 'Tu ne peux modifier que ton propre profil.');
      }, 'Mise à jour du profil impossible.');
    },

    async renameFamily(name) {
      return guard(async () => {
        const c = await getCtx();
        await updateOne('families', c.familyId, { name }, 'Renommage non autorisé.');
      }, 'Renommage de la famille impossible.');
    },

    async upsertAction(action: Draft<GoodAction>) {
      return guard(async () => {
        const payload = {
          label: action.label,
          emoji: action.emoji,
          points: action.points,
          sort_order: action.sortOrder,
        };
        if (action.id) {
          await updateOne('actions', action.id, payload);
        } else {
          const c = await getCtx();
          unwrapVoid(await supabase.from('actions').insert({ ...payload, family_id: c.familyId }));
        }
      }, 'Enregistrement de l\'action impossible.');
    },

    async deleteAction(id) {
      return guard(() => deleteById('actions', id), 'Suppression de l\'action impossible.');
    },

    async awardPoints(input: AwardInput) {
      return guard(async () => {
        if (input.kind === 'reward' || input.kind === 'mission') {
          throw new StoreError('Ce type de ligne ne peut pas être créé directement.');
        }
        const childIds = Array.from(new Set(input.childIds));
        if (childIds.length === 0) return;
        const c = await getCtx();
        const rows = childIds.map((childId) => ({
          family_id: c.familyId,
          child_id: childId,
          points: input.points,
          label: input.label,
          emoji: input.emoji,
          kind: input.kind,
          ref_id: input.refId ?? null,
          created_by: c.parentId,
        }));
        // Insert groupé : une seule requête = tout ou rien.
        unwrapVoid(await supabase.from('point_events').insert(rows));
      }, 'Attribution des points impossible.');
    },

    async deleteEvent(id) {
      return guard(async () => {
        const res = await supabase.from('point_events').select('kind').eq('id', id).maybeSingle<{ kind: PointEventKind }>();
        const row = unwrap(res);
        if (!row) throw new StoreError('Ligne introuvable (déjà supprimée ?).');
        if (row.kind === 'reward' || row.kind === 'mission') {
          throw new StoreError(
            row.kind === 'reward'
              ? 'Une récompense offerte ne peut pas être annulée ici.'
              : 'Annule plutôt la validation de la mission.',
          );
        }
        unwrapVoid(await supabase.from('point_events').delete().eq('id', id).in('kind', ['action', 'manual', 'adjustment']));
      }, 'Annulation impossible.');
    },

    async upsertReward(reward: Draft<Reward>) {
      return guard(async () => {
        const payload = {
          title: reward.title,
          emoji: reward.emoji,
          image_url: imageColumnValue(reward.imageUrl),
          cost: reward.cost,
          category: reward.category,
          mode: reward.mode,
          favorite: reward.favorite,
        };
        if (reward.id) {
          await updateOne('rewards', reward.id, payload);
        } else {
          const c = await getCtx();
          unwrapVoid(await supabase.from('rewards').insert({ ...payload, family_id: c.familyId }));
        }
      }, 'Enregistrement de la récompense impossible.');
    },

    async deleteReward(id) {
      return guard(() => deleteById('rewards', id), 'Suppression de la récompense impossible.');
    },

    async redeemReward(rewardId, childId) {
      return guard(async () => {
        await getCtx();
        const now = new Date();

        // Données fraîches pour vérifier l'éligibilité avant l'appel (le serveur revérifie).
        const [rewardRes, childRes, eventRows, redemptionRows] = await Promise.all([
          supabase.from('rewards').select('*').eq('id', rewardId).maybeSingle<RewardRow>(),
          supabase.from('children').select('*').eq('id', childId).maybeSingle<ChildRow>(),
          fetchAll<EventRow>('point_events', { order: eventOrder, filter: { column: 'child_id', value: childId } }),
          fetchAll<RedemptionRow>('redemptions', {
            order: [{ column: 'created_at', ascending: false }, { column: 'id', ascending: false }],
            filter: { column: 'child_id', value: childId },
          }),
        ]);
        const rewardRow = unwrap(rewardRes);
        const childRow = unwrap(childRes);
        if (!rewardRow) throw new StoreError('Récompense introuvable.');
        if (!childRow) throw new StoreError('Enfant introuvable.');

        const reward = mapReward(rewardRow, null);
        const status = rewardStatus(
          reward,
          mapChild(childRow),
          eventRows.map(mapEvent),
          redemptionRows.map(mapRedemption),
          now,
        );
        if (reward.mode === 'weekly' && status.alreadyClaimed) {
          throw new StoreError('Cette récompense a déjà été offerte cette semaine.');
        }
        if (!status.canRedeem) {
          throw new StoreError(
            reward.mode === 'weekly'
              ? `Objectif de la semaine pas encore atteint : il manque ${status.missing} point${status.missing > 1 ? 's' : ''}.`
              : `Pas assez de points : il en manque ${status.missing}.`,
          );
        }

        unwrapVoid(
          await supabase.rpc('redeem_reward', {
            p_reward_id: rewardId,
            p_child_id: childId,
            p_week_key: reward.mode === 'weekly' ? weekKey(now) : null,
            p_expected_have: status.have,
          }),
        );
      }, 'Impossible d\'offrir cette récompense.');
    },

    async uploadRewardImage(file: Blob) {
      return guard(async () => {
        const c = await getCtx();
        const contentType =
          file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/jpeg'
            ? file.type
            : 'image/jpeg';
        const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
        const path = `${c.familyId}/${uuid()}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType,
          cacheControl: '31536000',
          upsert: false,
        });
        if (error) throw error;
        const signed = await signPaths([path]);
        const signedUrl = signed.get(path);
        if (!signedUrl) throw new StoreError('Image envoyée mais lien d\'accès indisponible. Réessaie.');
        return signedUrl;
      }, 'Envoi de l\'image impossible.');
    },

    async upsertMission(mission: Draft<Mission>) {
      return guard(async () => {
        const payload = {
          title: mission.title,
          emoji: mission.emoji,
          points: mission.points,
          recurrence: mission.recurrence,
          child_ids: mission.childIds,
          active: mission.active,
        };
        if (mission.id) {
          await updateOne('missions', mission.id, payload);
        } else {
          const c = await getCtx();
          unwrapVoid(await supabase.from('missions').insert({ ...payload, family_id: c.familyId }));
        }
      }, 'Enregistrement de la mission impossible.');
    },

    async deleteMission(id) {
      return guard(() => deleteById('missions', id), 'Suppression de la mission impossible.');
    },

    async completeMission(missionId, childId) {
      return guard(async () => {
        await getCtx();
        const res = await supabase.from('missions').select('*').eq('id', missionId).maybeSingle<MissionRow>();
        const row = unwrap(res);
        if (!row) throw new StoreError('Mission introuvable.');
        const mission = mapMission(row);
        if (!mission.active) throw new StoreError('Cette mission est désactivée.');
        if (!missionAppliesTo(mission, childId)) throw new StoreError('Cette mission ne concerne pas cet enfant.');
        unwrapVoid(
          await supabase.rpc('complete_mission', {
            p_mission_id: missionId,
            p_child_id: childId,
            p_period_key: missionPeriodKey(mission, new Date()),
          }),
        );
      }, 'Validation de la mission impossible.');
    },

    async uncompleteMission(completionId) {
      return guard(async () => {
        await getCtx();
        unwrapVoid(await supabase.rpc('uncomplete_mission', { p_completion_id: completionId }));
      }, 'Annulation de la validation impossible.');
    },
  };

  return store;
}
