import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Package, Star, Eye, EyeOff, ImagePlus, ArrowUp, ArrowDown, Trash2, X, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabaseClient';
import { uploadImages } from '@/lib/imageUpload';
import { PageHeader, DataTable, FilterBar, StockBadge, EmptyState, formatDA, MoneyText, type Column } from '@/admin/ui';
import { lowStockOf } from '@/admin/alerts';
import { brandOf } from '@/admin/dashboard/data';

interface Product {
  id: string; name: string; primary_image?: string | null; selling_price?: number | null; purchase_price?: number | null; cost_price?: number | null;
  quantity_on_hand?: number | null; quantity_minimal?: number | null; reorder_level?: number | null; voltage?: number | null; amperage?: number | null;
  wattage?: number | null; is_active?: boolean; marks?: { name?: string } | null; connector_types?: { name?: string } | null;
  slug?: string | null; old_price?: number | null; featured?: boolean | null; compatible_models?: string[] | null;
}
interface Movement { id: string; product_id: string; change: number; quantity_after: number; kind: string; note?: string; created_at: string; products?: { name: string } | null }

const n = (v: unknown) => Number(v) || 0;
const cost = (p: Product) => n(p.purchase_price) || n(p.cost_price);
const margin = (p: Product) => (n(p.selling_price) > 0 && cost(p) > 0 ? ((n(p.selling_price) - cost(p)) / n(p.selling_price)) * 100 : null);
const slugify = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

export default function Catalogue() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'products' | 'movements'>('products');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['catalogue'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*, marks(name), connector_types(name)').order('name');
      if (error) throw error;
      const rows = (data || []) as Product[];
      return { rows, hasWebFields: rows.length === 0 || 'featured' in rows[0] };
    },
  });
  const products = data?.rows || [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? products.filter((p) => [p.name, brandOf(p), p.connector_types?.name, ...(p.compatible_models || [])].some((v) => String(v || '').toLowerCase().includes(q))) : products;
  }, [products, search]);
  const stockValue = products.reduce((s, p) => s + Math.max(0, n(p.quantity_on_hand)) * cost(p), 0);

  const patch = async (p: Product, values: Partial<Product>, msg?: string) => {
    const { error } = await supabase.from('products').update(values).eq('id', p.id);
    if (error) { toast.error(error.message.includes('column') ? 'Colonne manquante : exécutez supabase_admin_fields.sql' : "La mise à jour a échoué."); return false; }
    if (msg) toast.success(msg);
    qc.invalidateQueries({ queryKey: ['catalogue'] });
    qc.invalidateQueries({ queryKey: ['admin-alerts'] });
    return true;
  };

  const columns: Column<Product>[] = [
    {
      key: 'name', header: 'Produit', sortValue: (p) => p.name.toLowerCase(), csv: (p) => p.name,
      cell: (p) => (
        <span className="flex items-center gap-3">
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-2">{p.primary_image ? <img src={p.primary_image} alt="" className="h-full w-full object-contain" loading="lazy" /> : <Package className="m-3 h-4 w-4 text-muted-foreground" />}</span>
          <span className="min-w-0"><span className="block max-w-[260px] truncate font-medium">{p.name}</span><span className="text-xs text-muted-foreground">{brandOf(p)}{p.connector_types?.name ? ` · ${p.connector_types.name}` : ''}</span></span>
        </span>
      ),
    },
    { key: 'specs', header: 'V / A / W', hideOnMobile: true, cell: (p) => <span className="whitespace-nowrap tabular-nums text-muted-foreground">{[p.voltage && `${p.voltage}V`, p.amperage && `${p.amperage}A`, p.wattage && `${p.wattage}W`].filter(Boolean).join(' · ') || '—'}</span>, sortValue: (p) => n(p.wattage), csv: (p) => `${p.voltage || ''}V ${p.amperage || ''}A ${p.wattage || ''}W` },
    { key: 'price', header: 'Prix', className: 'text-right', cell: (p) => n(p.selling_price) > 0 ? <MoneyText value={p.selling_price} className="font-semibold" /> : <span className="text-xs font-medium text-warning">Sur demande</span>, sortValue: (p) => n(p.selling_price), csv: (p) => n(p.selling_price) },
    { key: 'cost', header: "Prix d'achat", className: 'text-right', hideOnMobile: true, cell: (p) => cost(p) ? <MoneyText value={cost(p)} className="text-muted-foreground" /> : <span className="text-muted-foreground">—</span>, sortValue: cost, csv: cost },
    { key: 'margin', header: 'Marge', className: 'text-right', cell: (p) => { const m = margin(p); return m === null ? <span className="text-muted-foreground">—</span> : <span className={cn('font-medium tabular-nums', m < 15 ? 'text-destructive' : m < 30 ? 'text-warning' : 'text-success')}>{m.toFixed(0)}%</span>; }, sortValue: (p) => margin(p) ?? -1, csv: (p) => margin(p)?.toFixed(1) ?? '' },
    { key: 'stock', header: 'Stock', cell: (p) => <span className="flex items-center gap-2"><span className="tabular-nums">{n(p.quantity_on_hand)}</span><StockBadge qty={n(p.quantity_on_hand)} threshold={lowStockOf(p) || n(p.quantity_minimal)} /></span>, sortValue: (p) => n(p.quantity_on_hand), csv: (p) => n(p.quantity_on_hand) },
    {
      key: 'published', header: 'En ligne', csv: (p) => (p.is_active ? 'oui' : 'non'),
      cell: (p) => <span onClick={(e) => e.stopPropagation()}><Switch checked={!!p.is_active} onCheckedChange={(v) => patch(p, { is_active: v }, v ? 'Produit publié' : 'Produit masqué')} aria-label="Publié sur la boutique" /></span>,
    },
    {
      key: 'featured', header: 'Vedette', csv: (p) => (p.featured ? 'oui' : 'non'),
      cell: (p) => (
        <button onClick={(e) => { e.stopPropagation(); patch(p, { featured: !p.featured }); }} disabled={!data?.hasWebFields}
          className={cn('rounded-lg p-1.5 disabled:opacity-40', p.featured ? 'text-warning' : 'text-muted-foreground hover:text-foreground')} aria-label={p.featured ? 'Retirer de la sélection' : 'Mettre en avant'} aria-pressed={!!p.featured}>
          <Star className={cn('h-4 w-4', p.featured && 'fill-current')} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Catalogue & stock" description="Fiches boutique, prix, marges, seuils d'alerte et mouvements de stock."
        actions={<div className="rounded-xl border border-border bg-card px-3 py-2 text-sm">Valeur du stock : <MoneyText value={stockValue} className="font-semibold" /></div>} />

      {data && !data.hasWebFields && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>Les champs boutique (slug, prix barré, vedette, modèles compatibles) n'existent pas encore. Exécutez <code className="rounded bg-card px-1">supabase_admin_fields.sql</code> dans Supabase pour les activer.</span>
        </div>
      )}

      <div className="mb-4 inline-flex rounded-[12px] border border-border bg-card p-1" role="tablist">
        {([['products', 'Produits'], ['movements', 'Mouvements de stock']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn('h-9 rounded-[8px] px-3 text-sm font-medium', tab === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>{l}</button>
        ))}
      </div>

      {tab === 'products' ? (
        <>
          <FilterBar search={search} onSearch={setSearch} placeholder="Nom, marque, connecteur, modèle compatible…" />
          <DataTable<Product> rows={filtered} columns={columns} loading={isLoading} onRowClick={setEditing} csvName="catalogue" pageSize={25}
            mobileTitle={(p) => p.name} empty={<EmptyState icon={Package} title="Aucun produit" />} />
        </>
      ) : <Movements />}

      <ProductDrawer product={editing} webFields={!!data?.hasWebFields} onClose={() => setEditing(null)} onSave={patch} />
    </div>
  );
}

function Movements() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stock_movements').select('*, products(name)').order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      return (data || []) as Movement[];
    },
    retry: false,
  });
  if (error) return <EmptyState icon={Info} title="Journal des mouvements non activé" text="Exécutez supabase_admin_fields.sql : chaque entrée/sortie de stock sera ensuite enregistrée automatiquement (qui, quand, combien)." />;
  const cols: Column<Movement>[] = [
    { key: 'date', header: 'Date', cell: (m) => <span className="whitespace-nowrap tabular-nums text-muted-foreground">{format(new Date(m.created_at), 'dd/MM/yyyy HH:mm')}</span>, sortValue: (m) => m.created_at, csv: (m) => m.created_at },
    { key: 'product', header: 'Produit', cell: (m) => <span className="font-medium">{m.products?.name || '—'}</span>, csv: (m) => m.products?.name || '' },
    { key: 'change', header: 'Mouvement', cell: (m) => <span className={cn('inline-flex items-center gap-1 font-semibold tabular-nums', m.change > 0 ? 'text-success' : 'text-destructive')}>{m.change > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}{m.change > 0 ? '+' : ''}{m.change}</span>, sortValue: (m) => m.change, csv: (m) => m.change },
    { key: 'after', header: 'Stock après', cell: (m) => <span className="tabular-nums">{m.quantity_after}</span>, csv: (m) => m.quantity_after },
    { key: 'kind', header: 'Type', cell: (m) => (m.kind === 'in' ? 'Entrée' : m.kind === 'out' ? 'Sortie' : 'Ajustement'), csv: (m) => m.kind },
  ];
  return <DataTable rows={data || []} columns={cols} loading={isLoading} csvName="mouvements-stock" empty={<EmptyState title="Aucun mouvement enregistré" text="Les prochaines modifications de stock apparaîtront ici." />} />;
}

function ProductDrawer({ product, webFields, onClose, onSave }: { product: Product | null; webFields: boolean; onClose: () => void; onSave: (p: Product, v: Partial<Product>, msg?: string) => Promise<boolean> }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ selling_price: '', purchase_price: '', old_price: '', quantity_minimal: '', slug: '', featured: false, compatible_models: [] as string[] });
  const [tag, setTag] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!product) return;
    setForm({
      selling_price: String(product.selling_price ?? ''), purchase_price: String(product.purchase_price ?? ''), old_price: String(product.old_price ?? ''),
      quantity_minimal: String(product.quantity_minimal ?? ''), slug: product.slug || '', featured: !!product.featured, compatible_models: product.compatible_models || [],
    });
    setDirty(false); setTag('');
  }, [product]);

  const { data: images = [], refetch: refetchImages } = useQuery({
    queryKey: ['product-images', product?.id],
    enabled: !!product,
    queryFn: async () => {
      const { data } = await supabase.from('product_images').select('id,image_url,display_order,is_primary').eq('product_id', product!.id).order('display_order');
      return (data || []) as { id: string; image_url: string; display_order: number }[];
    },
  });

  const set = (k: keyof typeof form, v: string | boolean | string[]) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };
  const addTag = () => {
    const parts = tag.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length) set('compatible_models', [...new Set([...form.compatible_models, ...parts])]);
    setTag('');
  };
  const close = () => { if (!dirty || confirm('Modifications non enregistrées. Fermer quand même ?')) onClose(); };

  const save = async () => {
    if (!product) return;
    setSaving(true);
    const values: Partial<Product> = {
      selling_price: n(form.selling_price), purchase_price: form.purchase_price ? n(form.purchase_price) : null, quantity_minimal: form.quantity_minimal ? n(form.quantity_minimal) : null,
      ...(webFields ? { old_price: form.old_price ? n(form.old_price) : null, slug: form.slug ? slugify(form.slug) : null, featured: form.featured, compatible_models: form.compatible_models } : {}),
    };
    const ok = await onSave(product, values, 'Fiche enregistrée');
    setSaving(false);
    if (ok) { setDirty(false); onClose(); }
  };

  // Images: first image = primary (shown on cards)
  const syncPrimary = async (list: { image_url: string }[]) => {
    if (!product) return;
    await supabase.from('products').update({ primary_image: list[0]?.image_url || null }).eq('id', product.id);
    qc.invalidateQueries({ queryKey: ['catalogue'] });
  };
  const upload = async (files: FileList | null) => {
    if (!product || !files?.length) return;
    try {
      const res = await uploadImages([...files], { folder: product.id, preset: 'product' });
      const start = images.length;
      await supabase.from('product_images').insert(res.map((r, i) => ({ product_id: product.id, image_url: r.publicUrl, file_path: r.path, display_order: start + i, is_primary: start + i === 0 })));
      const { data } = await refetchImages();
      await syncPrimary(data || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "L'envoi a échoué");
    }
  };
  const move = async (idx: number, dir: -1 | 1) => {
    const list = [...images];
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    [list[idx], list[j]] = [list[j], list[idx]];
    await Promise.all(list.map((img, i) => supabase.from('product_images').update({ display_order: i, is_primary: i === 0 }).eq('id', img.id)));
    await refetchImages();
    await syncPrimary(list);
  };
  const remove = async (id: string) => {
    await supabase.from('product_images').delete().eq('id', id);
    const { data } = await refetchImages();
    await syncPrimary(data || []);
  };

  const field = 'h-10 w-full rounded-[10px] border border-input bg-card px-3 text-base focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/25 md:text-sm';

  return (
    <Sheet open={!!product} onOpenChange={(v) => !v && close()}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="pr-6">{product?.name}</SheetTitle>
          <SheetDescription>Fiche boutique, prix et stock. Les autres champs se modifient dans « Chargeurs ».</SheetDescription>
        </SheetHeader>
        {product && (
          <form className="mt-6 flex-1 space-y-6" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <section className="space-y-3">
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Images</h3>
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, i) => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-2">
                    <img src={img.image_url} alt="" className="h-full w-full object-contain" />
                    {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-md bg-volt px-1.5 text-[10px] font-bold text-volt-foreground">Principale</span>}
                    <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <span className="flex gap-1">
                        <button type="button" onClick={() => move(i, -1)} className="rounded-md bg-card/90 p-1" aria-label="Avancer"><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => move(i, 1)} className="rounded-md bg-card/90 p-1" aria-label="Reculer"><ArrowDown className="h-3.5 w-3.5" /></button>
                      </span>
                      <button type="button" onClick={() => remove(img.id)} className="rounded-md bg-card/90 p-1 text-destructive" aria-label="Supprimer l'image"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground">
                  <ImagePlus className="h-5 w-5" />Ajouter
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <h3 className="col-span-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Prix & stock</h3>
              <label className="space-y-1 text-sm"><span className="font-medium">Prix de vente (DA)</span><input type="number" min={0} className={field} value={form.selling_price} onChange={(e) => set('selling_price', e.target.value)} /></label>
              <label className="space-y-1 text-sm"><span className="font-medium">Prix d'achat (DA)</span><input type="number" min={0} className={field} value={form.purchase_price} onChange={(e) => set('purchase_price', e.target.value)} /></label>
              <label className="space-y-1 text-sm"><span className="font-medium">Prix barré (DA)</span><input type="number" min={0} className={field} value={form.old_price} onChange={(e) => set('old_price', e.target.value)} disabled={!webFields} placeholder="Promo" /></label>
              <label className="space-y-1 text-sm"><span className="font-medium">Seuil d'alerte stock</span><input type="number" min={0} className={field} value={form.quantity_minimal} onChange={(e) => set('quantity_minimal', e.target.value)} placeholder="ex. 3" /></label>
              {n(form.selling_price) > 0 && n(form.purchase_price) > 0 && (
                <p className="col-span-2 text-xs text-muted-foreground">Marge : <span className="font-semibold tabular-nums text-foreground">{formatDA(n(form.selling_price) - n(form.purchase_price))} ({(((n(form.selling_price) - n(form.purchase_price)) / n(form.selling_price)) * 100).toFixed(0)}%)</span></p>
              )}
            </section>

            <fieldset disabled={!webFields} className="space-y-3 disabled:opacity-50">
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Compatibilité</h3>
              <div className="flex flex-wrap gap-1.5">
                {form.compatible_models.map((m) => (
                  <span key={m} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs">
                    {m}<button type="button" onClick={() => set('compatible_models', form.compatible_models.filter((x) => x !== m))} aria-label={`Retirer ${m}`}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <input className={field} value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Ajouter un modèle (ex. Latitude 5480) puis Entrée"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }} onBlur={addTag} />
              <p className="text-xs text-muted-foreground">Sans liste ici, la boutique utilise la liste « Compatible avec » de la description.</p>
            </fieldset>

            <fieldset disabled={!webFields} className="space-y-3 disabled:opacity-50">
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Boutique & SEO</h3>
              <label className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                <span className="flex items-center gap-2"><Star className="h-4 w-4" />Mettre en avant (« Les plus demandés »)</span>
                <Switch checked={form.featured} onCheckedChange={(v) => set('featured', v)} />
              </label>
              <label className="block space-y-1 text-sm"><span className="font-medium">Slug (adresse de la page)</span>
                <input className={field} value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(product.name)} />
                <span className="block text-xs text-muted-foreground">/website-shop/product/{form.slug ? slugify(form.slug) : '…automatique'}</span>
              </label>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{product.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{product.is_active ? 'Publié sur la boutique' : 'Masqué de la boutique'} (interrupteur « En ligne » de la liste)</p>
            </fieldset>
          </form>
        )}
        <SheetFooter className="mt-6 gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={close}>Annuler</Button>
          <Button onClick={save} disabled={saving || !dirty}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
