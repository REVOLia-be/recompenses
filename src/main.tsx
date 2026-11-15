import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { AppProvider } from './state/AppState';
import { store } from './data';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/app.css';

/**
 * Retour du lien de confirmation d'e-mail : Supabase renvoie la session dans le fragment d'URL
 * (« #access_token=… »), que le HashRouter prendrait pour une route et effacerait. On laisse
 * donc le client Supabase lire ce fragment AVANT de monter le routeur, puis on le nettoie.
 */
async function consumeAuthRedirect(): Promise<void> {
  if (!/[#&](access_token|error|error_description)=/.test(window.location.hash)) return;
  try {
    await store.getSession();
  } catch {
    /* lien expiré ou invalide : l'écran de connexion prendra le relais */
  }
  window.history.replaceState(null, '', window.location.pathname + window.location.search + '#/');
}

void consumeAuthRedirect().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppProvider>
          <App />
        </AppProvider>
      </HashRouter>
    </StrictMode>,
  );
});

// Service worker (cache de l'app shell) : production uniquement.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* hors ligne non disponible : sans gravité */
    });
  });
}
