import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useRoutes, type RouteObject } from 'react-router-dom';
import { useApp } from './state/AppState';
import { noFamilyRoutes, PARENT_ONLY_PREFIX, signedOutRoutes, TABS, tabRoutes } from './routes';
import { Button, IconButton, PinPad, Sheet, SkyBackdrop, TabBar } from './ui';

export function App() {
  const { status } = useApp();
  if (status === 'loading') return <Splash />;
  if (status === 'signedOut') return <RouteSet routes={signedOutRoutes} />;
  if (status === 'noFamily') return <RouteSet routes={noFamilyRoutes} />;
  return <RouteSet routes={shellRoutes} />;
}

const shellRoutes: RouteObject[] = [
  {
    element: <TabShell />,
    children: [...tabRoutes, { path: '*', element: <Navigate to="/" replace /> }],
  },
];

function RouteSet({ routes }: { routes: RouteObject[] }) {
  const element = useRoutes(routes);
  return <div className="app-shell">{element}</div>;
}

/** Layout des onglets : contenu + barre d'onglets flottante + gestion du mode enfant. */
function TabShell() {
  const { childMode, data } = useApp();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (childMode && pathname.startsWith(PARENT_ONLY_PREFIX)) return <Navigate to="/" replace />;

  const tabs = childMode ? TABS.filter((t) => t.to !== PARENT_ONLY_PREFIX) : TABS;
  const child = childMode ? data?.children.find((c) => c.id === childMode) : undefined;

  return (
    <div className="app-shell has-tabbar">
      <Outlet />
      {childMode && <ChildModeLock childName={child?.name} />}
      <TabBar items={tabs} />
    </div>
  );
}

function ChildModeLock({ childName }: { childName?: string }) {
  const { exitChildMode, toast } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="child-banner">
        <IconButton label="Mode enfant activé — quitter (code parent)" icon="lock" onClick={() => setOpen(true)} />
      </div>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Code parent"
        description={childName ? `Pour quitter le mode enfant de ${childName}.` : 'Pour quitter le mode enfant.'}
      >
        <PinPad
          onComplete={(pin) => {
            const ok = exitChildMode(pin);
            if (ok) {
              setOpen(false);
              toast('Mode parent réactivé', { kind: 'success' });
            }
            return ok;
          }}
        />
      </Sheet>
    </>
  );
}

function Splash() {
  const { error, refresh } = useApp();
  return (
    <div className="app-shell splash">
      <SkyBackdrop />
      <div className="splash__content" role="status" aria-live="polite">
        <img src="./icons/icon.svg" alt="" width={96} height={96} className="splash__logo" />
        <p className="splash__name">Pépites</p>
        {error ? (
          <>
            <p className="muted center">{error}</p>
            <Button onClick={() => void refresh()} icon="history">
              Réessayer
            </Button>
          </>
        ) : (
          <p className="muted">Chargement…</p>
        )}
      </div>
    </div>
  );
}
