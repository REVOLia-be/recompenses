import { useEffect, useState, type ReactNode } from 'react';
import { useApp } from '../../state/AppState';
import type { ID } from '../../types';
import { Avatar, Button, PinPad, Sheet } from '../../ui';

export const CHILD_MODE_EXPLANATION =
  'L’enfant voit ses points, ses cadeaux, ses missions et son compagnon, sans rien pouvoir modifier. On en sort avec le cadenas en haut à droite et le code parent.';

/** Définir ou modifier le code parent (double saisie). À monter quand il doit être ouvert. */
export function PinSetupSheet({ onClose, onDone }: { onClose: () => void; onDone?: () => void }) {
  const { setPin, toast } = useApp();
  const [step, setStep] = useState<'first' | 'confirm'>('first');
  const [first, setFirst] = useState('');
  const [round, setRound] = useState(0);
  const [mismatch, setMismatch] = useState(false);

  return (
    <Sheet
      open
      onClose={onClose}
      title={step === 'first' ? 'Choisis un code parent' : 'Confirme ton code'}
      description={
        step === 'first'
          ? 'Quatre chiffres que seuls les parents connaissent. Il sert à quitter le mode enfant.'
          : 'Saisis le même code une seconde fois.'
      }
    >
      <div className="stack">
        {mismatch && (
          <p className="par-alert" role="alert">
            Les deux codes ne sont pas identiques. On recommence !
          </p>
        )}
        <PinPad
          key={`${step}-${round}`}
          label={step === 'first' ? 'Nouveau code' : 'Confirmation du code'}
          onComplete={(pin) => {
            if (step === 'first') {
              setFirst(pin);
              setMismatch(false);
              setStep('confirm');
              return;
            }
            if (pin !== first) {
              setMismatch(true);
              setFirst('');
              setStep('first');
              setRound((r) => r + 1);
              return;
            }
            setPin(pin);
            toast('Code parent enregistré 🔒', { kind: 'success' });
            onClose();
            onDone?.();
          }}
        />
      </div>
    </Sheet>
  );
}

/**
 * Orchestre « Passer en mode enfant » : code parent si absent, choix de l'enfant, activation.
 * `start(childId?)` ; `node` est à rendre dans l'écran.
 */
export function useChildModeLauncher(): { start: (childId?: ID) => void; openPinSetup: () => void; node: ReactNode } {
  const { data, hasPin, enterChildMode, toast } = useApp();
  const [pinOpen, setPinOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [afterPin, setAfterPin] = useState<ID | 'choose' | null>(null);
  const [pending, setPending] = useState<ID | null>(null);

  // Une fois le code connu (état mis à jour), on active le mode enfant.
  useEffect(() => {
    if (pending && hasPin) {
      const ok = enterChildMode(pending);
      setPending(null);
      if (ok) toast('Mode enfant activé 🌈', { kind: 'success' });
    }
  }, [pending, hasPin, enterChildMode, toast]);

  const start = (childId?: ID) => {
    if (!hasPin) {
      setAfterPin(childId ?? 'choose');
      setPinOpen(true);
    } else if (childId) setPending(childId);
    else setPickerOpen(true);
  };

  const children = data?.children ?? [];
  const node = (
    <>
      {pinOpen && (
        <PinSetupSheet
          onClose={() => setPinOpen(false)}
          onDone={() => {
            if (afterPin === 'choose') setPickerOpen(true);
            else if (afterPin) setPending(afterPin);
            setAfterPin(null);
          }}
        />
      )}
      <Sheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Qui va jouer ?"
        description={CHILD_MODE_EXPLANATION}
        footer={
          <Button variant="secondary" onClick={() => setPickerOpen(false)}>
            Annuler
          </Button>
        }
      >
        <div className="par-picker">
          {children.map((c) => (
            <Avatar
              key={c.id}
              emoji={c.emoji}
              color={c.color}
              name={c.name}
              showName
              size="lg"
              onClick={() => {
                setPickerOpen(false);
                setPending(c.id);
              }}
            />
          ))}
        </div>
      </Sheet>
    </>
  );
  return { start, openPinSetup: () => { setAfterPin(null); setPinOpen(true); }, node };
}
