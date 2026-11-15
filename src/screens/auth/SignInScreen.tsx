import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage, useApp } from '../../state/AppState';
import { Button, TextField } from '../../ui';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './PasswordField';
import { hasErrors, validateSignIn, type Errors } from './validation';

/** Connexion par e-mail + mot de passe (mode Supabase, status « signedOut »). */
export function SignInScreen() {
  const { store, refresh } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors<'email' | 'password'>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const errs = validateSignIn(email, password);
    setErrors(errs);
    setFormError(null);
    if (hasErrors(errs)) {
      (errs.email ? emailRef : passRef).current?.focus();
      return;
    }
    setLoading(true);
    try {
      await store.signIn(email.trim(), password);
      await refresh();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout heading="Content de te revoir 👋" intro="Connecte-toi pour retrouver les pépites de ta famille.">
      <form className="stack" onSubmit={submit} noValidate>
        <TextField
          ref={emailRef}
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
          ref={passRef}
          label="Mot de passe"
          name="password"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {formError && (
          <p className="auth-form-error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" block loading={loading}>
          Se connecter
        </Button>
      </form>
      <p className="auth-switch">
        Pas encore de compte ?{' '}
        <Link to="/inscription" className="auth-link">
          Créer un compte
        </Link>
      </p>
    </AuthLayout>
  );
}
