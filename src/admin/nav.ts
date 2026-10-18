import {
  LayoutDashboard, LineChart, PackageCheck, Receipt, ScanLine, Wallet, UsersRound, Boxes, Globe2, Barcode,
  Truck, Store, UserCog, Settings2, Warehouse, type LucideIcon,
} from 'lucide-react';

export type BadgeKey = 'pendingOrders' | 'lowStock';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: BadgeKey;
  keywords?: string[];
}
export interface NavGroup { label: string; items: NavItem[] }

/** Admin navigation — single source for the sidebar, top-bar titles and the command palette. */
export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Vue d'ensemble",
    items: [
      { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, keywords: ['dashboard', 'accueil', 'stats'] },
      { title: 'Rapports', href: '/reports', icon: LineChart, keywords: ['reports', 'analyse', 'statistiques'] },
    ],
  },
  {
    label: 'Ventes',
    items: [
      { title: 'Commandes', href: '/commands', icon: PackageCheck, badge: 'pendingOrders', keywords: ['orders', 'boutique', 'livraison'] },
      { title: 'Ventes', href: '/sales', icon: Receipt, keywords: ['sales', 'historique'] },
      { title: 'Point de vente', href: '/pos', icon: ScanLine, keywords: ['pos', 'caisse', 'vendre'] },
      { title: 'Caisse', href: '/caisse', icon: Wallet, keywords: ['cash', 'argent', 'encaissement'] },
      { title: 'Clients', href: '/clients', icon: UsersRound, keywords: ['customers', 'clients'] },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { title: 'Chargeurs', href: '/inventory', icon: Boxes, keywords: ['produits', 'inventaire', 'products', 'ajouter'] },
      { title: 'Boutique en ligne', href: '/website', icon: Globe2, keywords: ['site', 'offres', 'packs', 'avis', 'promotions'] },
      { title: 'Codes-barres', href: '/barcodes', icon: Barcode, keywords: ['barcode', 'étiquettes'] },
    ],
  },
  {
    label: 'Stock',
    items: [
      { title: 'Catalogue & stock', href: '/catalogue', icon: Warehouse, badge: 'lowStock', keywords: ['stock', 'mouvements', 'seuil', 'marge', 'vedette', 'images', 'slug'] },
      { title: "Factures d'achat", href: '/purchase-invoices', icon: Truck, keywords: ['achats', 'purchases', 'réapprovisionnement'] },
      { title: 'Fournisseurs', href: '/suppliers', icon: Store, keywords: ['suppliers', 'vendors'] },
    ],
  },
  {
    label: 'Système',
    items: [
      { title: 'Employés', href: '/employees', icon: UserCog, keywords: ['users', 'utilisateurs', 'staff'] },
      { title: 'Paramètres', href: '/settings', icon: Settings2, keywords: ['settings', 'configuration'] },
    ],
  },
];

const ALL = ADMIN_NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));

export const findNavItem = (pathname: string) =>
  ALL.find((i) => pathname === i.href || pathname.startsWith(i.href + '/')) ||
  (pathname.startsWith('/profile') ? { title: 'Mon profil', href: '/profile', group: 'Compte', icon: UserCog } : undefined);
