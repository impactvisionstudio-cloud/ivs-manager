"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockNotifications } from "@/lib/mock/data";
import { cn, formatDate } from "@/lib/utils";
import { CheckCheck } from "lucide-react";

export default function NotificacoesPage() {
  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notificações</h1>
          <p className="text-sm text-muted-foreground">Tudo em tempo real</p>
        </div>
        <Button variant="secondary"><CheckCheck className="h-4 w-4" /> Marcar todas como lidas</Button>
      </div>

      <div className="space-y-2">
        {mockNotifications.map((n) => (
          <Card key={n.id} className={cn(!n.read && "border-primary-600/40 bg-primary-600/[0.04]")}>
            <CardContent className="flex items-start gap-3 p-4">
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  n.type === "danger" && "bg-danger",
                  n.type === "warning" && "bg-warning",
                  n.type === "success" && "bg-success",
                  n.type === "info" && "bg-info"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.description}</p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(n.createdAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
