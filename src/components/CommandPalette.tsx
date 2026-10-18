import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackagePlus, ScanLine, PackageCheck, Boxes, Download } from 'lucide-react';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import { supabase } from '@/lib/supabaseClient';
import { ADMIN_NAV } from '@/admin/nav';
import { formatDA, StatusBadge } from '@/admin/ui';

const OPEN_EVENT = 'admin:command-palette';
/** Opens the palette from anywhere (top-bar search button, shortcuts…). */
export const openCommandPalette = () => window.dispatchEvent(new Event(OPEN_EVENT));

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrderHit { id: string; customer_name: string; customer_phone: string; total_price: number; status: string }
interface ProductHit { id: string; name: string; selling_price: number; quantity_on_hand: number }

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [orders, setOrders] = useState<OrderHit[]>([]);
  const [products, setProducts] = useState<ProductHit[]>([]);

  useEffect(() => { if (!open) setQ(''); }, [open]);

  // Live search: orders by number / phone / name, products by name or model
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setOrders([]); setProducts([]); return; }
    const t = setTimeout(async () => {
      const like = `%${term.replace(/[%_,()]/g, '')}%`;
      const digits = term.replace(/\s/g, '');
      // Order numbers are the first 8 hex chars of the UUID → search them as a UUID range.
      const hex = /^#?[0-9a-f]{4,8}$/i.test(digits) ? digits.replace('#', '').toLowerCase() : '';
      const byNumber = hex
        ? supabase.from('orders').select('id,customer_name,customer_phone,total_price,status')
            .gte('id', `${hex.padEnd(8, '0')}-0000-0000-0000-000000000000`).lte('id', `${hex.padEnd(8, 'f')}-ffff-ffff-ffff-ffffffffffff`).limit(6)
        : Promise.resolve({ data: [] as OrderHit[] });
      const [o, p, n] = await Promise.all([
        supabase.from('orders').select('id,customer_name,customer_phone,total_price,status')
          .or(`customer_name.ilike.${like},customer_phone.ilike.%${digits}%`)
          .order('created_at', { ascending: false }).limit(6),
        supabase.from('products').select('id,name,selling_price,quantity_on_hand').or(`name.ilike.${like},model_number.ilike.${like},barcode.ilike.${like}`).limit(6),
        byNumber,
      ]);
      const merged = [...((n.data as OrderHit[]) || []), ...((o.data as OrderHit[]) || [])];
      setOrders(merged.filter((x, i) => merged.findIndex((y) => y.id === x.id) === i).slice(0, 6));
      setProducts((p.data as ProductHit[]) || []);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const run = (fn: () => void) => { onOpenChange(false); fn(); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher une commande, un téléphone, un produit ou une page…" value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        {orders.length > 0 && (
          <CommandGroup heading="Commandes">
            {orders.map((o) => (
              <CommandItem key={o.id} value={`order ${o.id} ${o.customer_name} ${o.customer_phone}`} onSelect={() => run(() => navigate(`/commands?q=${encodeURIComponent(o.id.slice(0, 8))}`))}>
                <PackageCheck className="mr-2 h-4 w-4" />
                <span className="flex-1 truncate"><span className="font-mono text-xs">#{o.id.slice(0, 8).toUpperCase()}</span> · {o.customer_name} · {o.customer_phone}</span>
                <span className="ml-2 tabular-nums text-xs text-muted-foreground">{formatDA(o.total_price)}</span>
                <span className="ml-2"><StatusBadge status={o.status} /></span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {products.length > 0 && (
          <CommandGroup heading="Produits">
            {products.map((p) => (
              <CommandItem key={p.id} value={`product ${p.name}`} onSelect={() => run(() => navigate(`/inventory?q=${encodeURIComponent(p.name)}`))}>
                <Boxes className="mr-2 h-4 w-4" />
                <span className="flex-1 truncate">{p.name}</span>
                <span className="ml-2 tabular-nums text-xs text-muted-foreground">{formatDA(p.selling_price)} · stock {p.quantity_on_hand ?? 0}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {(orders.length > 0 || products.length > 0) && <CommandSeparator />}

        <CommandGroup heading="Actions rapides">
          <CommandItem onSelect={() => run(() => navigate('/inventory'))}><PackagePlus className="mr-2 h-4 w-4" />Ajouter un produit</CommandItem>
          <CommandItem onSelect={() => run(() => navigate('/pos'))}><ScanLine className="mr-2 h-4 w-4" />Nouvelle vente (caisse)</CommandItem>
          <CommandItem onSelect={() => run(() => navigate('/commands'))}><PackageCheck className="mr-2 h-4 w-4" />Commandes à confirmer</CommandItem>
          <CommandItem onSelect={() => run(() => navigate('/reports'))}><Download className="mr-2 h-4 w-4" />Exporter un rapport</CommandItem>
        </CommandGroup>
        {ADMIN_NAV.map((g) => (
          <CommandGroup key={g.label} heading={g.label}>
            {g.items.map((i) => (
              <CommandItem key={i.href} value={`${i.title} ${(i.keywords || []).join(' ')}`} onSelect={() => run(() => navigate(i.href))}>
                <i.icon className="mr-2 h-4 w-4" />{i.title}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const openEvt = () => setOpen(true);
    document.addEventListener('keydown', down);
    window.addEventListener(OPEN_EVENT, openEvt);
    return () => { document.removeEventListener('keydown', down); window.removeEventListener(OPEN_EVENT, openEvt); };
  }, []);

  return { open, setOpen };
}
