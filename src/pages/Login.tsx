import { useEffect, useRef, useState } from "react";
import { Lock, Eye, EyeOff, Mail, Zap, BatteryCharging, Boxes, ScanLine, ShieldCheck, ArrowRight, Store, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { getWebsiteSettingsREST } from "@/lib/supabaseClient";
import { useAuth, homeForRole } from "@/contexts/AuthContext";

const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;
const ATTEMPTS_KEY = "auth:failures";

const readFailures = (): { count: number; until: number } => {
  try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || "") || { count: 0, until: 0 }; } catch { return { count: 0, until: 0 }; }
};

const errorMessage = (err: unknown): string => {
  const msg = String((err as { message?: string })?.message || "");
  if (/invalid login credentials|invalid_credentials/i.test(msg)) return "Email ou mot de passe incorrect.";
  if (/email not confirmed/i.test(msg)) return "Adresse email non confirmée. Vérifiez votre boîte mail.";
  if (/fetch|network/i.test(msg)) return "Connexion au serveur impossible. Vérifiez votre connexion internet.";
  if (/rate limit|too many/i.test(msg)) return "Trop de tentatives. Réessayez dans quelques minutes.";
  return "Connexion impossible. Réessayez.";
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);

  const [storeName, setStoreName] = useState("M NEXT");
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => localStorage.getItem("auth:remember") !== "0");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedFor, setLockedFor] = useState(0);

  useEffect(() => { emailRef.current?.focus(); }, []);
  useEffect(() => {
    getWebsiteSettingsREST().then((s) => {
      if (s?.store_name) setStoreName(String(s.store_name).trim());
      if (s?.logo_url) setStoreLogoUrl(s.logo_url);
    }).catch(() => {});
  }, []);
  // Countdown while locked after too many failures
  useEffect(() => {
    const tick = () => setLockedFor(Math.max(0, Math.ceil((readFailures().until - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const emailError = !email.trim() ? "Entrez votre email." : !/^\S+@\S+\.\S+$/.test(email.trim()) ? "Format d'email invalide." : null;
  const passwordError = !password ? "Entrez votre mot de passe." : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setError(null);
    if (emailError || passwordError || submitting || lockedFor > 0) return;

    setSubmitting(true);
    try {
      const user = await signIn(email, password, remember);
      localStorage.removeItem(ATTEMPTS_KEY);
      const from = (location.state as { from?: string } | null)?.from;
      const home = homeForRole(user.role);
      // Return to the protected page that sent us here, if the role may open it.
      const target = from && from !== "/login" && (home === "/dashboard" ? !from.startsWith("/employee") : from.startsWith("/employee")) ? from : home;
      navigate(target, { replace: true });
    } catch (err) {
      const f = readFailures();
      const count = f.count + 1;
      const until = count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0;
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify({ count: until ? 0 : count, until }));
      setLockedFor(until ? Math.ceil(LOCK_MS / 1000) : 0);
      setError(until ? "Trop de tentatives échouées. Réessayez dans 1 minute." : errorMessage(err));
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldBase = "h-12 w-full rounded-[10px] border bg-background pl-11 pr-3 text-[16px] text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--electric))]/30 focus:border-[hsl(var(--electric))] md:text-[15px]";
  const showEmailErr = touched.email && emailError;
  const showPwdErr = touched.password && passwordError;

  return (
    <div className="grid min-h-dvh bg-background text-foreground lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[#0B1220] p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#C6F432]/15 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[12px] bg-[#C6F432]">
            {storeLogoUrl ? <img src={storeLogoUrl} alt="" className="h-full w-full object-cover" /> : <Zap className="h-6 w-6 text-[#0B1220]" fill="currentColor" />}
          </div>
          <span className="font-sora text-xl font-bold">{storeName}</span>
        </div>

        <div className="relative my-auto max-w-lg">
          <h1 className="font-sora text-[44px] font-bold leading-[1.1] tracking-tight">
            Votre stock de chargeurs, <span className="text-[#C6F432]">sous contrôle.</span>
          </h1>
          <p className="mt-5 text-lg text-[#9AA3B5]">Commandes, inventaire, caisse et boutique en ligne réunis dans un seul espace.</p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium"><BatteryCharging className="h-5 w-5 text-[#C6F432]" /> Session sécurisée</span>
              <span className="font-sora text-lg font-bold tabular-nums text-[#C6F432]">100%</span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-[#C6F432]" initial={{ width: "10%" }} animate={{ width: "100%" }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} />
            </div>
            <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-[#9AA3B5]">
              {[{ i: Boxes, t: "Inventaire" }, { i: ScanLine, t: "Caisse" }, { i: ShieldCheck, t: "Protégé" }].map(({ i: Icon, t }) => (
                <li key={t} className="rounded-xl bg-white/[0.04] py-3"><Icon className="mx-auto mb-1.5 h-5 w-5 text-white/80" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="relative text-xs text-[#9AA3B5]">© {new Date().getFullYear()} {storeName}</p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <motion.div className="w-full max-w-[400px]" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[12px] bg-[#0B1220] dark:bg-[#C6F432]">
              {storeLogoUrl ? <img src={storeLogoUrl} alt="" className="h-full w-full object-cover" /> : <Zap className="h-6 w-6 text-[#C6F432] dark:text-[#0B1220]" fill="currentColor" />}
            </div>
            <span className="font-sora text-xl font-bold">{storeName}</span>
          </div>

          <h2 className="font-sora text-[28px] font-bold tracking-tight">Connexion</h2>
          <p className="mt-1 text-sm text-muted-foreground">Accédez à votre espace de gestion.</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-[10px] border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                <input ref={emailRef} id="email" type="email" inputMode="email" autoComplete="username" value={email}
                  onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  aria-invalid={!!showEmailErr} aria-describedby={showEmailErr ? "email-err" : undefined}
                  className={`${fieldBase} ${showEmailErr ? "border-destructive" : "border-input"}`} placeholder="vous@exemple.com" />
              </div>
              {showEmailErr && <p id="email-err" className="text-xs font-medium text-destructive">{emailError}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  aria-invalid={!!showPwdErr} aria-describedby={showPwdErr ? "pwd-err" : undefined}
                  className={`${fieldBase} pr-12 ${showPwdErr ? "border-destructive" : "border-input"}`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {showPwdErr && <p id="pwd-err" className="text-xs font-medium text-destructive">{passwordError}</p>}
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-[18px] w-[18px] rounded accent-[#0B1220] dark:accent-[#C6F432]" />
              Se souvenir de moi
            </label>

            <button type="submit" disabled={submitting || lockedFor > 0}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
              {submitting ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current/30 border-t-current" aria-label="Connexion en cours" />
                : lockedFor > 0 ? <span className="tabular-nums">Réessayez dans {lockedFor} s</span>
                : <>Se connecter <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">Accès réservé à l'équipe. Mot de passe oublié ? Contactez l'administrateur.</p>
          <button onClick={() => navigate("/website-shop")} className="mx-auto mt-4 flex h-11 items-center gap-2 rounded-[10px] px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <Store className="h-4 w-4" /> Voir la boutique
          </button>
        </motion.div>
      </main>
    </div>
  );
}
