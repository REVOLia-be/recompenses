// Logique pure du Coin Parent : validation des formulaires, confirmation de suppression, texte d'invitation.

export interface AvatarColor {
  value: string;
  name: string;
}

/** Palette pastel proposée pour l'avatar d'un enfant (la valeur hex est stockée dans Child.color). */
export const AVATAR_COLORS: AvatarColor[] = [
  { value: '#ffd6e7', name: 'Rose' },
  { value: '#fcc2d7', name: 'Rose bonbon' },
  { value: '#ffc9c9', name: 'Corail' },
  { value: '#ffe8cc', name: 'Pêche' },
  { value: '#fff3bf', name: 'Citron' },
  { value: '#e9fac8', name: 'Pistache' },
  { value: '#d3f9d8', name: 'Menthe' },
  { value: '#c5f6fa', name: 'Glacier' },
  { value: '#d0ebff', name: 'Ciel' },
  { value: '#d0bfff', name: 'Violette' },
  { value: '#e5dbff', name: 'Lilas' },
];

export const DEFAULT_COMPANION_NAME = 'Pépito';
export const NAME_MAX = 40;

export type Errors<K extends string> = Partial<Record<K, string>>;

/** YYYY-MM-DD valide, réel (pas de 31 février) et pas dans le futur. */
export function isValidBirthdate(value: string, now: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return false;
  if (y < 1900) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return date.getTime() <= today.getTime();
}

/** Date du jour au format YYYY-MM-DD (attribut `max` d'un input date). */
export function todayIso(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export interface ChildFormValues {
  name: string;
  birthdate: string;
  companionName: string;
}

export function validateChildForm(v: ChildFormValues, now: Date = new Date()): Errors<'name' | 'birthdate' | 'companionName'> {
  const errors: Errors<'name' | 'birthdate' | 'companionName'> = {};
  if (!v.name.trim()) errors.name = 'Indique le prénom de l’enfant.';
  else if (v.name.trim().length > NAME_MAX) errors.name = `Le prénom est limité à ${NAME_MAX} caractères.`;
  if (v.birthdate && !isValidBirthdate(v.birthdate, now)) errors.birthdate = 'Cette date de naissance n’est pas valide.';
  if (!v.companionName.trim()) errors.companionName = 'Donne un nom au compagnon.';
  return errors;
}

export interface ParentFormValues {
  name: string;
  roleLabel: string;
  birthdate: string;
}

export function validateParentForm(v: ParentFormValues, now: Date = new Date()): Errors<'name' | 'roleLabel' | 'birthdate'> {
  const errors: Errors<'name' | 'roleLabel' | 'birthdate'> = {};
  if (!v.name.trim()) errors.name = 'Indique ton prénom.';
  else if (v.name.trim().length > NAME_MAX) errors.name = `Le prénom est limité à ${NAME_MAX} caractères.`;
  if (!v.roleLabel.trim()) errors.roleLabel = 'Précise ton rôle (Papa, Maman…).';
  if (v.birthdate && !isValidBirthdate(v.birthdate, now)) errors.birthdate = 'Cette date de naissance n’est pas valide.';
  return errors;
}

export function validateFamilyName(name: string): string | undefined {
  if (!name.trim()) return 'Donne un nom à votre famille.';
  if (name.trim().length > 60) return 'Le nom est limité à 60 caractères.';
  return undefined;
}

/** Comparaison tolérante (casse, accents composés/décomposés, espaces) pour retaper un prénom. */
export function sameName(typed: string, expected: string): boolean {
  const norm = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr');
  return norm(typed) !== '' && norm(typed) === norm(expected);
}

/** « 5 ans », « 1 an », « moins d’un an » ; null si pas d'âge. */
export function formatAge(age: number | null): string | null {
  if (age === null || age < 0) return null;
  if (age === 0) return 'moins d’un an';
  return age === 1 ? '1 an' : `${age} ans`;
}

/** Liste « Léa, Tom et Zoé » ; vide si aucun nom. */
export function joinNames(names: string[]): string {
  const list = names.map((n) => n.trim()).filter(Boolean);
  if (list.length <= 1) return list[0] ?? '';
  return `${list.slice(0, -1).join(', ')} et ${list[list.length - 1]}`;
}

export function inviteShareText(familyName: string, code: string, url: string): string {
  return [
    `Rejoins la famille ${familyName} sur Pépites 💛`,
    '',
    `1. Ouvre ${url}`,
    '2. Crée ton compte (ou connecte-toi)',
    '3. Choisis « Rejoindre une famille »',
    `4. Saisis ce code d’invitation : ${code}`,
  ].join('\n');
}

/** Groupes de 4 caractères pour la lisibilité (« ABCD EFGH »). */
export function formatInviteCode(code: string): string {
  return code.replace(/(.{4})(?=.)/g, '$1 ');
}
