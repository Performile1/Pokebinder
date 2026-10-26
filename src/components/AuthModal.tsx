import React, { useState } from 'react';
import {
  X,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  Mail,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { CollectorProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CollectorProfile | null;
  onUserChange: (user: CollectorProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('wigrund81');

  if (!isOpen) return null;

  // Google Login via Firebase Auth popup
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const profile: CollectorProfile = {
        uid: user.uid,
        email: user.email || 'collector@pokearb.se',
        displayName: user.displayName || user.email?.split('@')[0] || 'Samlare',
        isAnonymous: false,
      };
      onUserChange(profile);
      onClose();
    } catch (err: unknown) {
      console.error('Google Auth Error:', err);
      // If popup was blocked or closed by user, provide fallback demo login option
      setErrorMsg(
        'Google-inloggning kunde inte slutföras i förhandsgranskningen. Du kan använda Direkt Samlarinloggning nedan för att komma igång omedelbart!'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Instant collector profile login (e.g. for preview environment or quick start)
  const handleDirectCollectorLogin = (email: string, name: string) => {
    const profile: CollectorProfile = {
      uid: `collector-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email,
      displayName: name,
      isAnonymous: false,
    };
    onUserChange(profile);
    onClose();
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    onUserChange(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Samlarkonto &amp; Vault</h3>
              <p className="text-[11px] text-red-100 font-mono">Spara din samling och få vinstvarningar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 font-extrabold flex items-center justify-center text-lg border border-red-200">
                  {currentUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 truncate">{currentUser.displayName}</div>
                  <div className="text-xs text-slate-500 font-mono truncate">{currentUser.email}</div>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Molnsynkad Samling Aktiv
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Alla kort du lägger till, dina vinstmål och registrerade pack-batchkoder sparas säkert på ditt konto.
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Logga ut från kontot</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Logga in för att spara dina kort, registrera inköpspris och pack-batchkoder samt sätta automatiska <strong>vinstvarningar</strong> när marknadspriset når ditt säljmål.
              </p>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              )}

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-3 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoading ? 'Ansluter...' : 'Fortsätt med Google'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-mono uppercase text-slate-400">eller direkt inlogg</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Direct Samlar-inloggning */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Samlarnamn / Alias:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="t.ex. wigrund81 eller Pokémästare"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-red-600"
                  />
                  <button
                    onClick={() =>
                      handleDirectCollectorLogin(
                        `${customName.toLowerCase().replace(/\s+/g, '')}@samlare.se`,
                        customName
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                  >
                    Logga in
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Sparar din samling och aktiverar vinstvarningar direkt i webbläsaren och Firestore.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
