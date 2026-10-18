import { ShieldX, LogOut, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

/** Shown to signed-in accounts whose role has no access to the admin panel. */
export default function AccessDenied() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldX className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {user ? `Le compte ${user.email} n'a pas accès au panneau d'administration.` : "Vous n'avez pas accès à cette page."} Contactez l'administrateur de la boutique.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => navigate('/website-shop')}><Store /> Voir la boutique</Button>
          {user && <Button onClick={async () => { await logout(); navigate('/login', { replace: true }); }}><LogOut /> Se déconnecter</Button>}
        </div>
      </div>
    </div>
  );
}
