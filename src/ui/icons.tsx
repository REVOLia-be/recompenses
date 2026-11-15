// Jeu d'icônes maison, SVG inline (trait arrondi 2px, viewBox 24). Pas de dépendance.
import type { ReactElement, SVGProps } from 'react';

const paths = {
  star: (
    <path d="M12 3.2l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.5l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
  ),
  starFilled: (
    <path
      fill="currentColor"
      d="M12 3.2l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.5l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"
    />
  ),
  sparkle: <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z" />,
  flag: (
    <>
      <path d="M3 20l6.5-10 3.5 5 2.5-3.5L21 20z" />
      <path d="M9.5 10V3.5l4 1.6-4 1.7" />
    </>
  ),
  face: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.6 14.2c1.8 2 5 2 6.8 0" />
      <path d="M9 9.6v.6M15 9.6v.6" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="8.5" width="17" height="4" rx="1.2" />
      <path d="M5 12.5V20h14v-7.5M12 8.5V20" />
      <path d="M12 8.5c-1-3-4.6-4.3-5.4-2.4-.6 1.5 1.6 2.4 5.4 2.4zM12 8.5c1-3 4.6-4.3 5.4-2.4.6 1.5-1.6 2.4-5.4 2.4z" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.3 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z" />
  ),
  home: (
    <>
      <path d="M4 11l8-6.5 8 6.5" />
      <path d="M6 9.5V20h12V9.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  back: <path d="M14.5 5.5L8 12l6.5 6.5" />,
  chevronRight: <path d="M9.5 5.5L16 12l-6.5 6.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  pencil: (
    <>
      <path d="M4 20l1-4.2L15.6 5.2a2 2 0 012.8 0l.4.4a2 2 0 010 2.8L8.2 19z" />
      <path d="M13.5 7.3l3.2 3.2" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V4.8h5V7" />
      <path d="M6.5 7l.9 12.2c.1.8.7 1.3 1.5 1.3h6.2c.8 0 1.4-.5 1.5-1.3L17.5 7" />
      <path d="M10.3 11v5.5M13.7 11v5.5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3v10.5H4z" />
      <circle cx="12" cy="13.3" r="3.3" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5M12 14.3v2" />
    </>
  ),
  unlock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 016.8-1.2M12 14.3v2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4L6 18M18 18l-1.6-1.6M7.6 7.6L6 6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5" />
      <circle cx="16.8" cy="9.3" r="2.5" />
      <path d="M15.6 14.6c2.6-.3 4.5 1.3 4.9 4.4" />
    </>
  ),
  history: (
    <>
      <path d="M4.5 12a7.5 7.5 0 102.2-5.3L4.5 9" />
      <path d="M4.5 4.8V9h4.2M12 8v4.3l2.8 1.7" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
      <path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M20.5 16l-5-5-8.5 8" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4.5H6.5v15H14" />
      <path d="M10.5 12H20M16.5 8.5L20 12l-3.5 3.5" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V4M8 7.5L12 3.5l4 4" />
      <path d="M6 11v8.5h12V11" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.2M12 7.8v.4" />
    </>
  ),
  moon: <path d="M19 14.8A7.5 7.5 0 019.2 5a7.5 7.5 0 109.8 9.8z" />,
  egg: <path d="M12 3.5c3.6 0 6.5 5.4 6.5 9.6a6.5 6.5 0 01-13 0C5.5 8.9 8.4 3.5 12 3.5z" />,
  trophy: (
    <>
      <path d="M7.5 4.5h9v4a4.5 4.5 0 01-9 0z" />
      <path d="M7.5 6H4.5c0 2.6 1.3 4 3.4 4.3M16.5 6h3c0 2.6-1.3 4-3.4 4.3M12 13v3.5M8.5 20h7l-.8-3.5H9.3z" />
    </>
  ),
} satisfies Record<string, ReactElement>;

export type IconName = keyof typeof paths;
export const ICON_NAMES = Object.keys(paths) as IconName[];

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Taille en px (défaut 24). */
  size?: number;
  /** Si fourni, l'icône est annoncée (role="img") ; sinon elle est décorative (aria-hidden). */
  title?: string;
}

/** <Icon name="star" size={20} /> — hérite de `color` via currentColor. */
export function Icon({ name, size = 24, title, strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
