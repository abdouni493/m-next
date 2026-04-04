import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, ShoppingCart, LogIn, Globe, LogOut, Moon, Sun } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getWebsiteSettingsREST } from '@/lib/supabaseClient';

interface WebsiteSettings {
  store_name?: string;
  slogan?: string;
  logo_url?: string;
  description?: string;
  phone_number?: string;
}

export const WebsiteLayout = () => {
  const { language, isRTL } = useLanguage();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getWebsiteSettingsREST();
        if (data) {
          setSettings(data);
        } else {
          // Fallback to default settings if database is unavailable
          setSettings({
            store_name: 'Chargeur Store',
            slogan: 'Quality Chargers at Best Prices',
            logo_url: '',
            description: 'Welcome to our online store'
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        // Set default settings on error
        setSettings({
          store_name: 'Chargeur Store',
          slogan: 'Quality Chargers at Best Prices',
          logo_url: '',
          description: 'Welcome to our online store'
        });
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    // Update cart count from localStorage
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    };

    updateCartCount();

    // Listen for storage changes
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  // Also add a custom event listener for cart updates from the same tab
  useEffect(() => {
    const handleCartUpdate = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const navItems = [
    { label: language === 'ar' ? 'الرئيسية' : 'Accueil', href: '/website-shop' },
    { label: language === 'ar' ? 'العروض' : 'Offres', href: '/website-shop/offers' },
    { label: language === 'ar' ? 'عروض خاصة' : 'Offres Spéciales', href: '/website-shop/special-offers' },
    { label: language === 'ar' ? 'جهات الاتصال' : 'Contacts', href: '/website-shop/contacts' },
    { label: language === 'ar' ? '📦 طلب' : '📦 Commande', href: '/website-shop/order' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b-2 border-blue-200 dark:border-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Store Name */}
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border-2 border-blue-200 bg-white flex items-center justify-center">
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Globe className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div className={isRTL ? 'text-right' : ''}>
                <h1 className="font-bold text-xl text-slate-900 dark:text-white">
                  {settings?.store_name || 'Charger Shop'}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {settings?.slogan || 'Best Chargers'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-bold transition-all ${
                    location.pathname === item.href
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                      : 'text-slate-700 dark:text-slate-300 hover:text-blue-600'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Right Section */}
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsDarkMode(!isDarkMode);
                  document.documentElement.classList.toggle('dark');
                  localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
                }}
                className="hover:bg-blue-100 dark:hover:bg-slate-700"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-blue-600" />
                )}
              </Button>

              {/* Shopping Cart */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/website-shop/order')}
                className="relative hover:bg-blue-100 dark:hover:bg-slate-700"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Button>

              {/* Auth Button */}
              {isAuthenticated ? (
                <Button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold hidden md:flex"
                  size="sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'خروج' : 'Déconnexion'}
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold hidden md:flex"
                  size="sm"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'دخول' : 'Connexion'}
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t-2 border-blue-200 dark:border-blue-700 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              
              {/* Mobile Auth Button */}
              <div className="px-4 py-2 pt-4 border-t-2 border-blue-200 dark:border-blue-700">
                {isAuthenticated ? (
                  <Button
                    onClick={() => {
                      logout();
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold"
                    size="sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'خروج' : 'Déconnexion'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold"
                    size="sm"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'دخول' : 'Connexion'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-900 to-purple-900 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About */}
            <div>
              <h3 className="font-bold text-lg mb-4">
                {language === 'ar' ? 'حول المتجر' : 'À propos'}
              </h3>
              <p className="text-blue-100">
                {settings?.description || 'Your best charger store'}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-4">
                {language === 'ar' ? 'روابط سريعة' : 'Liens Rapides'}
              </h3>
              <ul className="space-y-2 text-blue-100">
                <li><a href="/website-shop" className="hover:text-white transition">{language === 'ar' ? 'الرئيسية' : 'Accueil'}</a></li>
                <li><a href="/website-shop/offers" className="hover:text-white transition">{language === 'ar' ? 'العروض' : 'Offres'}</a></li>
                <li><a href="/website-shop/contacts" className="hover:text-white transition">{language === 'ar' ? 'جهات الاتصال' : 'Contacts'}</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-lg mb-4">
                {language === 'ar' ? 'جهات الاتصال' : 'Contact'}
              </h3>
              <p className="text-blue-100">
                {settings?.phone_number || 'Not available'}
              </p>
            </div>
          </div>

          <div className="border-t border-blue-700 pt-8 text-center text-blue-100">
            <p>&copy; 2026 {settings?.store_name || 'Charger Shop'}. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'Tous droits réservés'}.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebsiteLayout;
