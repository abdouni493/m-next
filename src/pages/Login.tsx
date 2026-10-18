import { useState, useEffect } from "react";
import { 
  Lock,
  Eye,
  EyeOff,
  Mail,
  UserPlus,
  Zap,
  BatteryCharging,
  Boxes,
  ScanLine,
  ShieldCheck,
  ArrowRight,
  Store
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { signIn, signUp, getWebsiteSettingsREST } from "@/lib/supabaseClient";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [storeName, setStoreName] = useState('Chargers');
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | null>(null);
  
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [loginCredentials, setLoginCredentials] = useState({
    email: "",
    password: ""
  });

  const [signUpCredentials, setSignUpCredentials] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getWebsiteSettingsREST();
        if (settings) {
          if (settings.store_name) {
            setStoreName(settings.store_name);
          }
          if (settings.logo_url) {
            setStoreLogoUrl(settings.logo_url);
          }
        }
      } catch (error) {
        console.error('Error fetching website settings:', error);
        const localStoreName = localStorage.getItem('storeName');
        if (localStoreName) setStoreName(localStoreName);
      }
    };
    fetchSettings();
  }, []);

  // ===== SIGNUP HANDLER =====
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate inputs
      if (!signUpCredentials.email || !signUpCredentials.password || !signUpCredentials.username) {
        toast({
          title: "❌ Erreur",
          description: "Tous les champs sont requis",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (signUpCredentials.password !== signUpCredentials.confirmPassword) {
        toast({
          title: "❌ Erreur",
          description: "Les mots de passe ne correspondent pas",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (signUpCredentials.password.length < 6) {
        toast({
          title: "❌ Erreur",
          description: "Le mot de passe doit contenir au moins 6 caractères",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { user } = await signUp(
        signUpCredentials.email,
        signUpCredentials.password,
        signUpCredentials.username
      );

      toast({
        title: "✅ Compte créé avec succès",
        description: "Votre compte administrateur a été créé. Connectez-vous maintenant.",
      });

      // Reset signup form and switch to login
      setSignUpCredentials({
        email: "",
        password: "",
        confirmPassword: "",
        username: ""
      });
      
      // Switch to login mode with email pre-filled
      setIsSignUp(false);
      setLoginCredentials({
        email: signUpCredentials.email,
        password: ""
      });
    } catch (err: any) {
      console.error("Signup error:", err);
      
      let errorMessage = "Erreur lors de la création du compte";
      if (err.message?.includes("User already registered")) {
        errorMessage = "Cet email est déjà utilisé";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ===== LOGIN HANDLER =====
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user } = await signIn(
        loginCredentials.email,
        loginCredentials.password
      );

      // Create user object with proper structure for AuthContext
      const userData = {
        id: user?.id || '',
        username: user?.username || user?.email || '',
        email: user?.email || '',
        role: user?.role || 'admin',
        name: user?.username || user?.email || ''
      };

      toast({
        title: "✅ Connexion réussie",
        description: `Bienvenue ${userData.username}! Redirection en cours...`,
      });

      onLogin(userData);
      
      // Small delay to ensure auth context updates
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);
    } catch (err: any) {
      console.error("Login error:", err);
      toast({
        title: "❌ Erreur de connexion",
        description: err.message || "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const field = "h-12 rounded-xl border-white/10 bg-white/[0.04] pl-11 text-[15px] text-white placeholder:text-slate-500 hover:border-white/20 focus-visible:ring-[#C6F432]/60 focus-visible:ring-offset-0";
  const labelCls = "text-sm font-medium text-slate-300";

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#070A10] text-white">
      {/* ambient volt glow + grid */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#C6F432]/10 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-4 py-8 lg:grid-cols-2 lg:px-8">
        {/* Brand / charging panel */}
        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#C6F432]">
              {storeLogoUrl ? <img src={storeLogoUrl} alt="" className="h-full w-full object-cover" /> : <Zap className="h-6 w-6 text-[#0B1220]" fill="currentColor" />}
            </div>
            <span className="font-sora text-2xl font-bold tracking-tight">{storeName}</span>
          </div>
          <h1 className="mt-10 font-sora text-5xl font-bold leading-[1.1] tracking-tight">
            Gérez votre stock de <span className="text-[#C6F432]">chargeurs</span> à pleine puissance.
          </h1>
          <p className="mt-5 max-w-md text-lg text-slate-400">Inventaire, ventes, caisse et commandes de la boutique en ligne, au même endroit.</p>

          {/* charging card */}
          <div className="mt-10 max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5"><BatteryCharging className="h-6 w-6 text-[#C6F432]" /></div>
                <div>
                  <p className="text-sm font-semibold">Session sécurisée</p>
                  <p className="text-xs text-slate-500">19.5V · 3.34A · 65W</p>
                </div>
              </div>
              <span className="font-sora text-2xl font-bold tabular-nums text-[#C6F432]">100%</span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-[#C6F432]" initial={{ width: "8%" }} animate={{ width: "100%" }} transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[{ i: Boxes, t: "Inventaire" }, { i: ScanLine, t: "Caisse" }, { i: ShieldCheck, t: "Sécurisé" }].map(({ i: Icon, t }) => (
                <div key={t} className="rounded-xl bg-white/[0.04] px-2 py-3"><Icon className="mx-auto h-5 w-5 text-slate-300" /><p className="mt-1.5 text-xs text-slate-400">{t}</p></div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          className="mx-auto w-full max-w-md"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#C6F432] shadow-[0_0_40px_rgba(198,244,50,0.35)]">
              {storeLogoUrl ? <img src={storeLogoUrl} alt="" className="h-full w-full object-cover" /> : <Zap className="h-8 w-8 text-[#0B1220]" fill="currentColor" />}
            </div>
            <span className="mt-3 font-sora text-2xl font-bold">{storeName}</span>
            <span className="text-sm text-slate-400">Espace de gestion des chargeurs</span>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0E131D]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-6">
              <h2 className="font-sora text-2xl font-bold">{isSignUp ? "Créer un compte" : "Connexion"}</h2>
              <p className="mt-1 text-sm text-slate-400">{isSignUp ? "Compte administrateur de la boutique." : "Accédez à votre espace de gestion."}</p>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {!isSignUp ? (
                <motion.form key="login" onSubmit={handleLogin} className="space-y-4"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                  <div className="space-y-2">
                    <Label htmlFor="email" className={labelCls}>Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
                      <Input id="email" type="email" autoComplete="email" placeholder="vous@exemple.com" value={loginCredentials.email}
                        onChange={(e) => setLoginCredentials({ ...loginCredentials, email: e.target.value })} className={field} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className={labelCls}>Mot de passe</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
                      <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={loginCredentials.password}
                        onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })} className={`${field} pr-11`} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-xl bg-[#C6F432] text-[15px] font-semibold text-[#0B1220] shadow-[0_8px_30px_-8px_rgba(198,244,50,0.6)] hover:bg-[#C6F432] hover:brightness-95">
                    {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0B1220]/30 border-t-[#0B1220]" /> : <>Se connecter <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                  <p className="text-center text-sm text-slate-400">
                    Pas encore de compte ?{" "}
                    <button type="button" onClick={() => setIsSignUp(true)} className="font-semibold text-[#C6F432] hover:underline">Créer un compte</button>
                  </p>
                </motion.form>
              ) : (
                <motion.form key="signup" onSubmit={handleSignUp} className="space-y-4"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                  <div className="space-y-2">
                    <Label htmlFor="username" className={labelCls}>Nom d'utilisateur</Label>
                    <div className="relative">
                      <UserPlus className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
                      <Input id="username" autoComplete="username" value={signUpCredentials.username}
                        onChange={(e) => setSignUpCredentials({ ...signUpCredentials, username: e.target.value })} className={field} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className={labelCls}>Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
                      <Input id="signup-email" type="email" autoComplete="email" value={signUpCredentials.email}
                        onChange={(e) => setSignUpCredentials({ ...signUpCredentials, email: e.target.value })} className={field} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className={labelCls}>Mot de passe</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
                      <Input id="signup-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={signUpCredentials.password}
                        onChange={(e) => setSignUpCredentials({ ...signUpCredentials, password: e.target.value })} className={`${field} pr-11`} required minLength={6} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Afficher ou masquer le mot de passe">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className={labelCls}>Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
                      <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={signUpCredentials.confirmPassword}
                        onChange={(e) => setSignUpCredentials({ ...signUpCredentials, confirmPassword: e.target.value })} className={`${field} pr-11`} required />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Afficher ou masquer la confirmation">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-xl bg-[#C6F432] text-[15px] font-semibold text-[#0B1220] hover:bg-[#C6F432] hover:brightness-95">
                    {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0B1220]/30 border-t-[#0B1220]" /> : "Créer le compte"}
                  </Button>
                  <p className="text-center text-sm text-slate-400">
                    Déjà un compte ?{" "}
                    <button type="button" onClick={() => setIsSignUp(false)} className="font-semibold text-[#C6F432] hover:underline">Se connecter</button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => navigate("/website-shop")} className="mx-auto mt-6 flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
            <Store className="h-4 w-4" /> Voir la boutique en ligne
          </button>
        </motion.div>
      </div>
    </div>
  );
}
