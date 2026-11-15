import type { MissionRecurrence } from '../../types';

export interface MissionSuggestion {
  title: string;
  emoji: string;
  points: number;
  recurrence: MissionRecurrence;
}

export const SUGGESTIONS: MissionSuggestion[] = [
  { title: 'Se brosser les dents', emoji: '🦷', points: 1, recurrence: 'daily' },
  { title: 'Préparer son cartable', emoji: '🎒', points: 1, recurrence: 'daily' },
  { title: 'Lire 10 minutes', emoji: '📖', points: 2, recurrence: 'daily' },
  { title: 'Mettre la table', emoji: '🍽️', points: 1, recurrence: 'daily' },
  { title: 'Ranger sa chambre', emoji: '🧸', points: 3, recurrence: 'weekly' },
  { title: 'Aider à arroser les plantes', emoji: '🪴', points: 2, recurrence: 'weekly' },
  { title: 'Trier ses vieux jouets', emoji: '📦', points: 5, recurrence: 'once' },
];

export const RECURRENCE_LABEL: Record<MissionRecurrence, string> = {
  daily: 'Chaque jour',
  weekly: 'Chaque semaine',
  once: 'Une fois',
};

export const RECURRENCE_HELP: Record<MissionRecurrence, string> = {
  daily: 'À valider une fois par jour : ça repart à zéro chaque matin.',
  weekly: 'À valider une fois par semaine, du lundi au dimanche.',
  once: 'Un défi à réussir une seule fois. Une fois validé, il passe dans « Terminées ».',
};
