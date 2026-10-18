// src/workers/WorkerSidebar.tsx
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Receipt, ScanLine, Settings2, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
}

export default function WorkerSidebar({ isOpen }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { title: "Dashboard", href: "/employee", icon: LayoutDashboard },
    { title: "POS", href: "/employee/pos", icon: ScanLine },
    { title: "Sales", href: "/employee/sales", icon: Receipt },
    { title: "Settings", href: "/employee/workersettings", icon: Settings2 },
  ];

  const isActiveRoute = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-300 ease-out flex flex-col",
        isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary shadow-primary rounded-xl flex items-center justify-center text-white">
            <BadgeCheck className="w-5 h-5" />
          </div>
          {isOpen && (
            <div>
              <h1 className="font-display font-bold text-lg text-white">Worker</h1>
              <p className="text-xs text-sidebar-foreground/55">Espace Employé</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex h-11 items-center gap-3 px-3 rounded-xl text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white transition-colors duration-200",
                isActive && "bg-gradient-primary text-white shadow-primary hover:bg-transparent"
              )}
              title={!isOpen ? item.title : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {isOpen && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
