import { describe, expect, it } from 'vitest';
import {
  formatAge,
  formatInviteCode,
  inviteShareText,
  isValidBirthdate,
  joinNames,
  sameName,
  validateChildForm,
  validateFamilyName,
  validateParentForm,
} from './validation';

const NOW = new Date(2026, 10, 15);

describe('isValidBirthdate', () => {
  it('accepte une vraie date passée ou du jour', () => {
    expect(isValidBirthdate('2019-05-02', NOW)).toBe(true);
    expect(isValidBirthdate('2026-11-15', NOW)).toBe(true);
  });
  it('refuse futur, format et dates inexistantes', () => {
    expect(isValidBirthdate('2026-11-16', NOW)).toBe(false);
    expect(isValidBirthdate('2019-02-31', NOW)).toBe(false);
    expect(isValidBirthdate('02/05/2019', NOW)).toBe(false);
    expect(isValidBirthdate('1800-01-01', NOW)).toBe(false);
  });
});

describe('formulaires', () => {
  it('enfant : prénom et compagnon obligatoires, date optionnelle', () => {
    expect(validateChildForm({ name: 'Léa', birthdate: '', companionName: 'Pip' }, NOW)).toEqual({});
    const e = validateChildForm({ name: ' ', birthdate: '2030-01-01', companionName: '' }, NOW);
    expect(Object.keys(e).sort()).toEqual(['birthdate', 'companionName', 'name']);
  });
  it('parent', () => {
    expect(validateParentForm({ name: 'Zoé', roleLabel: 'Maman', birthdate: '' }, NOW)).toEqual({});
    expect(validateParentForm({ name: '', roleLabel: '', birthdate: '' }, NOW)).toHaveProperty('name');
  });
  it('famille', () => {
    expect(validateFamilyName('  ')).toBeTruthy();
    expect(validateFamilyName('Les Martin')).toBeUndefined();
  });
});

describe('sameName', () => {
  it('ignore casse, espaces et accents décomposés', () => {
    expect(sameName(' léa ', 'Léa')).toBe(true);
    expect(sameName('Léa', 'Léa')).toBe(true);
    expect(sameName('Lea', 'Léa')).toBe(false);
    expect(sameName('', '')).toBe(false);
  });
});

describe('affichage', () => {
  it('âges', () => {
    expect(formatAge(null)).toBeNull();
    expect(formatAge(0)).toBe('moins d’un an');
    expect(formatAge(1)).toBe('1 an');
    expect(formatAge(7)).toBe('7 ans');
  });
  it('liste de prénoms', () => {
    expect(joinNames([])).toBe('');
    expect(joinNames(['Zoé'])).toBe('Zoé');
    expect(joinNames(['Zoé', 'Paul'])).toBe('Zoé et Paul');
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B et C');
  });
  it('code et message d’invitation', () => {
    expect(formatInviteCode('ABCDEFGH')).toBe('ABCD EFGH');
    expect(formatInviteCode('ABCDEF')).toBe('ABCD EF');
    const t = inviteShareText('Martin', 'ABCDEFGH', 'https://x.test/');
    expect(t).toContain('ABCDEFGH');
    expect(t).toContain('https://x.test/');
  });
});
