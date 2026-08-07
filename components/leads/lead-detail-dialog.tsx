"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin, Phone, MessageSquareText, Copy, Check, Send, RefreshCw, Clock, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Lead, LeadStatus } from "@/app/(dashboard)/prospeccao-ia/page";

const STATUS_LABEL: Record<LeadStatus, string> = {
  nao_contatado: "Não Contatado",
  primeira_mensagem: "Primeira Mensagem",
  respondeu: "Respondeu",
  reuniao_marcada: "Reunião Marcada",
  proposta_enviada: "Proposta Enviada",
  cliente: "Cliente",
  perdido: "Perdido",
};
const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as LeadStatus[];

interface LeadMessage {
  id: string;
  leadId: string;
  kind: "mensagem" | "followup_1" | "followup_2";
  content: string;
  createdAt: string;
}

interface LeadHistoryItem {
  id: string;
  leadId: string;
  userId: string | null;
  action: string;
  createdAt: string;
}

const KIND_LABEL: Record<LeadMessage["kind"], string> = {
  mensagem: "Mensagem inicial",
  followup_1: "1º Follow-up",
  followup_2: "2º Follow-up",
};

interface Props {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void; // avisa a tabela pra recarregar (status mudou, etc)
}

export function LeadDetailDialog({ leadId, open, onOpenChange, onChanged }: Props) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<LeadMessage[]>([]);
  const [history, setHistory] = useState<LeadHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const [leadRes, messagesRes] = await Promise.all([
        fetch(`/api/leads/${leadId}`, { cache: "no-store" }),
        fetch(`/api/leads/${leadId}/messages`, { cache: "no-store" }),
      ]);
      if (leadRes.ok) {
        const data = await leadRes.json();
        setLead(data.item);
        setHistory(data.history ?? []);
        setNotes(data.item?.notes ?? "");
      }
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        setMessages(data.items ?? []);
      }
    } catch (err) {
      console.error("[lead-detail] load", err);
      toast.error("Não foi possível carregar os detalhes do lead.");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (open && leadId) load();
  }, [open, leadId, load]);

  const logHistory = async (action: string) => {
    if (!leadId) return;
    try {
      const res = await fetch(`/api/leads/${leadId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setHistory((prev) => [...prev, data.item]);
      }
    } catch (err) {
      console.error("[lead-detail] logHistory", err);
    }
  };

  const updateStatus = async (status: LeadStatus) => {
    if (!lead || !leadId) return;
    setLead({ ...lead, status });
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error("Erro ao atualizar status.");
        return;
      }
      toast.success("Status atualizado!");
      onChanged();
    } catch (err) {
      console.error("[lead-detail] updateStatus", err);
      toast.error("Não foi possível conectar à API para atualizar o status.");
    }
  };

  const saveNotes = async (value: string) => {
    if (!leadId) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: value }),
      });
      if (!res.ok) toast.error("Erro ao salvar observações.");
    } catch (err) {
      console.error("[lead-detail] saveNotes", err);
      toast.error("Não foi possível conectar à API para salvar as observações.");
    } finally {
      setSavingNotes(false);
    }
  };

  const generateMessage = async () => {
    if (!leadId) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/messages`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao gerar mensagem.");
        return;
      }
      setMessages((prev) => [...prev, data.item]);
      toast.success(
        data.kind === "mensagem" ? "Mensagem gerada!" : "Follow-up gerado!"
      );
      load(); // recarrega lead (status pode ter mudado) e histórico
      onChanged();
    } catch (err) {
      console.error("[lead-detail] generateMessage", err);
      toast.error("Não foi possível conectar à IA para gerar a mensagem.");
    } finally {
      setGenerating(false);
    }
  };

  const copyMessage = (msg: LeadMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    logHistory("Copiou mensagem");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openWhatsapp = (msg: LeadMessage) => {
    if (!lead?.phone) {
      toast.error("Esse lead não tem telefone cadastrado.");
      return;
    }
    const digits = lead.phone.replace(/\D/g, "");
    const phoneWithCountry = digits.startsWith("55") ? digits : `55${digits}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg.content)}`;
    window.open(url, "_blank");
    logHistory("Abriu WhatsApp");
  };

  const lastMessage = messages[messages.length - 1];
  const canFollowUp = messages.length > 0 && messages.length < 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {loading || !lead ? (
          <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3 pr-6">
                <div>
                  <DialogTitle>{lead.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {lead.category || "Sem categoria"} {lead.city ? `· ${lead.city}${lead.state ? `/${lead.state}` : ""}` : ""}
                  </p>
                </div>
                <select
                  value={lead.status}
                  onChange={(e) => updateStatus(e.target.value as LeadStatus)}
                  className="rounded-md border border-border bg-card px-2 py-1.5 text-xs"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
            </DialogHeader>

            <div className="space-y-1.5 text-sm text-muted-foreground">
              {lead.phone && (
                <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {lead.phone}</div>
              )}
              {lead.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {lead.address}
                  {lead.mapsUrl && (
                    <a href={lead.mapsUrl} target="_blank" rel="noreferrer" className="text-primary-400 hover:underline">
                      (ver no maps)
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Mensagem Inteligente */}
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <MessageSquareText className="h-4 w-4" /> Mensagem Inteligente
                </p>
                {messages.length === 0 ? (
                  <Button size="sm" onClick={generateMessage} disabled={generating}>
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareText className="h-4 w-4" />}
                    Gerar Mensagem
                  </Button>
                ) : (
                  canFollowUp && (
                    <Button size="sm" variant="outline" onClick={generateMessage} disabled={generating}>
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Gerar Follow-up
                    </Button>
                  )
                )}
              </div>

              {lastMessage ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border/60 bg-card p-3 text-sm">
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {KIND_LABEL[lastMessage.kind]}
                    </p>
                    <p className="whitespace-pre-wrap">{lastMessage.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => openWhatsapp(lastMessage)}>
                      <Send className="h-4 w-4" /> Abrir WhatsApp
                    </Button>
                    <Button variant="outline" onClick={() => copyMessage(lastMessage)}>
                      {copiedId === lastMessage.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Copiar
                    </Button>
                  </div>

                  {messages.length > 1 && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer">Ver mensagens anteriores ({messages.length - 1})</summary>
                      <div className="mt-2 space-y-2">
                        {messages.slice(0, -1).reverse().map((m) => (
                          <div key={m.id} className="rounded-lg border border-border/40 p-2">
                            <p className="mb-1 text-[10px] uppercase tracking-wide">{KIND_LABEL[m.kind]}</p>
                            <p className="whitespace-pre-wrap">{m.content}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nenhuma mensagem gerada ainda. Clique em &quot;Gerar Mensagem&quot; pra criar uma abordagem personalizada pra esse lead.
                </p>
              )}
            </div>

            {/* Observações */}
            <div>
              <p className="mb-1.5 text-sm font-medium">Observações</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => saveNotes(notes)}
                placeholder="Anotações internas sobre esse lead..."
                rows={3}
              />
              {savingNotes && <p className="mt-1 text-[11px] text-muted-foreground">Salvando...</p>}
            </div>

            {/* Histórico */}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Clock className="h-4 w-4" /> Histórico
              </p>
              <div className="scrollbar-thin max-h-40 space-y-1.5 overflow-y-auto text-xs text-muted-foreground">
                {history.length === 0 && <p>Nenhuma ação registrada ainda.</p>}
                {[...history].reverse().map((h) => (
                  <div key={h.id} className="flex items-center justify-between border-b border-border/40 pb-1">
                    <span>{h.action}</span>
                    <span>{new Date(h.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}