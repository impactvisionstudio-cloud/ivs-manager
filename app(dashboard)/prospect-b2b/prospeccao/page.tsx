"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Send, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";

interface QueueItem {
  id: string;
  companyName: string;
  phone: string;
  niche: string | null;
  status: string;
  messageIndex: number | null;
  message: string;
  sentToday: boolean;
}

type RowState = "idle" | "sending" | "sent" | "error";

export default function ProspeccaoPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [dailyLimit, setDailyLimit] = useState(40);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prospect-b2b/fila");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao carregar a fila de hoje.");
        return;
      }
      setQueue(data.queue);
      setDailyLimit(data.dailyLimit);
      const initialStates: Record<string, RowState> = {};
      for (const item of data.queue) {
        initialStates[item.id] = item.sentToday ? "sent" : "idle";
      }
      setRowStates(initialStates);
    } catch (err) {
      console.error("[loadQueue]", err);
      toast.error("Não foi possível conectar à API para montar a fila.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleSend = async (item: QueueItem) => {
    setRowStates((prev) => ({ ...prev, [item.id]: "sending" }));
    try {
      const res = await fetch("/api/prospect-b2b/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: item.id, userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRowStates((prev) => ({ ...prev, [item.id]: "error" }));
        toast.error(data.error || "Erro ao registrar envio.");
        return;
      }
      window.open(data.whatsappUrl, "_blank");
      setRowStates((prev) => ({ ...prev, [item.id]: "sent" }));
    } catch (err) {
      console.error("[handleSend]", err);
      setRowStates((prev) => ({ ...prev, [item.id]: "error" }));
      toast.error("Não foi possível conectar à API para enviar.");
    }
  };

  const sentCount = Object.values(rowStates).filter((s) => s === "sent").length;
  const errorCount = Object.values(rowStates).filter((s) => s === "error").length;
  const pendingCount = queue.length - sentCount - errorCount;

  const cards = [
    { label: "Selecionados hoje", value: queue.length, icon: ListChecks },
    { label: "Enviados", value: sentCount, icon: Send },
    { label: "Pendentes", value: pendingCount, icon: Clock },
    { label: "Erros", value: errorCount, icon: AlertTriangle },
  ];

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prospecção de hoje</h1>
          <p className="text-sm text-muted-foreground">
            Meta diária: {dailyLimit} contatos · progresso {sentCount}/{queue.length || dailyLimit}
          </p>
        </div>
        <Button variant="secondary" onClick={loadQueue} disabled={loading}>
          <RefreshCw className="h-4 w-4" /> Atualizar fila
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600/15 text-primary-400">
                <c.icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-2xl font-semibold tracking-tight">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Montando a fila de hoje...</p>
        ) : queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum lead disponível pra hoje. Importe mais leads na tela principal do Prospect B2B.
          </p>
        ) : (
          <div className="space-y-2">
            {queue.map((item) => {
              const state = rowStates[item.id] || "idle";
              return (
                <Card key={item.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{item.companyName}</p>
                        {item.niche && <Badge variant="secondary">{item.niche}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.phone}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                    </div>
                    <div className="shrink-0">
                      {state === "idle" && (
                        <Button onClick={() => handleSend(item)}>Enviar</Button>
                      )}
                      {state === "sending" && (
                        <Button disabled>Enviando...</Button>
                      )}
                      {state === "sent" && (
                        <Badge variant="success">✅ Enviado</Badge>
                      )}
                      {state === "error" && (
                        <Button variant="danger" onClick={() => handleSend(item)}>❌ Erro · tentar de novo</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}