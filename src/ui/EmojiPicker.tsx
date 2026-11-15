import { useId, useState } from 'react';
import { cx } from './cx';

/** Jeux d'emojis adaptés aux enfants. */
export const EMOJI_SETS = {
  actions: ['🧸', '🍽️', '💛', '📚', '🪥', '🤝', '👕', '🥦', '🛏️', '🧹', '🧺', '🌱', '🐶', '🎒', '🚿', '🙏', '😴', '🎵', '✏️', '🧩'],
  rewards: ['🎁', '🐴', '🍦', '🎬', '🎮', '📖', '🏊', '🎡', '🍕', '🧁', '🎨', '⚽', '🛝', '🏕️', '🎟️', '🧃', '🦄', '🚲', '🎳', '🌙'],
  animals: ['🐣', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐢', '🦄', '🐉', '🦋', '🐞', '🐬', '🦉', '🐧', '🐱', '🐶', '🦕'],
  people: ['🧒', '👧', '👦', '👶', '🧑', '👩', '👨', '👵', '👴', '🦸', '🧚', '🧜', '🥷', '🤴', '👸', '🧙', '🙂', '😊', '😎', '🤩'],
  magic: ['⭐', '🌟', '✨', '💫', '🌈', '☀️', '🌙', '☁️', '🌸', '🌻', '🍀', '💎', '👑', '🔮', '🎈', '🎀', '💖', '🫧', '🪄', '🏆'],
} as const;

export type EmojiSet = keyof typeof EMOJI_SETS;

/** Extrait le premier « caractère visible » (graphème) d'une saisie libre. */
export function firstGrapheme(text: string): string {
  const t = text.trim();
  if (!t) return '';
  if (typeof Intl.Segmenter === 'function') {
    for (const s of new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(t)) return s.segment;
  }
  return Array.from(t)[0] ?? '';
}

export interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  label?: string;
  /** Jeu(x) proposé(s), défaut tous. Ou une liste personnalisée. */
  sets?: EmojiSet[];
  emojis?: string[];
  /** Affiche le champ de saisie libre (défaut true). */
  allowCustom?: boolean;
  className?: string;
}

/** Grille d'emojis + saisie libre (clavier emoji du téléphone). */
export function EmojiPicker({ value, onChange, label = 'Choisir un emoji', sets, emojis, allowCustom = true, className }: EmojiPickerProps) {
  const id = useId();
  const [custom, setCustom] = useState('');
  const list =
    emojis ?? Array.from(new Set((sets ?? (Object.keys(EMOJI_SETS) as EmojiSet[])).flatMap((s) => [...EMOJI_SETS[s]])));
  const shown = value && !list.includes(value) ? [value, ...list] : list;

  return (
    <div className={cx('ui-emoji', className)}>
      <span id={`${id}-label`} className="ui-field__label">
        {label}
      </span>
      <div className="ui-emoji__grid" role="group" aria-labelledby={`${id}-label`}>
        {shown.map((e) => (
          <button
            key={e}
            type="button"
            className={cx('ui-emoji__cell', e === value && 'is-selected')}
            aria-pressed={e === value}
            aria-label={e}
            onClick={() => onChange(e)}
          >
            <span className="emoji" aria-hidden="true">
              {e}
            </span>
          </button>
        ))}
      </div>
      {allowCustom && (
        <div className="ui-emoji__custom">
          <label htmlFor={`${id}-custom`} className="small muted">
            Ou un autre emoji :
          </label>
          <input
            id={`${id}-custom`}
            className="ui-field__input ui-emoji__input"
            value={custom}
            placeholder="🙂"
            autoComplete="off"
            onChange={(e) => {
              const g = firstGrapheme(e.target.value);
              setCustom(g);
              if (g) onChange(g);
            }}
          />
        </div>
      )}
    </div>
  );
}
