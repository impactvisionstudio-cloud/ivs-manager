"use client";

import { useRouter } from "next/navigation";
import { Bell, Search, LogOut, Settings, User as UserIcon, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/auth-store";
import { useUIStore } from "@/lib/store/ui-store";
import { ROLE_LABELS } from "@/types";
import { initials } from "@/lib/utils";
import { mockNotifications } from "@/lib/mock/data";
import Link from "next/link";

export function Topbar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();
  const router = useRouter();
  const unread = mockNotifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl transition-all duration-300 md:pl-[calc(var(--sidebar-w)+1rem)]"
      style={{ ["--sidebar-w" as string]: sidebarCollapsed ? "76px" : "256px" }}
    >
      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar clientes, contratos..." className="pl-9" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          title="Baixar planilha com todos os dados"
          onClick={() => { window.location.href = "/api/data/export"; }}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Download className="h-[18px] w-[18px]" />
        </button>

        <Link
          href="/notificacoes"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-primary-500" />
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-accent focus:outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials(user?.name ?? "U")}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user ? ROLE_LABELS[user.role] : ""}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/perfil"><UserIcon className="h-4 w-4" /> Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/configuracoes"><Settings className="h-4 w-4" /> Configurações</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-danger focus:text-danger">
              <LogOut className="h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
