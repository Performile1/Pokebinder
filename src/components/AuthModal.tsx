import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { CollectorProfile } from '../types';

export type AccountLanguage = 'en' | 'sv';
const copy = {
  en: { title: 'Your account', login: 'Sign in', register: 'Create account', email: 'Email', password: 'Password (at least 8 characters)', google: 'Continue with Google', reset: 'Reset password', sent: 'If an account exists, a reset email will be sent.', logout: 'Sign out', close: 'Close', busy: 'Please wait…', failed: 'Unable to complete authentication. Check your details and try again.', domain: 'Sign-in is not enabled for this domain. Contact the site owner.', disabled: 'This sign-in method is not enabled. Contact the site owner.', popup: 'Allow popups to continue with Google.', invalid: 'Enter a valid email and a password of at least 8 characters.' },
  sv: { title: 'Ditt konto', login: 'Logga in', register: 'Skapa konto', email: 'E-post', password: 'Lösenord (minst 8 tecken)', google: 'Fortsätt med Google', reset: 'Återställ lösenord', sent: 'Om kontot finns skickas ett återställningsmejl.', logout: 'Logga ut', close: 'Stäng', busy: 'Vänta…', failed: 'Inloggningen misslyckades. Kontrollera dina uppgifter och försök igen.', domain: 'Inloggning är inte aktiverad för denna domän. Kontakta webbplatsägaren.', disabled: 'Denna inloggningsmetod är inte aktiverad. Kontakta webbplatsägaren.', popup: 'Tillåt popup-fönster för Google-inloggning.', invalid: 'Ange en giltig e-postadress och ett lösenord med minst 8 tecken.' },
};
export function AuthModal({ isOpen, onClose, currentUser, language }: { isOpen: boolean; onClose: () => void; currentUser: CollectorProfile | null; language: AccountLanguage }) {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const t = copy[language];
  if (!isOpen) return null;
  async function run(action: () => Promise<unknown>, close = true) {
    setBusy(true); setMessage('');
    try { await action(); setPassword(''); if (close) onClose(); else setMessage(t.sent); }
    catch (error) {
      const code = (error as { code?: string }).code;
      setMessage(code === 'auth/unauthorized-domain' ? t.domain : code === 'auth/operation-not-allowed' ? t.disabled : code === 'auth/popup-blocked' ? t.popup : t.failed);
    } finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
    <section role="dialog" aria-modal="true" aria-labelledby="account-title" className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-auto">
      <div className="flex justify-between"><h2 id="account-title" className="font-bold">{t.title}</h2><button onClick={onClose} aria-label={t.close}>✕</button></div>
      {currentUser ? <><p>{currentUser.email}</p><button disabled={busy} onClick={() => run(() => signOut(auth))}>{t.logout}</button></> : <>
        <div className="flex gap-4"><button aria-pressed={!register} onClick={() => setRegister(false)}>{t.login}</button><button aria-pressed={register} onClick={() => setRegister(true)}>{t.register}</button></div>
        <form className="space-y-3" onSubmit={event => { event.preventDefault(); if (register && password.length < 8) { setMessage(t.invalid); return; } void run(() => register ? createUserWithEmailAndPassword(auth, email.trim(), password) : signInWithEmailAndPassword(auth, email.trim(), password)); }}>
          <label className="block">{t.email}<input className="block border rounded p-2 w-full" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label className="block">{t.password}<input className="block border rounded p-2 w-full" type="password" required minLength={register ? 8 : 1} autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} /></label>
          <button className="bg-red-600 text-white rounded p-2 w-full" disabled={busy}>{busy ? t.busy : register ? t.register : t.login}</button>
        </form>
        <button disabled={busy} onClick={() => run(() => signInWithPopup(auth, googleProvider))}>{t.google}</button>
        <button className="block" disabled={busy || !email.trim()} onClick={() => run(() => sendPasswordResetEmail(auth, email.trim()), false)}>{t.reset}</button>
      </>}
      {message && <p role="status">{message}</p>}
    </section>
  </div>;
}
