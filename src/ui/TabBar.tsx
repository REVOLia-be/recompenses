import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from './icons';
import { cx } from './cx';

export interface TabItem {
  to: string;
  label: string;
  icon: IconName;
  /** NavLink `end` : actif seulement sur le chemin exact (pour "/"). */
  end?: boolean;
}

export interface TabBarProps {
  items: TabItem[];
  className?: string;
}

/** Barre d'onglets flottante en verre, ancrée en bas (respecte la safe-area iOS). */
export function TabBar({ items, className }: TabBarProps) {
  return (
    <nav className={cx('ui-tabbar', className)} aria-label="Navigation principale">
      <ul className="ui-tabbar__list" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((it) => (
          <li key={it.to}>
            <NavLink to={it.to} end={it.end} className={({ isActive }) => cx('ui-tabbar__link', isActive && 'is-active')}>
              <span className="ui-tabbar__icon">
                <Icon name={it.icon} size={24} />
              </span>
              <span className="ui-tabbar__label">{it.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
