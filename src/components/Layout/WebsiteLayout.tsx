import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Menu, X, ShoppingCart, LogIn, LogOut, Sun, Moon, Zap, Facebook, Instagram, MessageCircle, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getWebsiteSettingsREST } from '@/lib/supabaseClient';

interface WebsiteSettings {
  store_name?: string;
  slogan?: string;
  logo_url?: string;
  description?: string;
  phone_number?: string;
  facebook_url?: string;
  instagram_url?: string;
  whatsapp_number?: string;
}

export const WebsiteLayout = () => {
  const { language, isRTL } = useLanguage();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [cartCount, setCartCount] = useState(0);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ['rgba(2,8,23,0)', 'rgba(2,8,23,0.97)']);
  const navBorderOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getWebsiteSettingsREST();
        setSettings(data || {
          store_name: 'Chargeur Store',
          slogan: 'Quality Chargers at Best Prices',
        });
      } catch {
        setSettings({ store_name: 'Chargeur Store', slogan: 'Quality Chargers at Best Prices' });
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const update = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    };
    update();
    window.addEventListener('storage', update);
    window.addEventListener('cartUpdated', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('cartUpdated', update);
    };
  }, []);

  const navItems = [
    { label: language === 'ar' ? '🏠 الرئيسية' : '🏠 Accueil', href: '/website-shop' },
    { label: language === 'ar' ? '🛍️ متجر' : '🛍️ Boutique', href: '/website-shop/offers' },
    { label: language === 'ar' ? '🔥 عروض' : '🔥 Spéciales', href: '/website-shop/special-offers' },
    { label: language === 'ar' ? '📦 حزم' : '📦 Packs', href: '/website-shop/packages' },
    { label: language === 'ar' ? '📞 تواصل' : '📞 Contacts', href: '/website-shop/contacts' },
    { label: language === 'ar' ? '🛒 طلب' : '🛒 Commande', href: '/website-shop/order' },
  ];

  const isActive = (href: string) =>
    href === '/website-shop'
      ? location.pathname === href
      : location.pathname.startsWith(href);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#020817', color: '#F1F5F9' }}>

      {/* Animated top gradient bar */}
      <div className="gradient-bar fixed top-0 left-0 right-0 z-[60]" />

      {/* Navbar */}
      <motion.nav
        style={{ backgroundColor: navBg }}
        className="fixed top-[3px] left-0 right-0 z-50 backdrop-blur-xl"
      >
        <motion.div
          style={{ opacity: navBorderOpacity }}
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'rgba(0,212,255,0.2)' } as any}
        />

        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>

            {/* Logo */}
            <motion.div
              className={`flex items-center gap-3 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
              onClick={() => navigate('/website-shop')}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative w-11 h-11">
                <div
                  className="w-11 h-11 hex-clip flex items-center justify-center overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))', border: '1px solid rgba(0,212,255,0.3)' }}
                >
                  {settings?.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Zap className="w-5 h-5" style={{ color: '#00D4FF' }} />
                  )}
                </div>
                {/* Rotating glow ring */}
                <div
                  className="absolute inset-0 rounded-full animate-spin"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 70%, rgba(0,212,255,0.6) 100%)',
                    animationDuration: '3s',
                  }}
                />
              </div>
              <div className={isRTL ? 'text-right' : ''}>
                <h1
                  className="font-grotesk font-bold text-lg leading-tight bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, #00D4FF, #7C3AED)' }}
                >
                  {settings?.store_name || 'Charger Shop'}
                </h1>
                <p className="text-xs font-medium" style={{ color: '#64748B' }}>
                  {settings?.slogan || 'Best Chargers'}
                </p>
              </div>
            </motion.div>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  custom={i}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, type: 'spring' }}
                  className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    color: isActive(item.href) ? '#00D4FF' : '#94A3B8',
                    background: isActive(item.href) ? 'rgba(0,212,255,0.08)' : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!isActive(item.href)) (e.currentTarget as HTMLElement).style.color = '#F1F5F9';
                  }}
                  onMouseLeave={e => {
                    if (!isActive(item.href)) (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                  }}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: '#00D4FF', boxShadow: '0 0 6px #00D4FF' }}
                    />
                  )}
                </motion.a>
              ))}
            </div>

            {/* Right controls */}
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* Dark mode toggle */}
              <button
                onClick={() => {
                  setIsDarkMode(!isDarkMode);
                  document.documentElement.classList.toggle('dark');
                  localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
                }}
                className="p-2 rounded-lg transition-all duration-200"
                style={{ color: '#64748B' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#00D4FF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Cart */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/website-shop/order')}
                className="relative p-2 rounded-lg"
                style={{ color: '#00D4FF' }}
              >
                <ShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key="cart-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white animate-pulse"
                      style={{ background: 'linear-gradient(135deg, #EF4444, #FF6B35)' }}
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Auth — desktop only */}
              {isAuthenticated ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { logout(); navigate('/login'); }}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <LogOut className="w-4 h-4" />
                  {language === 'ar' ? 'خروج' : 'Déconnexion'}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/login')}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)' }}
                >
                  <LogIn className="w-4 h-4" />
                  {language === 'ar' ? 'دخول' : 'Connexion'}
                </motion.button>
              )}

              {/* Hamburger */}
              <button
                className="lg:hidden p-2 rounded-lg"
                style={{ color: '#94A3B8' }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-72 z-50 flex flex-col lg:hidden"
              style={{ background: '#0F172A', borderRight: '1px solid rgba(0,212,255,0.15)' }}
            >
              <div className="gradient-bar" />
              <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
                <span className="font-grotesk font-bold text-lg bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #00D4FF, #7C3AED)' }}>
                  {settings?.store_name || 'Menu'}
                </span>
                <button onClick={() => setMobileMenuOpen(false)} style={{ color: '#64748B' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item, i) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      color: isActive(item.href) ? '#00D4FF' : '#94A3B8',
                      background: isActive(item.href) ? 'rgba(0,212,255,0.08)' : 'transparent',
                      borderLeft: isActive(item.href) ? '2px solid #00D4FF' : '2px solid transparent',
                    }}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </nav>
              <div className="p-4" style={{ borderTop: '1px solid rgba(0,212,255,0.1)' }}>
                {isAuthenticated ? (
                  <button
                    onClick={() => { logout(); navigate('/login'); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    <LogOut className="w-4 h-4" />
                    {language === 'ar' ? 'خروج' : 'Déconnexion'}
                  </button>
                ) : (
                  <button
                    onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)' }}
                  >
                    <LogIn className="w-4 h-4" />
                    {language === 'ar' ? 'دخول' : 'Connexion'}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 pt-[3px]" style={{ paddingTop: '67px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer style={{ background: '#020817', borderTop: '1px solid rgba(0,212,255,0.15)' }} className="mt-16">
        <div className="gradient-bar" />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

            {/* About */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5" style={{ color: '#00D4FF' }} />
                <h3 className="font-grotesk font-bold text-lg" style={{ color: '#F1F5F9' }}>
                  {settings?.store_name || 'Charger Shop'}
                </h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                {settings?.slogan || 'Quality Chargers at Best Prices'}
              </p>
              <div className="flex gap-3 mt-5">
                {settings?.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{ background: 'rgba(30,42,95,0.6)', border: '1px solid rgba(0,212,255,0.15)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(59,130,246,0.5)'; (e.currentTarget as HTMLElement).style.borderColor = '#3B82F6'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.15)'; }}
                  >
                    <Facebook className="w-4 h-4" style={{ color: '#3B82F6' }} />
                  </a>
                )}
                {settings?.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{ background: 'rgba(30,42,95,0.6)', border: '1px solid rgba(0,212,255,0.15)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(236,72,153,0.5)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                  >
                    <Instagram className="w-4 h-4" style={{ color: '#EC4899' }} />
                  </a>
                )}
                {settings?.whatsapp_number && (
                  <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{ background: 'rgba(30,42,95,0.6)', border: '1px solid rgba(0,212,255,0.15)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(37,211,102,0.5)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                  >
                    <MessageCircle className="w-4 h-4" style={{ color: '#25D366' }} />
                  </a>
                )}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="font-grotesk font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#00D4FF' }}>
                {language === 'ar' ? 'روابط سريعة' : 'Liens Rapides'}
              </h3>
              <ul className="space-y-2">
                {navItems.map(item => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="text-sm transition-colors duration-200 flex items-center gap-2"
                      style={{ color: '#64748B' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#00D4FF')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                    >
                      <span style={{ color: '#1E3A5F' }}>›</span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-grotesk font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#00D4FF' }}>
                {language === 'ar' ? 'تواصل معنا' : 'Contact'}
              </h3>
              {settings?.phone_number && (
                <a
                  href={`tel:${settings.phone_number}`}
                  className="flex items-center gap-2 text-sm mb-3 transition-colors"
                  style={{ color: '#64748B' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#00D4FF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                >
                  <Phone className="w-4 h-4" />
                  {settings.phone_number}
                </a>
              )}
              {settings?.whatsapp_number && (
                <a
                  href={`https://wa.me/${settings.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm transition-colors"
                  style={{ color: '#64748B' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#25D366')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px mb-6" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)' }} />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{ color: '#64748B' }}>
              © 2026 {settings?.store_name || 'Charger Shop'}.{' '}
              {language === 'ar' ? 'جميع الحقوق محفوظة' : 'Tous droits réservés'}.
            </p>
            <div className="flex items-center gap-1 text-xs" style={{ color: '#64748B' }}>
              <Zap className="w-3 h-3" style={{ color: '#00D4FF' }} />
              <span>Powered by Electric ⚡</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebsiteLayout;
