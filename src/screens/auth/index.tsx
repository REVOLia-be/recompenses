import { Navigate, type RouteObject } from 'react-router-dom';
import { FamilySetupScreen } from './FamilySetupScreen';
import { SignInScreen } from './SignInScreen';
import { SignUpScreen } from './SignUpScreen';

/** Routes affichées quand status === 'signedOut' (mode Supabase uniquement). */
export const signedOutRoutes: RouteObject[] = [
  { path: '/connexion', element: <SignInScreen /> },
  { path: '/inscription', element: <SignUpScreen /> },
  { path: '*', element: <Navigate to="/connexion" replace /> },
];

/** Routes affichées quand status === 'noFamily' (connecté, sans famille). */
export const noFamilyRoutes: RouteObject[] = [
  { path: '/bienvenue', element: <FamilySetupScreen /> },
  { path: '*', element: <Navigate to="/bienvenue" replace /> },
];
