import type { RouteObject } from 'react-router-dom';
import { PointsHome } from './PointsHome';

/** Routes de l'onglet « Bons points » (préfixe "/"). Ce fichier appartient à l'écran Bons points. */
export const routes: RouteObject[] = [{ index: true, element: <PointsHome /> }];
