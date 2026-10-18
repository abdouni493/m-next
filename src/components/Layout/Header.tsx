import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Moon, Sun, User, LogOut, Settings, PanelLeftClose, PanelLeftOpen, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { findNavItem } from '@/admin/nav';
import { openCommandPalette } from '@/components/CommandPalette';
import { NotificationCenter } from './NotificationCenter';
import { toggleTheme } from '@/lib/theme';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export const Header = ({ onMenuClick, sidebarOpen }: HeaderProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const current = findNavItem(pathname);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = (user?.name || user?.username || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="shrink-0 rounded-[10px]"
          aria-label={sidebarOpen ? 'Masquer le menu' : 'Afficher le menu'} aria-expanded={sidebarOpen}>
          <Menu className="h-5 w-5 lg:hidden" />
          <span className="hidden lg:inline-flex">{sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}</span>
        </Button>

        <div className="min-w-0 flex-1">
          {current && (
            <nav aria-label="Fil d'Ariane" className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
              <Link to="/dashboard" className="hover:text-foreground">Admin</Link>
              <ChevronRight className="h-3 w-3" />
              <span>{current.group}</span>
            </nav>
          )}
          <p className="truncate font-sora text-base font-semibold leading-tight sm:text-lg">{current?.title || 'Administration'}</p>
        </div>

        <button onClick={openCommandPalette}
          className="hidden h-10 w-64 items-center gap-2 rounded-[10px] border border-input bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30 md:flex lg:w-80"
          aria-label="Rechercher (commandes, produits, pages)">
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Commande, téléphone, produit…</span>
          <kbd className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button variant="ghost" size="icon" className="rounded-[10px] md:hidden" onClick={openCommandPalette} aria-label="Rechercher"><Search className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="rounded-[10px]" onClick={() => setIsDarkMode(toggleTheme())} aria-label={isDarkMode ? 'Mode clair' : 'Mode sombre'}>
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <NotificationCenter />
          <Button variant="ghost" size="icon" className="hidden rounded-[10px] sm:inline-flex" asChild>
            <a href="/website-shop" target="_blank" rel="noopener noreferrer" aria-label="Voir la boutique" title="Voir la boutique"><ExternalLink className="h-5 w-5" /></a>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ms-1 flex h-10 items-center gap-2 rounded-[10px] px-1.5 hover:bg-accent" aria-label="Menu utilisateur">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">{initials}</span>
                <span className="hidden text-left lg:block">
                  <span className="block max-w-[140px] truncate text-sm font-medium leading-tight">{user?.name || 'Utilisateur'}</span>
                  <span className="block text-[11px] text-muted-foreground">{user?.role === 'manager' ? 'Gérant' : 'Administrateur'}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}><User className="mr-2 h-4 w-4" />Mon profil</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}><Settings className="mr-2 h-4 w-4" />Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Se déconnecter</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
