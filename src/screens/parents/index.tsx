import type { RouteObject } from 'react-router-dom';
import { ChildScreen } from './ChildScreen';
import { ParentsHome } from './ParentsHome';

/** Routes de l'onglet « Coin Parent » (préfixe "/parents"). Masquées en mode enfant par le shell. */
export const routes: RouteObject[] = [
  { path: '/parents', element: <ParentsHome /> },
  { path: '/parents/enfants/:id', element: <ChildScreen /> },
];
