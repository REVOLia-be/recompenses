// PLACEHOLDER fonctionnel minimal — connexion (mode Supabase).
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { Button, GlassCard, Screen, TextField } from '../../ui';

export function SignInScreen() {
  const { run } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await run((s) => s.signIn(email.trim(), password));
    setLoading(false);
  };

  return (
    <Screen title="Pépites" subtitle="Les bons points de la famille ✨">
      <GlassCard as="section" padding="lg">
        <form className="stack" onSubmit={submit}>
          <h2 className="section-title">Connexion</h2>
          <TextField label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" size="lg" block loading={loading}>
            Se connecter
          </Button>
          <p className="small center muted">
            Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
          </p>
        </form>
      </GlassCard>
    </Screen>
  );
}
