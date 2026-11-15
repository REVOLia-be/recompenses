import type { RouteObject } from 'react-router-dom';
import { RewardsHome } from './RewardsHome';

/** Routes de l'onglet « Cadeaux » (préfixe "/cadeaux"). Ce fichier appartient à cet écran. */
export const routes: RouteObject[] = [{ path: '/cadeaux', element: <RewardsHome /> }];
