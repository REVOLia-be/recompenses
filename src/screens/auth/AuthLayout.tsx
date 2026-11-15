import type { ReactNode } from 'react';
import { GlassCard, SkyBackdrop } from '../../ui';
import './auth.css';

/** Gabarit commun : logo « Pépites », accroche, carte de verre. */
export function AuthLayout({ heading, intro, children }: { heading: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="auth-page">
      <SkyBackdrop />
      <main className="auth-main">
        <div className="auth-brand">
          <img src="./icons/icon.svg" alt="" width={72} height={72} className="auth-brand__logo" />
          <p className="auth-brand__name">Pépites</p>
          <p className="auth-brand__tag">Les bons points de la famille ✨</p>
        </div>
        <GlassCard as="section" padding="lg" strong>
          <div className="stack">
            <div className="stack" style={{ ['--gap' as string]: '4px' }}>
              <h1 className="auth-title">{heading}</h1>
              {intro && <p className="muted auth-intro">{intro}</p>}
            </div>
            {children}
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
