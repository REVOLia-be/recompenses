// Teintes des compagnons : une teinte par enfant, dérivée de sa couleur et de son id,
// écartée de celles de ses frères et sœurs pour que deux compagnons ne se ressemblent jamais.
import type { Child, ID } from '../../types';

/** Teinte (0..360) d'une couleur hex, ou null si la couleur est grise / illisible. */
export function hexHue(hex: string | null | undefined): number | null {
  if (!hex) return null;
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let s = m[1];
  if (s.length === 3) s = s.replace(/./g, (c) => c + c);
  const r = parseInt(s.slice(0, 2), 16) / 255;
  const g = parseInt(s.slice(2, 4), 16) / 255;
  const b = parseInt(s.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d < 0.04) return null;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

/** Petit hachage stable d'une chaîne (FNV-1a). */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Teinte « naturelle » d'un compagnon, sans tenir compte des autres enfants. */
export function baseCompanionHue(child: Pick<Child, 'id' | 'color'>): number {
  const fromColor = hexHue(child.color);
  const jitter = (hashString(child.id) % 31) - 15; // ±15° propres à l'enfant
  const h = fromColor ?? hashString(child.id) % 360;
  return (h + jitter + 360) % 360;
}

const MIN_GAP = 40;

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Teintes de tous les compagnons de la famille. Les enfants sont traités par ordre d'arrivée :
 * le premier garde sa teinte naturelle, les suivants sont décalés si besoin pour rester
 * à au moins 40° des teintes déjà prises (tant que c'est possible).
 */
export function companionHues(children: ReadonlyArray<Pick<Child, 'id' | 'color' | 'createdAt'>>): Map<ID, number> {
  const ordered = [...children].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const taken: number[] = [];
  const out = new Map<ID, number>();
  for (const c of ordered) {
    const base = baseCompanionHue(c);
    let best = base;
    if (taken.some((t) => hueDistance(t, base) < MIN_GAP)) {
      let bestScore = -1;
      for (let step = 0; step < 360; step += 5) {
        for (const cand of [(base + step) % 360, (base - step + 360) % 360]) {
          const score = Math.min(...taken.map((t) => hueDistance(t, cand)));
          if (score >= MIN_GAP) {
            best = cand;
            bestScore = Infinity;
            break;
          }
          if (score > bestScore) {
            bestScore = score;
            best = cand;
          }
        }
        if (bestScore === Infinity) break;
      }
    }
    taken.push(best);
    out.set(c.id, best);
  }
  return out;
}

export interface CompanionPalette {
  body: string;
  light: string;
  shade: string;
  deep: string;
  line: string;
  wing: string;
  wingEdge: string;
  spot: string;
  cheek: string;
}

/** Couleurs pastel du compagnon pour une teinte donnée. */
export function companionPalette(hue: number): CompanionPalette {
  const h = ((Math.round(hue) % 360) + 360) % 360;
  const w = (h + 45) % 360;
  const s = (h + 160) % 360;
  return {
    body: `hsl(${h} 88% 86%)`,
    light: `hsl(${h} 100% 95%)`,
    shade: `hsl(${h} 62% 76%)`,
    deep: `hsl(${h} 46% 63%)`,
    line: `hsl(${h} 38% 38%)`,
    wing: `hsl(${w} 95% 92%)`,
    wingEdge: `hsl(${w} 55% 66%)`,
    spot: `hsl(${s} 75% 82%)`,
    cheek: 'hsl(348 90% 74%)',
  };
}
