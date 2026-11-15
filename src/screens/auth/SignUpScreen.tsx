import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage, useApp } from '../../state/AppState';
import { Button, TextField } from '../../ui';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './PasswordField';
import { hasErrors, MIN_PASSWORD, validateSignUp, type Errors } from './validation';

/** Création de compte ; affiche « Vérifie ta boîte mail » si le projet exige la confirmation de l'e-mail. */
export function SignUpScreen() {
  const { store, refresh } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors<'email' | 'password' | 'confirm'>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const refs = {
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    confirm: useRef<HTMLInputElement>(null),
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const errs = validateSignUp(email, password, confirm);
    setErrors(errs);
    setFormError(null);
    if (hasErrors(errs)) {
      const first = (['email', 'password', 'confirm'] as const).find((k) => errs[k]);
      if (first) refs[first].current?.focus();
      return;
    }
    setLoading(true);
    try {
      const res = await store.signUp(email.trim(), password);
      if (res.needsEmailConfirmation) setSentTo(email.trim());
      else await refresh();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <AuthLayout heading="Vérifie ta boîte mail">
        <div className="auth-sent" role="status">
          <span className="auth-sent__emoji emoji" aria-hidden="true">
            💌
          </span>
          <p>
            On t’a envoyé un lien de confirmation à <strong>{sentTo}</strong>.
          </p>
          <p className="muted">
            Clique dessus, puis reviens ici te connecter. Pense à regarder dans les courriers indésirables si tu ne le
            trouves pas.
          </p>
          <Button size="lg" block onClick={() => navigate('/connexion')}>
            Retour à la connexion
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout heading="Créons ton compte ✨" intro="Un compte par parent : vous partagerez ensuite la même famille.">
      <form className="stack" onSubmit={submit} noValidate>
        <TextField
          ref={refs.email}
          label="E-mail"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          ref={refs.password}
          label="Mot de passe"
          name="new-password"
          autoComplete="new-password"
          hint={`${MIN_PASSWORD} caractères minimum.`}
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          ref={refs.confirm}
          label="Confirme le mot de passe"
          name="confirm-password"
          autoComplete="new-password"
          value={confirm}
          error={errors.confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {formError && (
          <p className="auth-form-error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" block loading={loading}>
          Créer mon compte
        </Button>
      </form>
      <p className="auth-switch">
        Déjà un compte ?{' '}
        <Link to="/connexion" className="auth-link">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
}
