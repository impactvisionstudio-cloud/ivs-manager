"use client";

import { useMemo } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import { CalendarClock, CircleDollarSign } from "lucide-react";
import type { AgendaEvent, Transaction, Client } from "@/types";
import { useCollection } from "@/lib/hooks/use-collection";

interface DerivedNotification {
  id: string;
  title: string;
  description: string;
  type: "info" | "warning" | "danger";
  createdAt: string;
}

function isTomorrow(dateStr: string) {
  const date = new Date(dateStr);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  );
}

export default function NotificacoesPage() {
  const { items: events, loading: loadingEvents } = useCollection<AgendaEvent>("agenda");
  const { items: transactions, loading: loadingTransactions } = useCollection<Transaction>("financeiro");
  const { items: clients } = useCollection<Client>("clientes");

  const loading = loadingEvents || loadingTransactions;

  const clientName = (id?: string) => clients.find((c) => c.id === id)?.name;

  const notifications = useMemo<DerivedNotification[]>(() => {
    const agendaNotifs: DerivedNotification[] = events
      .filter((e) => isTomorrow(e.start))
      .map((e) => ({
        id: `agenda-${e.id}`,
        title: `Compromisso amanhã: ${e.title}`,
        description: `${new Date(e.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · ${clientName(e.clientId) ?? "Sem cliente vinculado"}`,
        type: "info",
        createdAt: e.start,
      }));

    const financeiroNotifs: DerivedNotification[] = transactions
      .filter((t) => t.type === "receita" && (t.status === "pendente" || t.status === "atrasado"))
      .map((t) => ({
        id: `financeiro-${t.id}`,
        title: t.status === "atrasado" ? `Cobrança atrasada: ${t.description}` : `Cobrança pendente: ${t.description}`,
        description: `${clientName(t.clientId) ?? t.category ?? "Cliente não vinculado"} · vencimento ${formatDate(t.date)}`,
        type: t.status === "atrasado" ? "danger" : "warning",
        createdAt: t.date,
      }));

    return [...financeiroNotifs, ...agendaNotifs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [events, transactions, clients]);

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Notificações</h1>
        <p className="text-sm text-muted-foreground">Compromissos de amanhã e cobranças pendentes</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={cn(n.type === "danger" && "border-danger/40 bg-danger/[0.04]")}>
              <CardContent className="flex items-start gap-3 p-4">
                <span className="mt-1 shrink-0 text-muted-foreground">
                  {n.id.startsWith("agenda") ? <CalendarClock className="h-4 w-4" /> : <CircleDollarSign className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {notifications.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma notificação no momento. Tudo em dia!</p>
          )}
        </div>
      )}
    </DashboardShell>
  );
}