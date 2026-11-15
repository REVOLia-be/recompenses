// État global de l'application : session, données de la famille, mutations, enfant(s) sélectionné(s),
// mode enfant (lecture seule protégée par un code parent), toasts et célébrations.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Child, FamilyData, ID, Session } from '../types';
import type { DataStore } from '../data/store';
import { store as defaultStore } from '../data';
import { StarBurst, ToastProvider, useToast, type ToastOptions } from '../ui';

export type AppStatus = 'loading' | 'signedOut' | 'noFamily' | 'ready';

export interface CelebrateOptions {
  /** Texte affiché et annoncé (défaut « Bravo ! »). */
  message?: string;
  /** Emoji central à la place de l'étoile. */
  emoji?: string;
}

export interface RunOptions {
  /** Toast de succès après la mutation. */
  success?: string;
  /** Lance l'animation StarBurst après succès. */
  celebrate?: string | CelebrateOptions;
  /** Autorise la mutation en mode enfant (refusée par défaut). */
  allowInChildMode?: boolean;
}

export interface AppContextValue {
  status: AppStatus;
  session: Session | null;
  /** Non null quand status === 'ready'. */
  data: FamilyData | null;
  store: DataStore;
  /** Dernière erreur de chargement (affichée par le shell si aucune donnée). */
  error: string | null;
  /** true pendant qu'une mutation `run` est en cours. */
  busy: boolean;
  /** Recharge session + données. */
  refresh: () => Promise<void>;
  /**
   * Exécute une mutation, recharge les données, affiche un toast d'erreur en cas d'échec.
   * Renvoie le résultat, ou undefined si la mutation a échoué / été refusée.
   */
  run: <T>(fn: (store: DataStore) => Promise<T>, opts?: RunOptions) => Promise<T | undefined>;
  toast: (message: string, opts?: ToastOptions) => void;
  celebrate: (opts?: string | CelebrateOptions) => void;

  // --- Sélection d'enfants (persistée localement) ---
  /** Toujours au moins un enfant s'il en existe ; en mode enfant = [l'enfant]. */
  selectedChildIds: ID[];
  selectedChildren: Child[];
  setSelectedChildIds: (ids: ID[]) => void;
  /** Ajoute / retire un enfant de la sélection (ne vide jamais complètement la sélection). */
  toggleChild: (id: ID) => void;

  // --- Mode enfant ---
  /** Id de l'enfant en mode enfant, null sinon. L'app est alors en lecture seule. */
  childMode: ID | null;
  /** Un code parent est-il défini sur cet appareil ? (requis pour entrer en mode enfant) */
  hasPin: boolean;
  /** Renvoie false (et ne fait rien) si aucun code parent n'est défini. */
  enterChildMode: (childId: ID) => boolean;
  /** Renvoie true si le code est bon (sortie du mode enfant). */
  exitChildMode: (pin: string) => boolean;
  /** Définit le code parent (exactement 4 chiffres, sinon lève une Error). */
  setPin: (pin: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const LS = {
  pin: 'pepites:pin',
  childMode: 'pepites:childMode',
  selected: 'pepites:selected',
};

function lsGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* stockage indisponible (navigation privée) : on ignore */
  }
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === 'object' && e && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return 'Oups, quelque chose s’est mal passé. Réessayez.';
}

/** Fournit useApp() (et useToast()). À placer à la racine, dans le Router. */
export function AppProvider({ children, store = defaultStore }: { children: ReactNode; store?: DataStore }) {
  return (
    <ToastProvider>
      <AppStateProvider store={store}>{children}</AppStateProvider>
    </ToastProvider>
  );
}

function AppStateProvider({ children, store }: { children: ReactNode; store: DataStore }) {
  const toastApi = useToast();
  const [status, setStatus] = useState<AppStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<FamilyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyCount, setBusyCount] = useState(0);
  const [burst, setBurst] = useState<(CelebrateOptions & { id: number }) | null>(null);
  const [pin, setPinState] = useState<string | null>(() => lsGet(LS.pin));
  const [childMode, setChildMode] = useState<ID | null>(() => lsGet(LS.childMode));
  const [selected, setSelected] = useState<ID[]>(() => {
    try {
      const raw = lsGet(LS.selected);
      const v: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });
  const loadSeq = useRef(0);
  const burstSeq = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++loadSeq.current;
    try {
      const s = await store.getSession();
      if (seq !== loadSeq.current) return;
      setSession(s);
      if (!s) {
        setData(null);
        setStatus('signedOut');
        setError(null);
        return;
      }
      const d = await store.load();
      if (seq !== loadSeq.current) return;
      setData(d);
      setStatus(d ? 'ready' : 'noFamily');
      setError(null);
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setError(errorMessage(e));
    }
  }, [store]);

  // Chargement initial + rechargements (auth, autres appareils/onglets, retour sur l'onglet).
  useEffect(() => {
    void refresh();
    const offAuth = store.onAuthChange(() => void refresh());
    const offData = store.subscribe(() => void refresh());
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      offAuth();
      offData();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [store, refresh]);

  const toast = toastApi.show;

  const celebrate = useCallback((opts?: string | CelebrateOptions) => {
    const o = typeof opts === 'string' ? { message: opts } : (opts ?? {});
    setBurst({ ...o, id: ++burstSeq.current });
  }, []);

  const run = useCallback(
    async <T,>(fn: (s: DataStore) => Promise<T>, opts: RunOptions = {}): Promise<T | undefined> => {
      if (childMode && !opts.allowInChildMode) {
        toast('Mode enfant : demande à un parent 🙂', { kind: 'info' });
        return undefined;
      }
      setBusyCount((n) => n + 1);
      try {
        const result = await fn(store);
        await refresh();
        if (opts.success) toast(opts.success, { kind: 'success' });
        if (opts.celebrate) celebrate(opts.celebrate);
        return result;
      } catch (e) {
        toast(errorMessage(e), { kind: 'error' });
        void refresh();
        return undefined;
      } finally {
        setBusyCount((n) => n - 1);
      }
    },
    [store, refresh, toast, celebrate, childMode],
  );

  // --- Sélection d'enfants ---
  const children_ = data?.children;
  const selectedChildIds = useMemo<ID[]>(() => {
    const kids = children_ ?? [];
    if (childMode && kids.some((c) => c.id === childMode)) return [childMode];
    const valid = selected.filter((id) => kids.some((c) => c.id === id));
    if (valid.length === 0 && kids.length > 0) return [kids[0].id];
    return valid;
  }, [children_, selected, childMode]);

  const selectedChildren = useMemo(
    () => (children_ ?? []).filter((c) => selectedChildIds.includes(c.id)),
    [children_, selectedChildIds],
  );

  const setSelectedChildIds = useCallback((ids: ID[]) => {
    setSelected(ids);
    lsSet(LS.selected, JSON.stringify(ids));
  }, []);

  const toggleChild = useCallback(
    (id: ID) => {
      const next = selectedChildIds.includes(id) ? selectedChildIds.filter((x) => x !== id) : [...selectedChildIds, id];
      if (next.length === 0) return;
      setSelectedChildIds(next);
    },
    [selectedChildIds, setSelectedChildIds],
  );

  // Sortie automatique du mode enfant si l'enfant n'existe plus.
  useEffect(() => {
    if (childMode && data && !data.children.some((c) => c.id === childMode)) {
      setChildMode(null);
      lsSet(LS.childMode, null);
    }
  }, [childMode, data]);

  // --- Mode enfant ---
  const setPin = useCallback((p: string) => {
    if (!/^\d{4}$/.test(p)) throw new Error('Le code parent doit comporter 4 chiffres.');
    setPinState(p);
    lsSet(LS.pin, p);
  }, []);

  const enterChildMode = useCallback(
    (childId: ID) => {
      if (!pin) return false;
      setChildMode(childId);
      lsSet(LS.childMode, childId);
      return true;
    },
    [pin],
  );

  const exitChildMode = useCallback(
    (p: string) => {
      if (!pin || p !== pin) return false;
      setChildMode(null);
      lsSet(LS.childMode, null);
      return true;
    },
    [pin],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      status,
      session,
      data,
      store,
      error,
      busy: busyCount > 0,
      refresh,
      run,
      toast,
      celebrate,
      selectedChildIds,
      selectedChildren,
      setSelectedChildIds,
      toggleChild,
      childMode,
      hasPin: !!pin,
      enterChildMode,
      exitChildMode,
      setPin,
    }),
    [
      status,
      session,
      data,
      store,
      error,
      busyCount,
      refresh,
      run,
      toast,
      celebrate,
      selectedChildIds,
      selectedChildren,
      setSelectedChildIds,
      toggleChild,
      childMode,
      pin,
      enterChildMode,
      exitChildMode,
      setPin,
    ],
  );

  const endBurst = useCallback(() => setBurst(null), []);

  return (
    <AppContext.Provider value={value}>
      {children}
      {burst && <StarBurst key={burst.id} message={burst.message} emoji={burst.emoji} onDone={endBurst} />}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé dans <AppProvider>.');
  return ctx;
}

/** Raccourci pour les écrans qui ne s'affichent qu'en status 'ready' (garanti par le shell). */
export function useFamilyData(): FamilyData {
  const { data } = useApp();
  if (!data) throw new Error('useFamilyData : données non chargées (status ≠ ready).');
  return data;
}
