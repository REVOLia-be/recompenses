import { useState } from 'react';
import { useApp } from '../../state/AppState';
import type { Family } from '../../types';
import { Button, GlassCard } from '../../ui';
import { formatInviteCode, inviteShareText } from './validation';

/** Copie dans le presse-papiers, avec repli (execCommand) quand l'API moderne est indisponible. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* repli ci-dessous */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Carte « Inviter le deuxième parent » : code en gros, Copier, Partager. */
export function InviteCard({ family }: { family: Family }) {
  const { toast, store } = useApp();
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const message = inviteShareText(family.name, family.inviteCode, url);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    const ok = await copyText(family.inviteCode);
    if (ok) {
      setCopied(true);
      toast('Code copié 📋', { kind: 'success' });
      window.setTimeout(() => setCopied(false), 2500);
    } else {
      toast('Copie impossible : recopie le code à la main.', { kind: 'error' });
    }
  };

  const copyMessage = async () => {
    if (await copyText(message)) toast('Message copié : colle-le dans une conversation 💬', { kind: 'success' });
    else toast('Copie impossible.', { kind: 'error' });
  };

  const share = async () => {
    try {
      await navigator.share({ title: 'Rejoins notre famille sur Pépites', text: message });
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return;
      if (await copyText(message)) toast('Message copié : colle-le dans une conversation 💬', { kind: 'success' });
      else toast('Partage impossible.', { kind: 'error' });
    }
  };

  return (
    <GlassCard as="article" strong className="par-invite">
      <h3 className="par-card-title">Inviter le deuxième parent 💌</h3>
      <p className="muted small">
        Envoie ce code : l’autre parent crée son compte, choisit « Rejoindre une famille » et le saisit. Vous partagez
        alors les mêmes enfants, points et cadeaux.
      </p>
      <p className="par-invite__code" aria-label={`Code d’invitation : ${family.inviteCode.split('').join(' ')}`}>
        {formatInviteCode(family.inviteCode)}
      </p>
      <div className="par-actions">
        <Button variant="secondary" icon={copied ? 'check' : undefined} onClick={() => void copy()}>
          {copied ? 'Copié !' : 'Copier le code'}
        </Button>
        <Button icon="share" onClick={() => void (canShare ? share() : copyMessage())}>
          {canShare ? 'Partager' : 'Copier le message'}
        </Button>
      </div>
      {store.mode === 'local' && (
        <p className="small muted">
          Mode local : les données restent sur cet appareil, le code ne fonctionnera pas depuis un autre téléphone.
        </p>
      )}
    </GlassCard>
  );
}
