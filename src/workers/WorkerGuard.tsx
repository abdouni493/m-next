// Renders a worker page only if the worker was given access to that interface.
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { WORKER_INTERFACES, usePermissions, canAccess } from "@/lib/permissions";

export default function WorkerGuard({ perm, children }: { perm: string; children: ReactNode }) {
  const permissions = usePermissions();
  if (canAccess(permissions, perm)) return <>{children}</>;
  const first = WORKER_INTERFACES.find((i) => canAccess(permissions, i.key));
  if (first && first.key !== perm) return <Navigate to={first.href} replace />;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
      <ShieldOff className="h-10 w-10" />
      <p className="font-semibold">Aucune interface ne vous a été attribuée.</p>
      <p className="text-sm">Contactez l'administrateur pour obtenir des accès.</p>
    </div>
  );
}
