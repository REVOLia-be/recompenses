import type { RouteObject } from 'react-router-dom';
import { PointsHome } from './PointsHome';
import { ActionsScreen } from './ActionsScreen';
import { HistoryScreen } from './HistoryScreen';

/**
 * Routes de l'onglet « Bons points » (préfixe "/"). Ce fichier appartient à l'écran Bons points.
 * /actions est réservé aux parents (redirection vers / en mode enfant, gérée dans ActionsScreen).
 * /historique est lisible en mode enfant (restreint à l'enfant, sans annulation).
 */
export const routes: RouteObject[] = [
  { index: true, element: <PointsHome /> },
  { path: '/actions', element: <ActionsScreen /> },
  { path: '/historique', element: <HistoryScreen /> },
];
