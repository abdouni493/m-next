import { useState, useEffect } from "react";
import { 
  Lock,
  Eye,
  EyeOff,
  Mail,
  Globe,
  UserPlus
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-emerald-50 dark:from-slate-950 dark:via-background dark:to-slate-900 p-4">
      <motion.div
        className="w-full max-w-md space-y-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Logo & Header with Store Logo in Circle */}
        <motion.div
          className="text-center space-y-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl border-4 border-blue-500 bg-white flex items-center justify-center">
              {storeLogoUrl ? (
                <img src={storeLogoUrl} alt="Store Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center text-white">
                  <Globe className="w-12 h-12" />
                </div>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">{storeName}</h1>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {isSignUp ? "📝 Créer un compte administrateur" : "🔐 Connexion"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Créez votre compte pour accéder à la gestion" : "Accédez à votre espace de gestion"}
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-blue-200 dark:border-blue-900 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950 dark:to-emerald-950 rounded-t-lg">
              <CardTitle className="text-center text-xl">
                {isSignUp ? "🔑 Créer un compte" : "🔑 Se Connecter"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
                {/* Signup - Username Input */}
                {isSignUp && (
                  <div>
                    <Label htmlFor="signup-username" className="flex items-center gap-2 mb-2">
                      👤 Nom d'utilisateur
                    </Label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500" />
                      <Input
                        id="signup-username"
                        type="text"
                        value={signUpCredentials.username}
                        onChange={(e) => setSignUpCredentials(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Votre nom d'utilisateur"
                        className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <Label htmlFor={isSignUp ? "signup-email" : "login-email"} className="flex items-center gap-2 mb-2">
                    📧 Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <Input
                      id={isSignUp ? "signup-email" : "login-email"}
                      type="email"
                      value={isSignUp ? signUpCredentials.email : loginCredentials.email}
                      onChange={(e) => isSignUp 
                        ? setSignUpCredentials(prev => ({ ...prev, email: e.target.value }))
                        : setLoginCredentials(prev => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="votre@email.com"
                      className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <Label htmlFor={isSignUp ? "signup-password" : "login-password"} className="flex items-center gap-2 mb-2">
                    🔒 Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <Input
                      id={isSignUp ? "signup-password" : "login-password"}
                      type={showPassword ? "text" : "password"}
                      value={isSignUp ? signUpCredentials.password : loginCredentials.password}
                      onChange={(e) => isSignUp 
                        ? setSignUpCredentials(prev => ({ ...prev, password: e.target.value }))
                        : setLoginCredentials(prev => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Votre mot de passe"
                      className="pl-10 pr-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-blue-500" /> : <Eye className="h-4 w-4 text-blue-500" />}
                    </Button>
                  </div>
                  {isSignUp && (
                    <p className="text-xs text-muted-foreground mt-1">Minimum 6 caractères</p>
                  )}
                </div>

                {/* Signup - Confirm Password Input */}
                {isSignUp && (
                  <div>
                    <Label htmlFor="signup-confirm-password" className="flex items-center gap-2 mb-2">
                      🔒 Confirmer le mot de passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500" />
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={signUpCredentials.confirmPassword}
                        onChange={(e) => setSignUpCredentials(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirmez votre mot de passe"
                        className="pl-10 pr-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-10"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-blue-500" /> : <Eye className="h-4 w-4 text-blue-500" />}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold text-base py-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isSignUp ? "Création..." : "Connexion..."}
                    </div>
                  ) : (
                    isSignUp ? <>👤 Créer mon compte</> : <>🔐 Se connecter</>
                  )}
                </Button>

                {/* Toggle between Login and Signup */}
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    {isSignUp ? "Vous avez déjà un compte?" : "Vous n'avez pas de compte?"}
                    {" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setLoginCredentials({ email: "", password: "" });
                        setSignUpCredentials({ email: "", password: "", confirmPassword: "", username: "" });
                      }}
                      className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      {isSignUp ? "Se connecter" : "Créer un compte"}
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Visit Website Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button 
            type="button"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
            onClick={() => navigate('/website-shop')}
          >
            🌐 Visiter le Site Web
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
