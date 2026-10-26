export function isVerifiedAdmin(auth) {
  return auth?.token?.admin === true && auth.token.email_verified === true;
}
export function profileInput(data) {
  if (!data || typeof data.displayName !== 'string' || data.displayName.trim().length < 1 || data.displayName.length > 80 || !['en', 'sv'].includes(data.language)) {
    throw new Error('Expected displayName (1–80 characters) and language (en or sv).');
  }
  return { displayName: data.displayName.trim(), language: data.language };
}
