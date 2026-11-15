import { describe, expect, it } from 'vitest';
import { hasErrors, normalizeInviteCode, validateEmail, validateFamilySetup, validateSignIn, validateSignUp } from './validation';

describe('auth validation', () => {
  it('valide les e-mails', () => {
    expect(validateEmail('')).toBeTruthy();
    expect(validateEmail('abc')).toBeTruthy();
    expect(validateEmail(' a@b.fr ')).toBeUndefined();
  });
  it('connexion', () => {
    expect(hasErrors(validateSignIn('a@b.fr', 'x'))).toBe(false);
    expect(validateSignIn('a@b.fr', '').password).toBeTruthy();
  });
  it('inscription : longueur et confirmation', () => {
    expect(validateSignUp('a@b.fr', 'court', 'court').password).toBeTruthy();
    expect(validateSignUp('a@b.fr', 'longuemotdepasse', 'autre').confirm).toBeTruthy();
    expect(hasErrors(validateSignUp('a@b.fr', 'longuemotdepasse', 'longuemotdepasse'))).toBe(false);
  });
  it('normalise le code', () => {
    expect(normalizeInviteCode(' ab3d-ef4h ')).toBe('AB3DEF4H');
  });
  it('configuration famille', () => {
    const base = { mode: 'join' as const, familyName: '', inviteCode: 'abcd-efgh', parentName: 'Zoé', roleLabel: 'Maman' };
    expect(hasErrors(validateFamilySetup(base))).toBe(false);
    expect(validateFamilySetup({ ...base, inviteCode: 'abc' }).inviteCode).toBeTruthy();
    expect(validateFamilySetup({ ...base, mode: 'create' }).familyName).toBeTruthy();
    expect(validateFamilySetup({ ...base, parentName: ' ' }).parentName).toBeTruthy();
  });
});
