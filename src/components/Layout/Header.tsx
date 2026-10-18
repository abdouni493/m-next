import { useEffect, useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Moon, 
  Sun,
  User,
  LogOut,
  Settings,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  Crown,
  UserRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getWebsiteSettingsREST } from '@/lib/supabaseClient';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export const Header = ({ onMenuClick, sidebarOpen }: HeaderProps) => {
  const { t, isRTL, language } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [storeDisplayName, setStoreDisplayName] = useState('chargers');
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getWebsiteSettingsREST();
        if (settings) {
          if (settings.store_name) {
            setStoreDisplayName(settings.store_name);
          }
          if (settings.logo_url) {
            setStoreLogoUrl(settings.logo_url);
          }
        }
      } catch (error) {
        console.error('Error fetching website settings:', error);
        // Fallback to localStorage
        const savedName = localStorage.getItem('storeDisplayName');
        const savedLogo = localStorage.getItem('storeLogoData');

        if (savedName) setStoreDisplayName(savedName);
        if (savedLogo) setStoreLogoUrl(savedLogo);
      }
    };

    fetchSettings();
  }, []);

  const { logout, user } = useAuth();          // ✅ get logout and user from context
  const navigate = useNavigate();        // ✅ use navigation

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();                 // ✅ clear auth state
    navigate("/login");       // ✅ go to login page
  };

  // Get user initials for avatar
  const userInitials = (user?.name || user?.username || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:px-6">
        {/* Left Section */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="rounded-xl hover:bg-accent"
            aria-label={sidebarOpen ? 'Masquer le menu' : 'Afficher le menu'}
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-5 h-5 lg:hidden" />
            <span className="hidden lg:inline-flex">{sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}</span>
          </Button>

          <div className="hidden sm:flex items-center gap-2">
            {storeLogoUrl ? (
              <img src={storeLogoUrl} alt="Logo magasin" className="w-8 h-8 rounded-lg object-cover ring-1 ring-border" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" fill="currentColor" />
              </div>
            )}
            <span className="font-display text-sm font-semibold text-foreground">{storeDisplayName}</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-xl hover:bg-accent" aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-5 h-5 text-primary transition-transform duration-300 hover:-rotate-12" />
            )}
          </Button>

          {/* Notifications + User Menu */}
          <div className="flex items-center gap-2">
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 rounded-xl pl-2 pr-3 hover:bg-accent">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-primary">
                    {userInitials}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{user?.name || user?.username || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : user?.role === 'employee' ? 'Employee' : 'User'}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56 shadow-elegant">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{user?.name || user?.username || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => window.location.href = '/settings'}
                >
                  <User className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'الملف الشخصي' : 'Profil'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => window.location.href = '/settings'}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t('nav.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive cursor-pointer"
                  onClick={handleLogout}   // ✅ FIXED logout
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('user.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
