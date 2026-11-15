import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: ReactNode;
  /** Aide sous le champ. */
  hint?: ReactNode;
  /** Message d'erreur (met aria-invalid). */
  error?: ReactNode;
  /** Masque visuellement le libellé (reste lu par les lecteurs d'écran). */
  hideLabel?: boolean;
  /** Élément à droite dans le champ (ex. IconButton). */
  trailing?: ReactNode;
}

/** Champ texte avec libellé, aide et erreur reliés en ARIA. Hauteur 52px. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, hideLabel, trailing, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errId = error ? `${inputId}-err` : undefined;
  return (
    <div className={cx('ui-field', error ? 'has-error' : null, className)}>
      <label htmlFor={inputId} className={cx('ui-field__label', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="ui-field__control">
        <input
          ref={ref}
          id={inputId}
          className="ui-field__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
          {...rest}
        />
        {trailing && <div className="ui-field__trailing">{trailing}</div>}
      </div>
      {hint && !error && (
        <p id={hintId} className="ui-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="ui-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
