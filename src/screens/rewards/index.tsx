import type { RouteObject } from 'react-router-dom';
import { RewardsHome } from './RewardsHome';
import { RewardDetail } from './RewardDetail';
import { RewardForm } from './RewardForm';

/** Routes de l'onglet « Cadeaux » (préfixe "/cadeaux"). Ce fichier appartient à cet écran. */
export const routes: RouteObject[] = [
  { path: '/cadeaux', element: <RewardsHome /> },
  { path: '/cadeaux/nouveau', element: <RewardForm /> },
  { path: '/cadeaux/:id', element: <RewardDetail /> },
  { path: '/cadeaux/:id/modifier', element: <RewardForm /> },
];
