import type { RouteObject } from 'react-router-dom';
import { MissionsHome } from './MissionsHome';

/** Routes de l'onglet « Missions » (préfixe "/missions"). Ce fichier appartient à cet écran. */
export const routes: RouteObject[] = [{ path: '/missions', element: <MissionsHome /> }];
