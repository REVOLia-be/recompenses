// Validation pure des formulaires d'authentification et de configuration de la famille.

export const MIN_PASSWORD = 8;
export const INVITE_CODE_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Errors<K extends string> = Partial<Record<K, string>>;

export function validateEmail(email: string): string | undefined {
  const v = email.trim();
  if (!v) return 'Indique ton adresse e-mail.';
  if (!EMAIL_RE.test(v)) return 'Cette adresse e-mail ne semble pas valide.';
  return undefined;
}

export function validateSignIn(email: string, password: string): Errors<'email' | 'password'> {
  const errors: Errors<'email' | 'password'> = {};
  const e = validateEmail(email);
  if (e) errors.email = e;
  if (!password) errors.password = 'Saisis ton mot de passe.';
  return errors;
}

export function validateSignUp(
  email: string,
  password: string,
  confirm: string,
): Errors<'email' | 'password' | 'confirm'> {
  const errors: Errors<'email' | 'password' | 'confirm'> = {};
  const e = validateEmail(email);
  if (e) errors.email = e;
  if (password.length < MIN_PASSWORD) errors.password = `Choisis un mot de passe d’au moins ${MIN_PASSWORD} caractères.`;
  if (!confirm) errors.confirm = 'Retape ton mot de passe pour confirmer.';
  else if (confirm !== password) errors.confirm = 'Les deux mots de passe ne sont pas identiques.';
  return errors;
}

/** Majuscules, sans espaces ni tirets (le code se lit souvent « ABCD-EFGH » ou « ABCD EFGH »). */
export function normalizeInviteCode(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase();
}

export interface FamilySetupInput {
  mode: 'create' | 'join';
  familyName: string;
  inviteCode: string;
  parentName: string;
  roleLabel: string;
}

export function validateFamilySetup(
  input: FamilySetupInput,
  codeLength: number = INVITE_CODE_LENGTH,
): Errors<'familyName' | 'inviteCode' | 'parentName' | 'roleLabel'> {
  const errors: Errors<'familyName' | 'inviteCode' | 'parentName' | 'roleLabel'> = {};
  if (input.mode === 'create') {
    if (!input.familyName.trim()) errors.familyName = 'Donne un nom à votre famille.';
  } else {
    const code = normalizeInviteCode(input.inviteCode);
    if (!code) errors.inviteCode = 'Saisis le code d’invitation.';
    else if (code.length !== codeLength) errors.inviteCode = `Le code contient ${codeLength} caractères.`;
  }
  if (!input.parentName.trim()) errors.parentName = 'Indique ton prénom.';
  if (!input.roleLabel.trim()) errors.roleLabel = 'Précise ton rôle (Papa, Maman…).';
  return errors;
}

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}
