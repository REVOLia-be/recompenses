import { useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useModal } from './useModal';
import { IconButton, Button } from './Button';
import { cx } from './cx';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Sous-titre / description sous le titre. */
  description?: ReactNode;
  children?: ReactNode;
  /** Zone collée en bas (boutons d'action). */
  footer?: ReactNode;
  /** Masque le bouton « Fermer » (ex. étape obligatoire). */
  hideClose?: boolean;
  className?: string;
}

/**
 * Bottom sheet modale accessible (role="dialog", aria-modal, piège à focus, Échap, clic sur le voile).
 * Mettre `data-autofocus` sur l'élément à focaliser à l'ouverture.
 */
export function Sheet({ open, onClose, title, description, children, footer, hideClose, className }: SheetProps) {
  const ref = useModal(open, onClose);
  const titleId = useId();
  const descId = useId();
  if (!open) return null;
  return createPortal(
    <div className="ui-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cx('ui-sheet', className)}
      >
        <div className="ui-sheet__grabber" aria-hidden="true" />
        <div className="ui-sheet__head">
          <div className="grow">
            <h2 id={titleId} className="ui-sheet__title">
              {title}
            </h2>
            {description && (
              <p id={descId} className="ui-sheet__desc">
                {description}
              </p>
            )}
          </div>
          {!hideClose && <IconButton label="Fermer" icon="close" size="sm" variant="plain" onClick={onClose} />}
        </div>
        <div className="ui-sheet__body">{children}</div>
        {footer && <div className="ui-sheet__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Bouton de confirmation rouge (suppression…). */
  danger?: boolean;
  /** Peut être async : le bouton affiche un indicateur pendant l'attente. */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  busy?: boolean;
}

/** Boîte de confirmation centrée (role="alertdialog"). Le focus initial va sur « Annuler ». */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger,
  onConfirm,
  onCancel,
  busy,
}: ConfirmDialogProps) {
  const ref = useModal(open, onCancel);
  const titleId = useId();
  const descId = useId();
  if (!open) return null;
  return createPortal(
    <div className="ui-overlay ui-overlay--center" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? descId : undefined}
        className="ui-dialog"
      >
        <h2 id={titleId} className="ui-dialog__title">
          {title}
        </h2>
        {message && (
          <div id={descId} className="ui-dialog__msg">
            {message}
          </div>
        )}
        <div className="ui-dialog__actions">
          <Button variant="secondary" onClick={onCancel} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => void onConfirm()} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
