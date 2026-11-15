import type { RouteObject } from 'react-router-dom';
import { CompanionsHome } from './CompanionsHome';

/** Routes de l'onglet « Compagnons » (préfixe "/compagnons"). Ce fichier appartient à cet écran. */
export const routes: RouteObject[] = [{ path: '/compagnons', element: <CompanionsHome /> }];
