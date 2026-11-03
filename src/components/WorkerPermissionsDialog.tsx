// Admin dialog: choose which interfaces (sidebar) and which button actions a worker can see.
import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ChevronRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { WORKER_INTERFACES, normalizePermissions, fullPermissions, type WorkerPermissions } from '@/lib/permissions';
import { getWorkerPermissions, saveWorkerPermissions } from '@/lib/supabaseClient';

interface Props {
  employee: { id: string; full_name: string; user_id?: string | null; username?: string | null; email?: string | null; permissions?: unknown } | null;
  onClose: () => void;
}

export default function WorkerPermissionsDialog({ employee, onClose }: Props) {
  const { toast } = useToast();
  const [perms, setPerms] = useState<WorkerPermissions>({});
  const [active, setActive] = useState(WORKER_INTERFACES[0].key);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!employee) return;
    let alive = true;
    setLoading(true);
    setActive(WORKER_INTERFACES[0].key);
    getWorkerPermissions(employee)
      .then((p) => { if (alive) setPerms(normalizePermissions(p)); })
      .catch(() => { if (alive) setPerms(normalizePermissions(null)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [employee]);

  const current = useMemo(() => WORKER_INTERFACES.find((i) => i.key === active)!, [active]);
  const enabled = current.key in perms;

  const toggleInterface = (key: string, on: boolean) => {
    setPerms((p) => {
      const next = { ...p };
      if (on) next[key] = WORKER_INTERFACES.find((i) => i.key === key)!.actions.map((a) => a.key);
      else delete next[key];
      return next;
    });
  };
  const toggleAction = (iface: string, action: string, on: boolean) => {
    setPerms((p) => {
      const list = new Set(p[iface] || []);
      if (on) list.add(action); else list.delete(action);
      return { ...p, [iface]: [...list] };
    });
  };

  const handleSave = async () => {
    if (!employee) return;
    setSaving(true);
    try {
      await saveWorkerPermissions(employee, perms);
      toast({ title: 'Permissions enregistrées', description: `${employee.full_name} verra uniquement les accès sélectionnés (à sa prochaine connexion / actualisation).` });
      onClose();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message || 'Enregistrement impossible', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!employee} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Permissions — {employee?.full_name}</DialogTitle>
          <DialogDescription>Cochez les interfaces visibles dans la barre latérale du travailleur, puis les boutons d'action autorisés pour chaque interface.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-60 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-[240px_1fr]">
            {/* Interfaces (sidebar) */}
            <div className="space-y-1 rounded-xl border border-border p-2">
              <p className="px-2 pb-1 text-xs font-semibold uppercase text-muted-foreground">Interfaces (barre latérale)</p>
              {WORKER_INTERFACES.map((i) => {
                const Icon = i.icon;
                const on = i.key in perms;
                return (
                  <div
                    key={i.key}
                    onClick={() => setActive(i.key)}
                    className={cn('flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted', active === i.key && 'bg-primary/10 ring-1 ring-primary')}
                  >
                    <Checkbox checked={on} onCheckedChange={(v) => toggleInterface(i.key, !!v)} onClick={(e) => e.stopPropagation()} />
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className={cn('flex-1', !on && 'text-muted-foreground')}>{i.label}</span>
                    {i.actions.length > 0 && (
                      <span className="text-xs text-muted-foreground">{on ? (perms[i.key] || []).length : 0}/{i.actions.length}</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })}
              <div className="flex gap-2 px-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setPerms(fullPermissions())}>Tout</Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setPerms({})}>Aucun</Button>
              </div>
            </div>

            {/* Button actions of the selected interface */}
            <div className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="font-semibold">Boutons d'action — {current.label}</p>
                {enabled && current.actions.length > 0 && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setPerms((p) => ({ ...p, [current.key]: current.actions.map((a) => a.key) }))}>Tout</Button>
                    <Button size="sm" variant="ghost" onClick={() => setPerms((p) => ({ ...p, [current.key]: [] }))}>Aucun</Button>
                  </div>
                )}
              </div>
              {!enabled ? (
                <p className="text-sm text-muted-foreground">Cette interface est masquée. Cochez-la à gauche pour choisir ses boutons d'action.</p>
              ) : current.actions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Cette interface ne contient pas de bouton d'action configurable.</p>
              ) : (
                <div className="space-y-2">
                  {current.actions.map((a) => (
                    <label key={a.key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
                      <Checkbox checked={(perms[current.key] || []).includes(a.key)} onCheckedChange={(v) => toggleAction(current.key, a.key, !!v)} />
                      {a.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving || loading} className="bg-primary">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
