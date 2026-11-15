import { useRef, useState } from 'react';
import { useApp } from '../../state/AppState';
import type { Child } from '../../types';
import { ConfirmDialog, TextField } from '../../ui';
import { sameName } from './validation';

/** Suppression irréversible : demande de retaper le prénom. À monter quand il doit être ouvert. */
export function DeleteChildDialog({ child, onClose, onDeleted }: { child: Child; onClose: () => void; onDeleted?: () => void }) {
  const { run } = useApp();
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const confirm = async () => {
    if (!sameName(typed, child.name)) {
      setError(`Retape « ${child.name} » pour confirmer.`);
      ref.current?.focus();
      return;
    }
    setBusy(true);
    const ok = await run(
      async (s) => {
        await s.deleteChild(child.id);
        return true;
      },
      { success: `${child.name} a été supprimé(e).` },
    );
    setBusy(false);
    if (ok) {
      onClose();
      onDeleted?.();
    }
  };

  return (
    <ConfirmDialog
      open
      danger
      busy={busy}
      title={`Supprimer ${child.name} ?`}
      confirmLabel="Oui, supprimer"
      onCancel={onClose}
      onConfirm={confirm}
      message={
        <div className="stack" style={{ ['--gap' as string]: '12px' }}>
          <p>
            Tous ses points, son historique, ses missions validées et ses cadeaux offerts seront effacés. Cette action
            est <strong>irréversible</strong>.
          </p>
          <TextField
            ref={ref}
            label={`Pour confirmer, retape « ${child.name} »`}
            autoComplete="off"
            autoCapitalize="none"
            value={typed}
            error={error}
            onChange={(e) => {
              setTyped(e.target.value);
              setError(null);
            }}
          />
        </div>
      }
    />
  );
}
