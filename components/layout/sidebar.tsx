"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, Workflow, UserCog, Wallet,
  FileSignature, ListChecks, Bell, Sparkles, Settings, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store/ui-store";
import { useAuthStore } from "@/lib/store/auth-store";
import type { Permission } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { href: "/agenda", label: "Agenda", icon: Calendar, permission: "agenda.manage" },
  { href: "/clientes", label: "Clientes", icon: Users, permission: "clientes.manage" },
  { href: "/crm", label: "CRM", icon: Workflow, permission: "crm.manage" },
  { href: "/equipe", label: "Equipe", icon: UserCog, permission: "equipe.manage" },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, permission: "financeiro.view" },
  { href: "/contratos", label: "Contratos", icon: FileSignature, permission: "contratos.manage" },
  { href: "/checklist", label: "Checklist", icon: ListChecks },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/ia", label: "IVS AI", icon: Sparkles, permission: "ia.use" },
  { href: "/configuracoes", label: "Configurações", icon: Settings, permission: "admin.access" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const can = useAuthStore((s) => s.can);

  const items = NAV_ITEMS.filter((item) => !item.permission || can(item.permission));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-all duration-300 md:flex",
        sidebarCollapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-sm font-bold text-white shadow-glow">
          IV
        </div>
        {!sidebarCollapsed && (
          <span className="text-sm font-semibold tracking-tight text-foreground">IVS Manager</span>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-600/15 text-primary-300"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-primary" />
              )}
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!sidebarCollapsed && "Recolher menu"}
        </button>
      </div>
    </aside>
  );
}