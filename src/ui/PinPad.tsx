import { useEffect, useState } from 'react';
import { Icon } from './icons';
import { cx } from './cx';

export interface PinPadProps {
  /** Appelé quand 4 chiffres sont saisis. Renvoyer false pour signaler une erreur (secoue et efface). */
  onComplete: (pin: string) => boolean | void | Promise<boolean | void>;
  length?: number;
  label?: string;
}

/** Pavé numérique pour le code parent (4 chiffres). */
export function PinPad({ onComplete, length = 4, label = 'Code parent' }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length !== length) return;
    let alive = true;
    Promise.resolve(onComplete(pin)).then((ok) => {
      if (!alive) return;
      if (ok === false) {
        setError(true);
        window.setTimeout(() => {
          setPin('');
          setError(false);
        }, 450);
      }
    });
    return () => {
      alive = false;
    };
  }, [pin, length, onComplete]);

  const press = (d: string) => setPin((p) => (p.length < length ? p + d : p));
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="ui-pin">
      <div className={cx('ui-pin__dots', error && 'is-error')} role="status" aria-label={`${label} : ${pin.length} chiffre(s) sur ${length}`}>
        {Array.from({ length }, (_, i) => (
          <span key={i} className={cx('ui-pin__dot', i < pin.length && 'is-filled')} />
        ))}
      </div>
      {error && <p className="ui-field__error center" role="alert">Code incorrect</p>}
      <div className="ui-pin__keys">
        {keys.map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : k === 'del' ? (
            <button key={i} type="button" className="ui-pin__key ui-pin__key--del" aria-label="Effacer" onClick={() => setPin((p) => p.slice(0, -1))}>
              <Icon name="back" size={24} />
            </button>
          ) : (
            <button key={i} type="button" className="ui-pin__key" onClick={() => press(k)}>
              {k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
