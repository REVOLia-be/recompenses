// Déclaration centrale des routes. Chaque dossier d'écran exporte ses RouteObject[] depuis son index.tsx :
// un agent d'écran ne modifie que son dossier, jamais ce fichier.
import type { RouteObject } from 'react-router-dom';
import type { TabItem } from './ui';
import { routes as pointsRoutes } from './screens/points';
import { routes as missionsRoutes } from './screens/missions';
import { routes as companionsRoutes } from './screens/companions';
import { routes as rewardsRoutes } from './screens/rewards';
import { routes as parentsRoutes } from './screens/parents';

export { signedOutRoutes, noFamilyRoutes } from './screens/auth';

/** Routes rendues dans le shell à onglets (status === 'ready'). */
export const tabRoutes: RouteObject[] = [
  ...pointsRoutes,
  ...missionsRoutes,
  ...companionsRoutes,
  ...rewardsRoutes,
  ...parentsRoutes,
];

/** Préfixe des routes réservées aux parents (inaccessibles en mode enfant). */
export const PARENT_ONLY_PREFIX = '/parents';

export const TABS: TabItem[] = [
  { to: '/', label: 'Bons points', icon: 'star', end: true, alsoActiveOn: ['/actions', '/historique'] },
  { to: '/missions', label: 'Missions', icon: 'flag' },
  { to: '/compagnons', label: 'Compagnons', icon: 'face' },
  { to: '/cadeaux', label: 'Cadeaux', icon: 'gift' },
  { to: PARENT_ONLY_PREFIX, label: 'Coin Parent', icon: 'users' },
];
