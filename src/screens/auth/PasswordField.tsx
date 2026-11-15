import { forwardRef, useState } from 'react';
import { TextField, type TextFieldProps } from '../../ui';

/** Champ mot de passe avec bouton afficher / masquer (cible ≥ 44px). */
export const PasswordField = forwardRef<HTMLInputElement, Omit<TextFieldProps, 'type' | 'trailing'>>(
  function PasswordField(props, ref) {
    const [shown, setShown] = useState(false);
    return (
      <TextField
        {...props}
        ref={ref}
        className="auth-pw"
        type={shown ? 'text' : 'password'}
        autoCapitalize="none"
        spellCheck={false}
        trailing={
          <button type="button" className="auth-pw__toggle" aria-pressed={shown} onClick={() => setShown((s) => !s)}>
            {shown ? 'Masquer' : 'Afficher'}
          </button>
        }
      />
    );
  },
);
