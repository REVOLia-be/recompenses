// Séquence de célébration quand le compagnon atteint un nouveau stade :
// l'ancien stade se met à briller et trembler, un éclair blanc, puis le nouveau stade est révélé.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, useModal } from '../../ui';
import { COMPANION_STAGES } from '../../domain/logic';
import { CompanionArt, sparklePath } from './CompanionArt';

export interface EvolutionRevealProps {
  from: number;
  to: number;
  hue: number;
  companionName: string;
  onDone: () => void;
}

type Phase = 'charge' | 'flash' | 'reveal';

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function stageMessage(stage: number, name: string): string {
  switch (stage) {
    case 1:
      return 'L’œuf frémit… quelqu’un se réveille à l’intérieur !';
    case 2:
      return `Crac ! ${name} sort de sa coquille !`;
    case 3:
      return `${name} est un adorable petit bébé !`;
    case 4:
      return `${name} a grandi et ouvre ses petites ailes !`;
    case 5:
      return `${name} est devenu légendaire : une couronne d’étoiles brille au-dessus de sa tête !`;
    default:
      return `${name} se repose tranquillement.`;
  }
}

const CONFETTI = Array.from({ length: 12 }, (_, i) => i);

export function EvolutionReveal({ from, to, hue, companionName, onDone }: EvolutionRevealProps) {
  const [phase, setPhase] = useState<Phase>(() => (prefersReducedMotion() ? 'reveal' : 'charge'));
  const ref = useModal(true, onDone);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (phase === 'charge') {
      const t = window.setTimeout(() => setPhase('flash'), 1700);
      return () => window.clearTimeout(t);
    }
    if (phase === 'flash') {
      const t = window.setTimeout(() => setPhase('reveal'), 380);
      return () => window.clearTimeout(t);
    }
    btnRef.current?.focus({ preventScroll: true });
    return undefined;
  }, [phase]);

  const label = COMPANION_STAGES[to]?.label ?? '';

  return createPortal(
    <div className={`cmp-reveal is-${phase}`}>
      <div
        ref={ref}
        className="cmp-reveal__box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cmp-reveal-title"
        aria-describedby="cmp-reveal-msg"
        tabIndex={-1}
      >
        <p className="cmp-reveal__kicker" aria-hidden="true">
          {phase === 'reveal' ? 'Nouveau stade !' : 'Il se passe quelque chose…'}
        </p>
        <div className="cmp-reveal__stage">
          <div className="cmp-reveal__rays" aria-hidden="true" />
          {phase === 'reveal' ? (
            <div className="cmp-reveal__new">
              <CompanionArt stage={to} hue={hue} size={220} label={`${companionName} — ${label}`} />
            </div>
          ) : (
            <div className="cmp-reveal__old">
              <CompanionArt stage={from} hue={hue} size={220} label={`${companionName} est en train d’évoluer`} />
            </div>
          )}
          {phase === 'reveal' && (
            <svg className="cmp-reveal__confetti" viewBox="0 0 200 200" aria-hidden="true">
              {CONFETTI.map((i) => {
                const a = (i / CONFETTI.length) * Math.PI * 2;
                const x = 100 + Math.cos(a) * 88;
                const y = 100 + Math.sin(a) * 88;
                return (
                  <path
                    key={i}
                    d={sparklePath(x, y, i % 3 === 0 ? 9 : 6)}
                    fill={i % 2 ? '#ffd84d' : '#fff'}
                    stroke="#d99a00"
                    strokeOpacity={0.4}
                    style={{ animationDelay: `${(i % 4) * 0.12}s` }}
                  />
                );
              })}
            </svg>
          )}
          <div className="cmp-reveal__flash" aria-hidden="true" />
        </div>
        <div className="cmp-reveal__text" aria-live="polite">
          {phase === 'reveal' && (
            <>
              <h2 id="cmp-reveal-title" className="cmp-reveal__title">
                {label}
              </h2>
              <p id="cmp-reveal-msg" className="cmp-reveal__msg">
                {stageMessage(to, companionName)}
              </p>
            </>
          )}
          {phase !== 'reveal' && (
            <>
              <h2 id="cmp-reveal-title" className="sr-only">
                {companionName} évolue
              </h2>
              <p id="cmp-reveal-msg" className="cmp-reveal__msg">
                {companionName} brille de plus en plus fort…
              </p>
            </>
          )}
        </div>
        <Button ref={btnRef} size="lg" block onClick={phase === 'reveal' ? onDone : () => setPhase('reveal')} icon="sparkle">
          {phase === 'reveal' ? 'Youpi !' : 'Voir tout de suite'}
        </Button>
      </div>
    </div>,
    document.body,
  );
}
