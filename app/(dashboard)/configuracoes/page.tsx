"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockUsers } from "@/lib/mock/data";
import { ROLE_LABELS } from "@/types";
import { initials } from "@/lib/utils";
import { Users, Shield, ListChecks, ScrollText, Settings2 } from "lucide-react";

const auditLog = [
  { id: "1", user: "Marina Alves", action: "Assinou o contrato com Vórtice Bebidas", time: "há 2h" },
  { id: "2", user: "Rafael Souza", action: "Moveu negócio para 'Negociação'", time: "há 5h" },
  { id: "3", user: "Fernanda Dias", action: "Registrou pagamento de R$ 26.000", time: "ontem" },
  { id: "4", user: "Diego Martins", action: "Reservou câmera RED Komodo 6K", time: "ontem" },
];

export default function ConfiguracoesPage() {
  return (
    <DashboardShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600/15 text-primary-400">
          <Settings2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">Painel administrativo do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <Users className="h-4 w-4 text-primary-400" />
            <CardTitle>Usuários e permissões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {mockUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/10 p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{initials(u.name)}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <Badge>{ROLE_LABELS[u.role]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary-400" />
            <CardTitle>Logs recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {auditLog.map((l) => (
              <div key={l.id} className="text-xs">
                <p className="text-foreground"><span className="font-medium">{l.user}</span> {l.action}</p>
                <p className="mt-0.5 text-muted-foreground">{l.time}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Shield className="h-4 w-4 text-primary-400" />
            <CardTitle>Perfis de acesso</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Administrador, Gestor, Editor, Designer, Videomaker, Social Media e Financeiro — cada um com um
            conjunto próprio de permissões sobre os módulos do sistema.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary-400" />
            <CardTitle>Serviços da agência</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Vídeos institucionais, comerciais, cobertura de eventos, conteúdo para redes sociais e
            documentários — configuráveis para orçamentos e contratos.
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
