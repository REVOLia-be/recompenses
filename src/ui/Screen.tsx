import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from './Button';
import { SkyBackdrop } from './SkyBackdrop';
import { cx } from './cx';

export interface ScreenProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** true = bouton retour (historique), string = chemin cible. */
  back?: boolean | string;
  /** Remplace l'action par défaut du bouton retour. */
  onBack?: () => void;
  /** Bouton(s) à droite de l'en-tête (ex. <IconButton icon="plus" label="Ajouter" />). */
  action?: ReactNode;
  /** Contenu sous le titre, dans l'en-tête (ex. sélecteur d'enfant). */
  headerExtra?: ReactNode;
  /** Décor de fond (défaut true). */
  decor?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * Gabarit de page : décor de fond + en-tête (titre h1, sous-titre, retour, action) + contenu.
 * Le bas du contenu réserve automatiquement la place de la barre d'onglets.
 */
export function Screen({ title, subtitle, back, onBack, action, headerExtra, decor = true, children, className }: ScreenProps) {
  const navigate = useNavigate();
  const goBack = () => {
    if (onBack) onBack();
    else if (typeof back === 'string') navigate(back);
    else navigate(-1);
  };
  return (
    <div className={cx('ui-screen', className)}>
      {decor && <SkyBackdrop />}
      <header className="ui-screen__header">
        <div className="ui-screen__bar">
          {(back || onBack) && <IconButton label="Retour" icon="back" onClick={goBack} />}
          <div className="ui-screen__titles grow">
            <h1 className="ui-screen__title">{title}</h1>
            {subtitle && <p className="ui-screen__subtitle">{subtitle}</p>}
          </div>
          {action && <div className="ui-screen__action">{action}</div>}
        </div>
        {headerExtra}
      </header>
      <main className="ui-screen__body">{children}</main>
    </div>
  );
}
