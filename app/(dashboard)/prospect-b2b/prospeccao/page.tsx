"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface FilaLead {
  id: string;
  companyName: string;
  phone: string;
  niche?: string | null;
  status: string;
  messageIndex: number | null;
  message: string;
  sentToday: boolean;
}

interface FilaResponse {
  date: string;
  dailyLimit: number;
  total: number;
  sent: number;
  queue: FilaLead[];
  error?: string;
}

export default function ProspeccaoPage() {
  const [data, setData] = useState<FilaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pendentes" | "enviados">("pendentes");
  const [sendingId, setSendingId] = useState<string | null>(null);

  const loadFila = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prospect-b2b/fila", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error || "Erro ao carregar a fila de hoje.");
        setData(null);
        return;
      }
      setData(json);
    } catch (err) {
      console.error("[prospeccao] loadFila", err);
      toast.error("Não foi possível conectar à API para carregar a fila.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFila();
  }, []);

  const handleEnviar = async (lead: FilaLead) => {
    setSendingId(lead.id);
    // Abre a aba ANTES do await, senão o navegador bloqueia como pop-up
    // (depois do await, a ação não conta mais como "clique direto do usuário").
    const whatsappTab = window.open("about:blank", "_blank");
    try {
      const res = await fetch("/api/prospect-b2b/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        whatsappTab?.close();
        toast.error(json?.error || "Erro ao registrar envio.");
        return;
      }
      if (whatsappTab) {
        whatsappTab.location.href = json.whatsappUrl;
      } else {
        // Se o navegador ainda assim bloqueou a aba, oferece o link direto.
        toast.error("O navegador bloqueou a aba. Permita pop-ups para este site e tente de novo.");
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              sent: prev.sent + 1,
              queue: prev.queue.map((l) =>
                l.id === lead.id ? { ...l, sentToday: true, status: "contatado" } : l
              ),
            }
          : prev
      );
      toast.success("WhatsApp aberto e lead marcado como enviado.");
    } catch (err) {
      console.error("[prospeccao] handleEnviar", err);
      whatsappTab?.close();
      toast.error("Não foi possível conectar à API para enviar.");
    } finally {
      setSendingId(null);
    }
  };

  const queue = data?.queue ?? [];
  const pendentes = queue.filter((l) => !l.sentToday);
  const enviados = queue.filter((l) => l.sentToday);
  const visible = filter === "pendentes" ? pendentes : enviados;

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/prospect-b2b"
            className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Prospecção de hoje</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.sent} / ${data.dailyLimit} contatos enviados hoje` : "Carregando..."}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando fila...</p>
      ) : queue.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum lead disponível na fila de hoje.</p>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            <Button variant={filter === "pendentes" ? "default" : "ghost"} onClick={() => setFilter("pendentes")}>
              <Clock className="h-4 w-4" /> Não enviados ({pendentes.length})
            </Button>
            <Button variant={filter === "enviados" ? "default" : "ghost"} onClick={() => setFilter("enviados")}>
              <CheckCircle2 className="h-4 w-4" /> Enviados ({enviados.length})
            </Button>
          </div>

          <div className="space-y-2">
            {visible.map((lead) => (
              <Card key={lead.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{lead.companyName}</p>
                      {lead.sentToday && <Badge variant="success">Enviado</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {lead.phone}
                      {lead.niche ? ` · ${lead.niche}` : ""}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap rounded-lg bg-accent p-3 text-xs text-foreground">
                      {lead.message}
                    </p>
                  </div>
                  {!lead.sentToday && (
                    <Button onClick={() => handleEnviar(lead)} disabled={sendingId === lead.id}>
                      <MessageCircle className="h-4 w-4" />
                      {sendingId === lead.id ? "Abrindo..." : "Abrir WhatsApp"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {visible.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {filter === "pendentes" ? "Nenhum lead pendente." : "Nenhum lead enviado ainda hoje."}
              </p>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}