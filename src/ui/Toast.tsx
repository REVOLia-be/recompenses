import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from './icons';
import { cx } from './cx';

export type ToastKind = 'info' | 'success' | 'error';

export interface ToastOptions {
  kind?: ToastKind;
  /** ms, défaut 3500 (5000 pour les erreurs). */
  duration?: number;
}

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

export interface ToastApi {
  show: (message: string, opts?: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Fournit useToast() et affiche la pile de toasts en haut de l'écran (aria-live). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((t) => t.id !== id)), []);
  const show = useCallback(
    (message: string, opts: ToastOptions = {}) => {
      const kind = opts.kind ?? 'info';
      const id = ++seq.current;
      setItems((xs) => [...xs.slice(-2), { id, message, kind }]);
      window.setTimeout(() => dismiss(id), opts.duration ?? (kind === 'error' ? 5000 : 3500));
    },
    [dismiss],
  );
  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="ui-toasts" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className={cx('ui-toast', `ui-toast--${t.kind}`)} role={t.kind === 'error' ? 'alert' : 'status'}>
            <Icon name={t.kind === 'error' ? 'info' : t.kind === 'success' ? 'check' : 'sparkle'} size={20} />
            <span className="grow">{t.message}</span>
            <button type="button" className="ui-toast__close" aria-label="Fermer le message" onClick={() => dismiss(t.id)}>
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans <ToastProvider>.');
  return ctx;
}
