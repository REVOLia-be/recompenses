import { memo } from 'react';

/**
 * Décor de fond original : ciel dégradé (CSS du body), astre doux, nuages, étincelles,
 * collines pastel. Fixe, décoratif (aria-hidden), sans interaction.
 */
export const SkyBackdrop = memo(function SkyBackdrop() {
  return (
    <div className="ui-backdrop" aria-hidden="true">
      <div className="ui-backdrop__sky">
        <svg className="ui-backdrop__scene" viewBox="0 0 390 420" preserveAspectRatio="xMidYMin meet">
          <defs>
            <radialGradient id="sbSun" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff6dc" />
              <stop offset="0.55" stopColor="#ffe3b3" />
              <stop offset="1" stopColor="#ffd0b8" />
            </radialGradient>
            <radialGradient id="sbHalo" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff2d6" stopOpacity="0.9" />
              <stop offset="1" stopColor="#ffe1ee" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sbCloud" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fbeaff" stopOpacity="0.85" />
            </linearGradient>
            <symbol id="sbSpark" viewBox="-10 -10 20 20">
              <path d="M0-10C.8-3 3-.8 10 0 3 .8.8 3 0 10-.8 3-3 .8-10 0-3-.8-.8-3 0-10z" />
            </symbol>
          </defs>
          <circle cx="318" cy="96" r="78" fill="url(#sbHalo)" />
          <circle cx="318" cy="96" r="36" fill="url(#sbSun)" />
          <g fill="url(#sbCloud)" className="ui-backdrop__cloud ui-backdrop__cloud--a">
            <ellipse cx="62" cy="148" rx="46" ry="17" />
            <circle cx="48" cy="138" r="18" />
            <circle cx="76" cy="132" r="22" />
          </g>
          <g fill="url(#sbCloud)" className="ui-backdrop__cloud ui-backdrop__cloud--b">
            <ellipse cx="300" cy="196" rx="40" ry="13" />
            <circle cx="288" cy="188" r="14" />
            <circle cx="311" cy="184" r="17" />
          </g>
          <g fill="url(#sbCloud)" className="ui-backdrop__cloud ui-backdrop__cloud--c" opacity="0.7">
            <ellipse cx="170" cy="62" rx="30" ry="9" />
            <circle cx="164" cy="56" r="11" />
            <circle cx="180" cy="54" r="12" />
          </g>
          <g className="ui-backdrop__sparks">
            <use href="#sbSpark" x="22" y="58" width="14" height="14" fill="#ffffff" className="tw tw1" />
            <use href="#sbSpark" x="128" y="118" width="10" height="10" fill="#ffd43b" className="tw tw2" />
            <use href="#sbSpark" x="236" y="40" width="12" height="12" fill="#ffffff" className="tw tw3" />
            <use href="#sbSpark" x="356" y="168" width="10" height="10" fill="#f7a8d0" className="tw tw1" />
            <use href="#sbSpark" x="210" y="232" width="9" height="9" fill="#ffffff" className="tw tw2" />
            <use href="#sbSpark" x="40" y="250" width="11" height="11" fill="#d0bfff" className="tw tw3" />
            <use href="#sbSpark" x="262" y="122" width="7" height="7" fill="#ffffff" className="tw tw2" />
          </g>
        </svg>
      </div>
      <svg className="ui-backdrop__hills" viewBox="0 0 390 160" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sbHill1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dccbff" />
            <stop offset="1" stopColor="#efe4ff" />
          </linearGradient>
          <linearGradient id="sbHill2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffc6dc" />
            <stop offset="1" stopColor="#ffe0ea" />
          </linearGradient>
          <linearGradient id="sbHill3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd6c0" />
            <stop offset="1" stopColor="#fff0e6" />
          </linearGradient>
        </defs>
        <path d="M0 70 C70 30 140 40 210 66 S330 50 390 34 V160 H0Z" fill="url(#sbHill1)" opacity="0.8" />
        <path d="M0 104 C80 70 150 78 220 100 S340 92 390 76 V160 H0Z" fill="url(#sbHill2)" opacity="0.85" />
        <path d="M0 136 C90 112 180 116 260 130 S360 128 390 120 V160 H0Z" fill="url(#sbHill3)" />
      </svg>
    </div>
  );
});
