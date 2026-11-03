// Worker permissions: which interfaces (sidebar pages) and which button actions a worker can see.
import { createContext, useContext } from 'react';
import {
  LayoutDashboard, ScanLine, Receipt, Wallet, UsersRound, Store, Barcode, PackageCheck, Settings2, type LucideIcon,
} from 'lucide-react';

export interface PermAction { key: string; label: string }
export interface PermInterface {
  key: string; label: string; href: string; icon: LucideIcon; actions: PermAction[];
}

/** Every interface a worker can be given, with the button actions it contains. */
export const WORKER_INTERFACES: PermInterface[] = [
  { key: 'dashboard', label: 'Tableau de bord', href: '/employee', icon: LayoutDashboard, actions: [
    { key: 'quick_actions', label: 'Raccourcis (actions rapides)' },
  ] },
  { key: 'pos', label: 'Point de vente', href: '/employee/pos', icon: ScanLine, actions: [
    { key: 'add_client', label: 'Nouveau client' },
    { key: 'checkout', label: 'Encaisser / valider la vente' },
  ] },
  { key: 'sales', label: 'Ventes', href: '/employee/sales', icon: Receipt, actions: [
    { key: 'import', label: 'Importer' },
    { key: 'export', label: 'Exporter' },
    { key: 'view', label: 'Voir les détails' },
    { key: 'edit', label: 'Modifier' },
    { key: 'pay', label: 'Payer la dette' },
    { key: 'print', label: 'Imprimer' },
    { key: 'delete', label: 'Supprimer' },
  ] },
  { key: 'caisse', label: 'Caisse', href: '/employee/caisse', icon: Wallet, actions: [
    { key: 'add', label: 'Ajouter une transaction' },
    { key: 'edit', label: 'Modifier' },
    { key: 'delete', label: 'Supprimer' },
  ] },
  { key: 'clients', label: 'Clients', href: '/employee/clients', icon: UsersRound, actions: [
    { key: 'add', label: 'Ajouter un client' },
    { key: 'history', label: 'Historique' },
    { key: 'edit', label: 'Modifier' },
    { key: 'delete', label: 'Supprimer' },
  ] },
  { key: 'commands', label: 'Commandes', href: '/employee/commands', icon: PackageCheck, actions: [
    { key: 'view', label: 'Détails' },
    { key: 'status', label: 'Changer le statut / Annuler' },
    { key: 'print', label: 'Bon de livraison' },
  ] },
  { key: 'suppliers', label: 'Fournisseurs', href: '/employee/suppliers', icon: Store, actions: [
    { key: 'add', label: 'Ajouter un fournisseur' },
    { key: 'history', label: 'Historique' },
    { key: 'edit', label: 'Modifier' },
    { key: 'delete', label: 'Supprimer' },
  ] },
  { key: 'barcodes', label: 'Codes-barres', href: '/employee/barcodes', icon: Barcode, actions: [
    { key: 'print', label: 'Imprimer' },
  ] },
  { key: 'settings', label: 'Paramètres', href: '/employee/workersettings', icon: Settings2, actions: [] },
];

/** { interfaceKey: [allowed action keys] } — an interface absent from the map is hidden. */
export type WorkerPermissions = Record<string, string[]>;

/** Used when no permissions were ever saved for a worker (keeps the previous behaviour). */
export const DEFAULT_PERMISSIONS: WorkerPermissions = {
  dashboard: ['quick_actions'],
  pos: ['add_client', 'checkout'],
  sales: ['view', 'print', 'pay'],
  settings: [],
};

export const fullPermissions = (): WorkerPermissions =>
  Object.fromEntries(WORKER_INTERFACES.map((i) => [i.key, i.actions.map((a) => a.key)]));

export const normalizePermissions = (raw: unknown): WorkerPermissions => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...DEFAULT_PERMISSIONS };
  const out: WorkerPermissions = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(v)) out[k] = v.filter((x): x is string => typeof x === 'string');
  }
  return out;
};

/** null = full access (admin / manager). */
export const PermissionsContext = createContext<WorkerPermissions | null>(null);

export const canAccess = (p: WorkerPermissions | null, iface: string) => !p || iface in p;
export const canDo = (p: WorkerPermissions | null, iface: string, action: string) =>
  !p || (iface in p && p[iface].includes(action));

export const usePermissions = () => useContext(PermissionsContext);
/** Returns a checker for the button actions of one interface. Always true outside the worker space. */
export const useCan = (iface: string) => {
  const p = usePermissions();
  return (action: string) => canDo(p, iface, action);
};
