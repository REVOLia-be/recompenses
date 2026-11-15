import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

export interface StarBurstProps {
  /** Message annoncé et affiché (ex. « +3 pts pour Léa ! »). */
  message?: string;
  /** Emoji au centre à la place de l'étoile (ex. emoji de la récompense). */
  emoji?: string;
  /** Appelé à la fin de l'animation (~1.6 s). */
  onDone?: () => void;
  /** Durée totale en ms. */
  duration?: number;
}

const COLORS = ['#fcc419', '#f783ac', '#cc5de8', '#845ef7', '#ffd8a8', '#ffffff'];

/**
 * Animation de célébration plein écran (étoile centrale + étincelles rayonnantes).
 * Monter le composant pour la jouer (changer `key` pour la rejouer).
 * Respecte prefers-reduced-motion (simple fondu). Préférer `useApp().celebrate()`.
 */
export function StarBurst({ message, emoji, onDone, duration = 1600 }: StarBurstProps) {
  useEffect(() => {
    const t = window.setTimeout(() => onDone?.(), duration);
    return () => window.clearTimeout(t);
  }, [onDone, duration]);

  const rays = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2 + (i % 2 ? 0.2 : 0);
        const dist = 110 + (i % 3) * 34;
        return {
          dx: Math.round(Math.cos(angle) * dist),
          dy: Math.round(Math.sin(angle) * dist),
          color: COLORS[i % COLORS.length],
          size: 14 + (i % 4) * 5,
          delay: (i % 5) * 40,
          dot: i % 3 === 2,
        };
      }),
    [],
  );

  return createPortal(
    <div className="ui-burst" style={{ ['--burst-ms' as string]: `${duration}ms` }}>
      <div className="ui-burst__glow" aria-hidden="true" />
      <div className="ui-burst__center" aria-hidden="true">
        {rays.map((r, i) => (
          <span
            key={i}
            className="ui-burst__ray"
            style={{
              ['--dx' as string]: `${r.dx}px`,
              ['--dy' as string]: `${r.dy}px`,
              ['--delay' as string]: `${r.delay}ms`,
              width: r.size,
              height: r.size,
              color: r.color,
            }}
          >
            {r.dot ? (
              <svg viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="4" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 1c.8 5.6 3.4 8.2 11 11-7.6 2.8-10.2 5.4-11 11-.8-5.6-3.4-8.2-11-11 7.6-2.8 10.2-5.4 11-11z" />
              </svg>
            )}
          </span>
        ))}
        <div className="ui-burst__hero">
          {emoji ? (
            <span className="emoji ui-burst__emoji">{emoji}</span>
          ) : (
            <svg viewBox="0 0 24 24" className="ui-burst__star">
              <defs>
                <linearGradient id="burstGold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ffe066" />
                  <stop offset="1" stopColor="#f59f00" />
                </linearGradient>
              </defs>
              <path
                fill="url(#burstGold)"
                stroke="#e8890c"
                strokeWidth="0.8"
                strokeLinejoin="round"
                d="M12 2.6l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 16.9l-5.6 2.9 1.1-6.2L3 9.2l6.2-.9z"
              />
              <circle cx="9.6" cy="11" r=".9" fill="#5c3d00" />
              <circle cx="14.4" cy="11" r=".9" fill="#5c3d00" />
              <path d="M10.4 13.3c.9.8 2.3.8 3.2 0" stroke="#5c3d00" strokeWidth=".8" fill="none" strokeLinecap="round" />
            </svg>
          )}
        </div>
      </div>
      <p className="ui-burst__msg" role="status" aria-live="assertive">
        {message ?? 'Bravo !'}
      </p>
    </div>,
    document.body,
  );
}
