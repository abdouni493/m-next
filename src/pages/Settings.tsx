import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Globe,
  Database,
  User,
  Shield,
  Bell,
  Download,
  Upload,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Printer,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase, getUserProfile, getSystemInfo, getStores, updateUserProfile } from '@/lib/supabaseClient';

export default function Settings() {
  const { toast } = useToast();
  const { language, setLanguage, t, isRTL } = useLanguage();

  const [settings, setSettings] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: true,
    autoBackup: true,
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [backupHistory, setBackupHistory] = useState([]);
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    database: 'local',
    lastBackup: '',
    diskSpace: 'N/A',
    uptime: 'N/A',
    networkStatus: 'disconnected'
  });

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Store branding from website_settings
  const [websiteSettings, setWebsiteSettings] = useState({
    store_name: 'Chargers',
    logo_url: '',
    logo_data: '',
    slogan: '',
    description: ''
  });

  const [stores, setStores] = useState<{id: string; name: string; display_name?: string; logo_data?: string}[]>([]);

  // Remove API_URL since we're using Supabase

  useEffect(() => {
    fetchSystemInfo();
    fetchBackupHistory();
    fetchUserInfo();
    fetchWebsiteSettings();
  }, []);

  const fetchWebsiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .single();

      if (error) {
        console.warn('Could not fetch website settings:', error);
        setFetchError('website_settings not available');
        return;
      }

      if (data) {
        setWebsiteSettings({
          store_name: data.store_name || 'Chargers',
          logo_url: data.logo_url || '',
          logo_data: data.logo_data || '',
          slogan: data.slogan || '',
          description: data.description || ''
        });
      }
    } catch (err) {
      console.error('Error fetching website settings:', err);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const userData = await getUserProfile();
      if (userData) {
        setSettings(prev => ({
          ...prev,
          username: userData.username || '',
          email: userData.email || '',
        }));
      }
      setFetchError(null);
    } catch (err) {
      console.error("❌ Failed to fetch user info:", err);
      setFetchError('Impossible de charger le profil utilisateur.');
      const savedName = localStorage.getItem('username');
      const savedEmail = localStorage.getItem('userEmail');
      if (savedName || savedEmail) {
        setSettings(prev => ({
          ...prev,
          username: savedName || prev.username,
          email: savedEmail || prev.email,
        }));
      }
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations du compte.",
        variant: "destructive"
      });
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const systemData = await getSystemInfo();
      setSystemInfo(prev => ({
        ...prev,
        ...systemData
      }));
      setFetchError(null);
    } catch (err) {
      console.error('Failed to fetch system info:', err);
      setFetchError('Impossible de charger les informations système. Mode offline activé.');
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations système.",
        variant: "destructive"
      });
      setSystemInfo(prev => ({
        ...prev,
        database: 'Supabase',
        diskSpace: 'N/A',
        uptime: 'N/A',
        networkStatus: 'disconnected'
      }));
    }
  };

  const fetchBackupHistory = async () => {
    // This would require a new backend endpoint to list backup files
    // For now, we'll use a placeholder
    setBackupHistory([]);
  };
  
  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const handleLanguageChange = (value) => {
    setLanguage(value);
    setSettings(prev => ({ ...prev, language: value }));
    toast({
      title: value === 'ar' ? "تم تغيير اللغة" : "Langue modifiée",
      description: value === 'ar' ? "تم تبديل الواجهة إلى العربية" : "Interface basculée en Français",
    });
  };

  const handleBackup = async () => {
    toast({
      title: "Sauvegarde en cours...",
      description: "Création de la sauvegarde de la base de données",
    });
    try {
      const response = await axios.get(`${API_URL}/backup/export`, {
        responseType: 'blob', // Important for file download
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'database-backup.sqlite');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      const newBackup = {
        date: new Date().toLocaleString(),
        size: 'N/A', // Size will be determined on the server or manually
        status: 'success'
      };
      setBackupHistory(prev => [newBackup, ...prev]);

      toast({
        title: "Sauvegarde terminée",
        description: "Base de données sauvegardée avec succès",
      });
    } catch (err) {
      console.error("Backup failed:", err);
      toast({
        title: "Erreur de sauvegarde",
        description: "Échec de la création de la sauvegarde.",
        variant: "destructive"
      });
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('backup', file);

    toast({
      title: "Restauration en cours...",
      description: "Restauration de la base de données",
    });

    try {
      await axios.post(`${API_URL}/backup/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: "Restauration réussie",
        description: "Base de données restaurée. Redémarrez le serveur pour appliquer les changements.",
      });
    } catch (err) {
      console.error("Restore failed:", err);
      toast({
        title: "Erreur de restauration",
        description: "Échec de la restauration de la base de données.",
        variant: "destructive"
      });
    }
  };

  const handleAccountUpdate = async () => {
    try {
      // Only update username (email is managed by Supabase Auth)
      await updateUserProfile({
        username: settings.username
      });

      // Save to localStorage as backup
      localStorage.setItem('username', settings.username);
      localStorage.setItem('userEmail', settings.email);

      toast({
        title: "Informations sauvegardées",
        description: "Vos informations de compte ont été mises à jour.",
      });
    } catch (err) {
      console.error("Account update failed:", err);
      toast({
        title: "Erreur de mise à jour",
        description: "Échec de la mise à jour de votre compte.",
        variant: "destructive"
      });
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: 'Le fichier est trop volumineux. Taille maximale: 2MB',
        variant: 'destructive'
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier image valide',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setWebsiteSettings(prev => ({ ...prev, logo_data: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleWebsiteSettingsUpdate = async () => {
    try {
      // Check if website_settings exists
      const { data: existing, error: checkError } = await supabase
        .from('website_settings')
        .select('id')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('website_settings')
          .update({
            store_name: websiteSettings.store_name,
            logo_url: websiteSettings.logo_url,
            logo_data: websiteSettings.logo_data,
            slogan: websiteSettings.slogan,
            description: websiteSettings.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('website_settings')
          .insert({
            store_name: websiteSettings.store_name,
            logo_url: websiteSettings.logo_url,
            logo_data: websiteSettings.logo_data,
            slogan: websiteSettings.slogan,
            description: websiteSettings.description
          });

        if (error) throw error;
      }

      // Update localStorage
      localStorage.setItem('storeName', websiteSettings.store_name);
      localStorage.setItem('storeLogoData', websiteSettings.logo_data);

      toast({
        title: 'Succès',
        description: 'Les paramètres du magasin ont été mise à jour.',
      });

      // Reload page to reflect changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error('Error updating website settings:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les paramètres.',
        variant: 'destructive'
      });
    }
  };

  const handlePasswordChange = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (settings.newPassword.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive"
      });
      return;
    }

    try {
      // Assuming a user ID of 1 for the admin user
      await axios.put(`${API_URL}/users/1`, {
        currentPassword: settings.currentPassword,
        newPassword: settings.newPassword,
      });
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès",
      });
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      console.error("Password change failed:", err);
      const errorMessage = err.response?.data?.message || "Échec de la modification du mot de passe.";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleTogglePassword = (key) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  function handleDownloadBackup(date: any): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            ⚙️ {t('settings_title', language)}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'ar'
              ? 'إدارة إعدادات التطبيق والحساب'
              : 'Gérez les paramètres de votre application et compte'}
          </p>
        </motion.div>
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <Button
            variant="outline"
            onClick={handleBackup}
            className="h-11 bg-white hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-blue-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-slate-500 text-blue-700 dark:text-blue-400 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            💾 {language === 'ar' ? 'نسخ احتياطي' : 'Sauvegarde'}
          </Button>
          <Button
            variant="outline"
            className="h-11 bg-white hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-emerald-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-slate-500 text-emerald-700 dark:text-emerald-400 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <label htmlFor="file-upload" className="cursor-pointer flex items-center">
              📁 {language === 'ar' ? 'استعادة' : 'Restaurer'}
            </label>
            <Input id="file-upload" type="file" className="hidden" onChange={handleRestore} />
          </Button>
        </motion.div>

        {fetchError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-400 mb-6"
          >
            ⚠️ {fetchError}
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
              <TabsTrigger
                value="general"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all"
              >
                🌐 {language === 'ar' ? 'عام' : 'Général'}
              </TabsTrigger>
              <TabsTrigger
                value="account"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all"
              >
                👤 {language === 'ar' ? 'الحساب' : 'Compte'}
              </TabsTrigger>
              <TabsTrigger
                value="backup"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all"
              >
                💽 {language === 'ar' ? 'النسخ الاحتياطي' : 'Sauvegarde'}
              </TabsTrigger>
              <TabsTrigger
                value="about"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all"
              >
                ℹ️ {language === 'ar' ? 'حول' : 'À Propos'}
              </TabsTrigger>
            </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Language Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-slate-700 dark:to-slate-700 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  🌐 {language === 'ar' ? 'إعدادات اللغة' : 'Paramètres de Langue'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">
                      {language === 'ar' ? 'لغة الواجهة' : 'Langue de l\'interface'}
                    </Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'ar'
                        ? 'اختر لغة عرض التطبيق'
                        : 'Choisissez la langue d\'affichage de l\'application'}
                    </p>
                  </div>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-full md:w-[200px] h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl hover:border-blue-300 focus:border-blue-500 dark:focus:border-blue-400 transition-colors dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl dark:bg-slate-700">
                      <SelectItem value="fr" className="cursor-pointer dark:text-slate-100">
                        🇫🇷 Français
                      </SelectItem>
                      <SelectItem value="ar" className="cursor-pointer dark:text-slate-100">
                        🇲🇦 العربية
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-slate-700 dark:to-slate-700 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  🔔 {language === 'ar' ? 'إعدادات الإشعارات' : 'Paramètres de Notifications'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      📢 {language === 'ar' ? 'إشعارات النظام' : 'Notifications système'}
                    </Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'ar'
                        ? 'تنبيهات المخزون، المبيعات، إلخ'
                        : 'Alertes de stock, ventes, etc.'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      🔄 {language === 'ar' ? 'النسخ الاحتياطي التلقائي' : 'Sauvegarde automatique'}
                    </Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'ar'
                        ? 'نسخ احتياطي يومي تلقائي'
                        : 'Sauvegarde quotidienne automatique'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-700 dark:to-slate-700 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  👤 {language === 'ar' ? 'معلومات الحساب' : 'Informations du Compte'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      👤 {language === 'ar' ? 'اسم المستخدم' : 'Nom d\'utilisateur'}
                    </Label>
                    <Input
                      id="username"
                      value={settings.username}
                      onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                      className="h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl hover:border-blue-300 focus:border-blue-500 dark:text-slate-100 transition-colors"
                      placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Entrez votre nom d\'utilisateur'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      📧 {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                      className="h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl hover:border-blue-300 focus:border-blue-500 dark:text-slate-100 transition-colors"
                      placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Entrez votre email'}
                    />
                  </div>
                </div>

                {/* Store Logo and Name from website_settings */}
                <div className="space-y-4 mb-6">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                    🏪 {language === 'ar' ? 'شعار وإعدادات المتجر' : 'Logo et Paramètres du Magasin'}
                  </Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="storeName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        🏷️ {language === 'ar' ? 'اسم المتجر' : 'Nom du Magasin'}
                      </Label>
                      <Input
                        id="storeName"
                        value={websiteSettings.store_name}
                        onChange={(e) => setWebsiteSettings(prev => ({ ...prev, store_name: e.target.value }))}
                        className="h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl hover:border-blue-300 focus:border-blue-500 dark:text-slate-100 transition-colors"
                        placeholder={language === 'ar' ? 'أدخل اسم المتجر' : 'Entrez le nom du magasin'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storeLogoFile" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        🖼️ {language === 'ar' ? 'شعار المتجر' : 'Logo du Magasin'}
                      </Label>
                      <Input
                        id="storeLogoFile"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl hover:border-blue-300 focus:border-blue-500 dark:text-slate-100 transition-colors cursor-pointer file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:font-semibold"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        📎 {language === 'ar' ? 'JPG, PNG, GIF. Max: 2MB' : 'JPG, PNG, GIF. Max: 2MB'}
                      </p>
                    </div>
                  </div>

                  {/* Store Logo Preview */}
                  <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-700 rounded-xl border border-blue-100 dark:border-slate-600">
                    {websiteSettings.logo_data ? (
                      <motion.img
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        src={websiteSettings.logo_data}
                        alt="Store Logo"
                        className="w-20 h-20 rounded-xl object-cover shadow-md border-2 border-white"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl border-2 border-white shadow-md">
                        🏪
                      </div>
                    )}
                    <div className="space-y-1 flex-1">
                      <p className="font-bold text-lg text-slate-800 dark:text-slate-100">
                        {websiteSettings.store_name || (language === 'ar' ? 'متجر' : 'Magasin')}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {language === 'ar' ? 'معلومات المتجر الرسمية' : 'Informations officielles du magasin'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handleAccountUpdate}
                    className="h-12 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
                  >
                    💾 {language === 'ar' ? 'حفظ بيانات الحساب' : 'Sauvegarder le Compte'}
                  </Button>
                  <Button
                    onClick={handleWebsiteSettingsUpdate}
                    className="h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
                  >
                    💾 {language === 'ar' ? 'حفظ إعدادات المتجر' : 'Sauvegarder le Magasin'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Password Change */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-slate-700 dark:to-slate-700 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  🔐 {language === 'ar' ? 'تغيير كلمة المرور' : 'Changer le Mot de Passe'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      🔑 {language === 'ar' ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={settings.currentPassword}
                        onChange={(e) => setSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl hover:border-red-300 focus:border-red-500 dark:text-slate-100 transition-colors pr-12"
                        placeholder={language === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Entrez votre mot de passe actuel'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg"
                        onClick={() => handleTogglePassword('current')}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        ✨ {language === 'ar' ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={settings.newPassword}
                          onChange={(e) => setSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl hover:border-red-300 focus:border-red-500 dark:text-slate-100 transition-colors pr-12"
                          placeholder={language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Entrez le nouveau mot de passe'}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg"
                          onClick={() => handleTogglePassword('new')}
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        🔄 {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={settings.confirmPassword}
                          onChange={(e) => setSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl hover:border-red-300 focus:border-red-500 dark:text-slate-100 transition-colors pr-12"
                          placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور الجديدة' : 'Confirmez le nouveau mot de passe'}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg"
                          onClick={() => handleTogglePassword('confirm')}
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    className="h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold w-full"
                  >
                    🔐 {language === 'ar' ? 'تغيير كلمة المرور' : 'Changer le Mot de Passe'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          {/* Backup Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-700 dark:to-slate-700 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  💽 {language === 'ar' ? 'إدارة النسخ الاحتياطية' : 'Gestion des Sauvegardes'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <Card className="border-2 border-emerald-200 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-slate-700 dark:to-slate-700 hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Download className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="font-bold text-lg mb-3 text-slate-800 dark:text-slate-100">
                          {language === 'ar' ? 'إنشاء نسخة احتياطية' : 'Créer une Sauvegarde'}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                          {language === 'ar'
                            ? 'احفظ جميع بياناتك بأمان'
                            : 'Sauvegardez toutes vos données en sécurité'}
                        </p>
                        <Button
                          onClick={handleBackup}
                          className="h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold w-full"
                        >
                          💾 {language === 'ar' ? 'إنشاء نسخة احتياطية' : 'Créer Sauvegarde'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <Card className="border-2 border-amber-200 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-700 dark:to-slate-700 hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Upload className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="font-bold text-lg mb-3 text-slate-800 dark:text-slate-100">
                          {language === 'ar' ? 'استعادة' : 'Restaurer'}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                          {language === 'ar'
                            ? 'استعادة من نسخة احتياطية'
                            : 'Restaurer depuis une sauvegarde'}
                        </p>
                        <Button
                          variant="outline"
                          className="h-12 bg-white hover:bg-amber-50 dark:bg-slate-700 dark:hover:bg-slate-600 border-amber-200 dark:border-slate-600 hover:border-amber-300 dark:hover:border-slate-500 text-amber-700 dark:text-amber-400 rounded-xl shadow-sm hover:shadow-md transition-all font-semibold w-full"
                          onClick={() => document.getElementById('file-upload-restore')?.click()}
                        >
                          📁 {language === 'ar' ? 'اختر ملف' : 'Choisir Fichier'}
                        </Button>
                        <Input
                          id="file-upload-restore"
                          type="file"
                          className="hidden"
                          onChange={handleRestore}
                          accept=".sqlite,.db,.backup"
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
                  <h3 className="font-bold text-xl mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    📚 {language === 'ar' ? 'سجل النسخ الاحتياطية' : 'Historique des Sauvegardes'}
                  </h3>
                  <div className="space-y-4">
                    {backupHistory.length > 0 ? (
                      backupHistory.map((backup, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${backup.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-100">{backup.date}</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">{backup.size}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400"
                              onClick={() => handleDownloadBackup(backup.date)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-400"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          📂
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                          {language === 'ar' ? 'لا توجد نسخ احتياطية' : 'Aucune sauvegarde trouvée.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center space-y-8">
                  {/* Logo and Title */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <span className="text-3xl">🚗</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        🚀 chargers  
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 text-lg">
                        {language === 'ar' ? 'نظام إدارة تجاري شامل' : 'Système de Gestion Commercial'}
                      </p>
                      <Badge variant="outline" className="mt-3 px-4 py-1 text-sm font-semibold bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-slate-700 dark:to-slate-700 border-blue-200 dark:border-slate-600 dark:text-slate-100">
                        📱 {language === 'ar' ? 'الإصدار' : 'Version'} {systemInfo.version}
                      </Badge>
                    </div>
                  </motion.div>

                  <Separator className="my-8 dark:bg-slate-700" />

                  {/* System Info and Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="space-y-4"
                    >
                      <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        💻 {language === 'ar' ? 'معلومات النظام' : 'Informations Système'}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                          <span className="text-slate-600 dark:text-slate-400">🗄️ {language === 'ar' ? 'قاعدة البيانات' : 'Base de données'}:</span>
                          <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">{systemInfo.database}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                          <span className="text-slate-600 dark:text-slate-400">💾 {language === 'ar' ? 'حجم الملف' : 'Taille du fichier'}:</span>
                          <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">{systemInfo.diskSpace}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                          <span className="text-slate-600 dark:text-slate-400">⏱️ {language === 'ar' ? 'وقت التشغيل' : 'Temps de fonctionnement'}:</span>
                          <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300">{systemInfo.uptime}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                          <span className="text-slate-600 dark:text-slate-400">🌐 {language === 'ar' ? 'حالة الشبكة' : 'Statut du réseau'}:</span>
                          <Badge variant={systemInfo.networkStatus === 'connected' ? "default" : "destructive"} className={systemInfo.networkStatus === 'connected' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300' : ''}>
                            {systemInfo.networkStatus === 'connected' ? '✅ Connecté' : '❌ Déconnecté'}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="space-y-4"
                    >
                      <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        📞 {language === 'ar' ? 'معلومات الاتصال' : 'Détails de Contact'}
                      </h3>
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700 rounded-xl">
                          <p className="text-slate-700 dark:text-slate-100 font-semibold">👨‍💻 {language === 'ar' ? 'مطور بواسطة' : 'Développé par'}: Youssef Abdouni</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-700 dark:to-slate-700 rounded-xl">
                          <p className="text-slate-700 dark:text-slate-100">📧 {language === 'ar' ? 'الدعم' : 'Support'}: youssefabdouni44@gmail.com</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-700 dark:to-slate-700 rounded-xl">
                          <p className="text-slate-700 dark:text-slate-100">📱 WhatsApp: 0791366612</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <Separator className="my-8 dark:bg-slate-700" />

                  {/* Features */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="space-y-4"
                  >
                    <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                      ✨ {language === 'ar' ? 'الميزات' : 'Fonctionnalités'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { icon: '📦', text: language === 'ar' ? 'إدارة المخزون' : 'Gestion des stocks' },
                        { icon: '🧾', text: language === 'ar' ? 'الفوترة الكاملة' : 'Facturation complète' },
                        { icon: '📊', text: language === 'ar' ? 'تتبع المبيعات' : 'Suivi des ventes' },
                        { icon: '🚚', text: language === 'ar' ? 'إدارة الموردين' : 'Gestion fournisseurs' },
                        { icon: '📈', text: language === 'ar' ? 'تقارير مفصلة' : 'Rapports détaillés' },
                        { icon: '📱', text: language === 'ar' ? 'رموز الباركود' : 'Codes-barres' },
                        { icon: '💰', text: language === 'ar' ? 'نقطة البيع' : 'Caisse POS' },
                        { icon: '🔒', text: language === 'ar' ? 'نسخ احتياطي آمن' : 'Sauvegarde sécurisée' }
                      ].map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                          className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-xl text-center hover:shadow-md transition-all"
                        >
                          <div className="text-2xl mb-2">{feature.icon}</div>
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{feature.text}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
      </motion.div>
    </motion.div>
  </div>
);
}