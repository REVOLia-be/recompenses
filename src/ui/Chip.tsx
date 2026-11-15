import { useRef, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './cx';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** Emoji affiché avant le libellé. */
  emoji?: string;
  children: ReactNode;
}

/** Pastille sélectionnable (filtre, catégorie). aria-pressed reflète `selected`. */
export function Chip({ selected = false, emoji, className, children, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx('ui-chip', selected && 'is-selected', className)}
      {...rest}
    >
      {emoji && (
        <span className="emoji" aria-hidden="true">
          {emoji}
        </span>
      )}
      <span>{children}</span>
    </button>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Libellé accessible si `label` n'est pas du texte. */
  ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Libellé accessible du groupe. */
  label: string;
  className?: string;
}

/** Choix exclusif (radiogroup), navigation aux flèches. */
export function SegmentedControl<T extends string>({ options, value, onChange, label, className }: SegmentedControlProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx('ui-segmented', className)}
      onKeyDown={onKeyDown}
      style={{ ['--seg-count' as string]: options.length, ['--seg-index' as string]: index }}
    >
      <span className="ui-segmented__thumb" aria-hidden="true" />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          aria-label={o.ariaLabel}
          tabIndex={o.value === value ? 0 : -1}
          className={cx('ui-segmented__opt', o.value === value && 'is-selected')}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
