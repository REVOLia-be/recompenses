import { useId, useState, useEffect } from 'react';
import { Icon } from './icons';
import { cx } from './cx';

export interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  /** Suffixe affiché sous la valeur, accordé automatiquement si 'pts'. */
  unit?: string;
  hideLabel?: boolean;
  className?: string;
}

/** Gros boutons − / + autour d'une valeur éditable au clavier. */
export function NumberStepper({ value, onChange, label, min = 0, max = 999, step = 1, unit, hideLabel, className }: NumberStepperProps) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const commit = () => {
    const n = parseInt(draft.replace('−', '-'), 10);
    if (Number.isFinite(n)) onChange(clamp(n));
    else setDraft(String(value));
  };
  const unitText = unit === 'pts' ? (Math.abs(value) > 1 ? 'pts' : 'pt') : unit;

  return (
    <div className={cx('ui-stepper', className)} role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`} className={cx('ui-stepper__label', hideLabel && 'sr-only')}>
        {label}
      </span>
      <div className="ui-stepper__row">
        <button
          type="button"
          className="ui-stepper__btn"
          aria-label={`Moins ${step}`}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
        >
          <Icon name="minus" size={26} strokeWidth={2.6} />
        </button>
        <div className="ui-stepper__value">
          <input
            id={`${id}-input`}
            className="ui-stepper__input"
            type="text"
            inputMode={min < 0 ? 'text' : 'numeric'}
            pattern={min < 0 ? undefined : '[0-9]*'}
            enterKeyHint="done"
            autoComplete="off"
            aria-label={label}
            title="Touche pour saisir un nombre"
            value={draft}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
              // Saisie directe : la valeur suit la frappe dès qu'elle est valide.
              const text = min < 0 ? e.target.value : e.target.value.replace(/\D/g, '');
              setDraft(text);
              const n = parseInt(text.replace('−', '-'), 10);
              if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commit();
                e.currentTarget.blur();
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                onChange(clamp(value + step));
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                onChange(clamp(value - step));
              }
            }}
          />
          {unitText && (
            <span className="ui-stepper__unit" aria-hidden="true">
              {unitText}
            </span>
          )}
        </div>
        <button
          type="button"
          className="ui-stepper__btn ui-stepper__btn--plus"
          aria-label={`Plus ${step}`}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
        >
          <Icon name="plus" size={26} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}
