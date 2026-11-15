// Petits éléments partagés par les vues de l'onglet « Bons points ».

/** « +12 cette semaine » / « Pas encore cette semaine ». */
export function weekText(n: number): string {
  if (n > 0) return `+${n} cette semaine`;
  if (n < 0) return `−${Math.abs(n)} cette semaine`;
  return 'Pas encore cette semaine';
}

/** Grosse étoile dorée décorative. */
export function BigStar({ size = 72 }: { size?: number }) {
  return (
    <svg className="pts-bigstar" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="pts-star-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe066" />
          <stop offset="55%" stopColor="#fcc419" />
          <stop offset="100%" stopColor="#f59f00" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.6l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 16.9l-5.6 2.9 1.1-6.2L3 9.2l6.2-.9z"
        fill="url(#pts-star-grad)"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
