// PLACEHOLDER fonctionnel minimal — inscription (mode Supabase).
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { Button, GlassCard, Screen, TextField } from '../../ui';

export function SignUpScreen() {
  const { run } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await run((s) => s.signUp(email.trim(), password));
    setLoading(false);
    if (res?.needsEmailConfirmation) setSent(true);
  };

  return (
    <Screen title="Créer un compte" back="/connexion">
      <GlassCard as="section" padding="lg">
        {sent ? (
          <div className="stack center">
            <p className="section-title">Vérifiez vos e-mails 💌</p>
            <p className="muted">Cliquez sur le lien reçu à {email}, puis revenez vous connecter.</p>
            <Link to="/connexion">Retour à la connexion</Link>
          </div>
        ) : (
          <form className="stack" onSubmit={submit}>
            <TextField label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField
              label="Mot de passe"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              hint="6 caractères minimum."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" size="lg" block loading={loading}>
              Créer mon compte
            </Button>
          </form>
        )}
      </GlassCard>
    </Screen>
  );
}
