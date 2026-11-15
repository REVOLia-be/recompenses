// Dates relatives en français pour le journal des points (« il y a 5 min », « hier »…).
import { dayKey } from '../../domain/logic';

const MIN = 60_000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Nombre de jours calendaires entre `d` et `now` (0 = même jour, 1 = hier…). */
export function calendarDaysAgo(d: Date, now: Date = new Date()): number {
  return Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / 86_400_000);
}

const weekdayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });
const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const shortYearFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const longFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const longYearFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Date relative courte :
 * « à l’instant », « il y a 5 min », « il y a 3 h », « hier », « lundi », « 3 nov. », « 3 nov. 2025 ».
 */
export function relativeTime(input: Date | string, now: Date = new Date()): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '';
  const diff = now.getTime() - d.getTime();
  if (diff < MIN) return 'à l’instant';
  if (diff < 60 * MIN) return `il y a ${Math.floor(diff / MIN)} min`;
  const days = calendarDaysAgo(d, now);
  if (days <= 0) return `il y a ${Math.floor(diff / (60 * MIN))} h`;
  if (days === 1) return 'hier';
  if (days < 7) return weekdayFmt.format(d);
  return (d.getFullYear() === now.getFullYear() ? shortFmt : shortYearFmt).format(d);
}

/** Titre de groupe pour un jour (clé YYYY-MM-DD) : « Aujourd’hui », « Hier », « lundi 10 novembre ». */
export function dayLabel(key: string, now: Date = new Date()): string {
  const d = new Date(key + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return key;
  const days = calendarDaysAgo(d, now);
  if (days === 0) return 'Aujourd’hui';
  if (days === 1) return 'Hier';
  const s = (d.getFullYear() === now.getFullYear() ? longFmt : longYearFmt).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Regroupe des éléments datés par jour local, en conservant l'ordre d'entrée. */
export function groupByDay<T extends { createdAt: string }>(items: T[]): { key: string; items: T[] }[] {
  const groups: { key: string; items: T[] }[] = [];
  for (const it of items) {
    const key = dayKey(new Date(it.createdAt));
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(it);
    else groups.push({ key, items: [it] });
  }
  return groups;
}

/** « Léa », « Léa et Tom », « Léa, Tom et Zoé ». */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`;
}

/** Pour retirer `wanted` points sans passer sous zéro : montant réellement retiré par enfant. */
export function cappedRemoval(wanted: number, balanceNow: number): number {
  return Math.max(0, Math.min(wanted, balanceNow));
}
