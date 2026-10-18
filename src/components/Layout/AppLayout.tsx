import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';
import { findNavItem } from '@/admin/nav';

const DESKTOP_QUERY = '(min-width: 1024px)';
const STORAGE_KEY = 'admin:sidebar';

export const useIsDesktop = () => {
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const on = () => setDesktop(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return desktop;
};

export const AppLayout = () => {
  const isDesktop = useIsDesktop();
  const { isRTL } = useLanguage();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  // Each screen opens at the top instead of keeping the previous screen's scroll position.
  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [location.pathname]);
  // Desktop remembers the user's choice; phones/tablets always start with the menu hidden.
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) return false;
    try { return localStorage.getItem(STORAGE_KEY) !== 'closed'; } catch { return true; }
  });

  useEffect(() => { if (!isDesktop) setSidebarOpen(false); }, [isDesktop]);
  // Opening a screen from the menu closes it on mobile so the screen gets the full width.
  useEffect(() => { if (!isDesktop) setSidebarOpen(false); }, [location.pathname, isDesktop]);
  useEffect(() => {
    if (!isDesktop) return;
    try { localStorage.setItem(STORAGE_KEY, sidebarOpen ? 'open' : 'closed'); } catch { /* ignore */ }
  }, [sidebarOpen, isDesktop]);
  useEffect(() => {
    if (isDesktop || !sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSidebarOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [sidebarOpen, isDesktop]);

  const slideFrom = isRTL ? '100%' : '-100%';

  const pageTitle = findNavItem(location.pathname)?.title || 'Administration';

  return (
    <div className="flex h-dvh bg-background">
      <Helmet>
        <title>{`${pageTitle} · Admin M NEXT`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* Desktop: sidebar pushes content and hides completely when closed */}
      {isDesktop && (
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 248, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="shrink-0 overflow-hidden"
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Mobile / tablet: overlay drawer */}
      {!isDesktop && (
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                key="backdrop"
                className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSidebarOpen(false)}
                aria-hidden
              />
              <motion.div
                key="drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                className={`fixed inset-y-0 z-50 w-[min(84vw,300px)] shadow-elegant ${isRTL ? 'right-0' : 'left-0'}`}
                initial={{ x: slideFrom }}
                animate={{ x: 0 }}
                exit={{ x: slideFrom }}
                transition={{ type: 'spring', stiffness: 420, damping: 40 }}
              >
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} sidebarOpen={sidebarOpen} />
        <main ref={mainRef} className="admin-main custom-scrollbar flex-1 overflow-auto px-3 py-4 sm:px-6 md:py-6">
          {/* Enter-only transition: the new screen replaces the old one at once (no blank gap while the old one
              fades out), then eases in. Only opacity/transform are animated (GPU-cheap, no blur). transitionEnd
              clears the transform so it never becomes the containing block for position:fixed modals. */}
          <motion.div
            key={location.pathname}
            className="mx-auto max-w-[1440px]"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.995 }}
            animate={{
              opacity: 1, y: 0, scale: 1,
              transition: { duration: reduceMotion ? 0.12 : 0.38, ease: [0.16, 1, 0.3, 1] },
              transitionEnd: { transform: 'none' },
            }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
