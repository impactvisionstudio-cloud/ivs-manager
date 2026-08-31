"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Send, MessageSquare, Star, Trophy, Target, Upload, X, Trash2, ListChecks } from "lucide-react";
import type { ProspectLead, ProspectContact, ProspectLeadStatus } from "@/types";
import { PROSPECT_LEAD_STATUS_LABELS } from "@/types";
import { useCollection } from "@/lib/hooks/use-collection";
import { parseSpreadsheet, type ParseResult } from "@/lib/prospect-import";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { toast } from "sonner";

const STATUS_OPTIONS: ProspectLeadStatus[] = [
  "novo", "contatado", "respondeu", "interessado", "negociacao",
  "site_em_producao", "cliente", "sem_interesse", "sem_resposta", "sem_whatsapp",
];

const STATUS_VARIANT: Record<ProspectLeadStatus, "success" | "secondary" | "warning" | "danger"> = {
  novo: "secondary",
  contatado: "warning",
  respondeu: "warning",
  interessado: "success",
  negociacao: "success",
  site_em_producao: "success",
  cliente: "success",
  sem_interesse: "danger",
  sem_resposta: "danger",
  sem_whatsapp: "danger",
};

const RESPONDED_STATUSES: ProspectLeadStatus[] = [
  "respondeu", "interessado", "negociacao", "site_em_producao", "cliente",
];

const INTERESTED_STATUSES: ProspectLeadStatus[] = [
  "interessado", "negociacao", "site_em_producao",
];

type FilterKey =
  | "todos"
  | "contatados_hoje"
  | "responderam"
  | "interessados"
  | "clientes"
  | "faltando_enviar"
  | "sem_whatsapp"
  | "hoje_enviados"
  | "ja_enviados";

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function ProspectB2BPage() {
  const { items: leads, loading: loadingLeads, refresh: refreshLeads, update: updateLead, remove: removeLead } = useCollection<ProspectLead>("prospectos");
  const { items: contacts, loading: loadingContacts } = useCollection<ProspectContact>("prospeccaocontatos");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [deleting, setDeleting] = useState<ProspectLead | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingAllLoading, setDeletingAllLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos");

  const [dailyGoal, setDailyGoal] = useState(40);
  useEffect(() => {
    fetch("/api/prospect-b2b/prospeccao")
      .then((r) => r.json())
      .then((d) => { if (d.dailyLimit) setDailyGoal(d.dailyLimit); });
  }, []);

  const loading = loadingLeads || loadingContacts;

  const contactedTodayIds = new Set(
    contacts.filter((c) => isToday(c.sentAt)).map((c) => c.leadId)
  );
  const contactedToday = contactedTodayIds.size;

  const responded = leads.filter((l) => RESPONDED_STATUSES.includes(l.status)).length;
  const interested = leads.filter((l) => INTERESTED_STATUSES.includes(l.status)).length;
  const clients = leads.filter((l) => l.status === "cliente").length;

    const sentLeadIds = new Set([
    ...contacts.map((c) => c.leadId),
    ...leads.filter((lead) => lead.status !== "novo").map((lead) => lead.id),
  ]);
  const pendingSend = leads.filter((lead) => !sentLeadIds.has(lead.id)).length;
  const noWhatsapp = leads.filter((lead) => lead.status === "sem_whatsapp").length;
  const alreadySent = sentLeadIds.size;

  const goalProgress = Math.min(100, Math.round((contactedToday / dailyGoal) * 100));

  const cards: { key: FilterKey; label: string; value: number; icon: typeof Users }[] = [
    { key: "todos", label: "Total de leads", value: leads.length, icon: Users },
    { key: "contatados_hoje", label: "Contatados hoje", value: contactedToday, icon: Send },
    { key: "responderam", label: "Responderam", value: responded, icon: MessageSquare },
    { key: "interessados", label: "Interessados", value: interested, icon: Star },
    { key: "clientes", label: "Clientes", value: clients, icon: Trophy },
    { key: "faltando_enviar", label: "Faltando enviar", value: pendingSend, icon: Send },
    { key: "sem_whatsapp", label: "Não tem WhatsApp", value: noWhatsapp, icon: MessageSquare },
    { key: "hoje_enviados", label: "Leads de hoje enviados", value: contactedToday, icon: Send },
    { key: "ja_enviados", label: "Leads já enviados", value: alreadySent, icon: ListChecks },
  ];

  const filteredLeads = leads.filter((lead) => {
    switch (activeFilter) {
      case "contatados_hoje":
        return contactedTodayIds.has(lead.id);
      case "responderam":
        return RESPONDED_STATUSES.includes(lead.status);
      case "interessados":
        return INTERESTED_STATUSES.includes(lead.status);
      case "clientes":
        return lead.status === "cliente";
      case "faltando_enviar":
        return !sentLeadIds.has(lead.id);
      case "sem_whatsapp":
        return lead.status === "sem_whatsapp";
      case "hoje_enviados":
        return contactedTodayIds.has(lead.id);
      case "ja_enviados":
        return sentLeadIds.has(lead.id);
      case "todos":
      default:
        return true;
    }
  });

  const activeCard = cards.find((c) => c.key === activeFilter);
  const listTitle =
    activeFilter === "todos"
      ? `Leads importados (${filteredLeads.length})`
      : `${activeCard?.label} (${filteredLeads.length})`;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setPreview(null);
    try {
      const result = await parseSpreadsheet(file);
      setPreview(result);
      if (result.valid.length === 0) {
        toast.error("Nenhum lead válido encontrado na planilha. Confira as colunas Empresa e Telefone.");
      }
    } catch (err) {
      console.error("[parseSpreadsheet]", err);
      toast.error("Não foi possível ler essa planilha. Confira se é .xlsx ou .csv.");
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confirmImport = async () => {
    if (!preview || preview.valid.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/prospect-b2b/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: preview.valid.map((l) => ({
            companyName: l.companyName,
            phone: l.phone,
            niche: l.niche,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Erro ao importar planilha.");
        return;
      }
      const data = await res.json();
      toast.success(`${data.inserted} leads importados. ${data.skippedExisting} já existiam.`);
      setImportOpen(false);
      setPreview(null);
      refreshLeads();
    } catch (err) {
      console.error("[confirmImport]", err);
      toast.error("Não foi possível conectar à API para importar.");
    } finally {
      setImporting(false);
    }
  };

  const closeModal = () => {
    setImportOpen(false);
    setPreview(null);
  };

  const toggleFilter = (key: FilterKey) => {
    setActiveFilter((prev) => (prev === key ? "todos" : key));
  };

  const handleDeleteAll = async () => {
    if (leads.length === 0) return;
    setDeletingAllLoading(true);
    try {
      await Promise.all(leads.map((lead) => removeLead(lead.id)));
      toast.success("Todos os leads foram apagados.");
    } catch (err) {
      console.error("[handleDeleteAll]", err);
      toast.error("Erro ao apagar todos os leads. Tente novamente.");
    } finally {
      setDeletingAllLoading(false);
      setDeletingAll(false);
      refreshLeads();
    }
  };

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">IVS Prospect B2B</h1>
          <p className="text-sm text-muted-foreground">Prospecção organizada via WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Link href="/prospect-b2b/prospeccao">
            <Button variant="secondary">
              <ListChecks className="h-4 w-4" /> Fila de hoje
            </Button>
          </Link>
          <Button onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" /> Importar leads
          </Button>
          <Button
            variant="ghost"
            className="border border-danger/40 text-danger hover:bg-danger/10"
            onClick={() => setDeletingAll(true)}
            disabled={leads.length === 0}
          >
            <Trash2 className="h-4 w-4" /> Apagar todos
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {cards.map((c) => {
              const isActive = activeFilter === c.key;
              return (
                <Card
                  key={c.key}
                  onClick={() => toggleFilter(c.key)}
                  className={`cursor-pointer transition-all hover:border-primary-500/60 hover:shadow-md ${
                    isActive ? "border-primary-500 ring-1 ring-primary-500/60 bg-primary-600/5" : ""
                  }`}
                >
                  <CardContent className="flex flex-col gap-2 p-4">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                        isActive ? "bg-primary-600/25 text-primary-300" : "bg-primary-600/15 text-primary-400"
                      }`}
                    >
                      <c.icon className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-2xl font-semibold tracking-tight">{c.value}</p>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-4">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary-400" />
                  <p className="text-sm font-medium">Meta diária</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {contactedToday} / {dailyGoal} contatos
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                <div
                  className="h-full rounded-full bg-gradient-primary transition-all"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">{listTitle}</h2>
              {activeFilter !== "todos" && (
                <button
                  onClick={() => setActiveFilter("todos")}
                  className="text-xs font-medium text-primary-400 hover:text-primary-300"
                >
                  Mostrar todos os leads
                </button>
              )}
            </div>
            <div className="space-y-2">
              {filteredLeads.map((lead) => (
                <Card key={lead.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{lead.companyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.phone}{lead.niche ? ` · ${lead.niche}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLead(lead.id, { status: e.target.value as ProspectLeadStatus })}
                        className="rounded-lg border border-border bg-accent px-2 py-1.5 text-xs text-foreground"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{PROSPECT_LEAD_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <Badge variant={STATUS_VARIANT[lead.status]}>{PROSPECT_LEAD_STATUS_LABELS[lead.status]}</Badge>
                      <Button variant="ghost" size="icon" className="text-danger" onClick={() => setDeleting(lead)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredLeads.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {leads.length === 0 ? "Nenhum lead importado ainda." : "Nenhum lead encontrado para este filtro."}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">Importar leads</h2>
                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!preview && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    Selecione um arquivo .xlsx ou .csv com as colunas Empresa, Telefone e Nicho.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelected}
                    className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary-600/15 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-300 hover:file:bg-primary-600/25"
                  />
                  {parsing && <p className="text-sm text-muted-foreground">Lendo planilha...</p>}
                </div>
              )}

              {preview && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-accent p-3">
                      <p className="text-lg font-semibold text-primary-300">{preview.valid.length}</p>
                      <p className="text-xs text-muted-foreground">Prontos p/ importar</p>
                    </div>
                    <div className="rounded-lg bg-accent p-3">
                      <p className="text-lg font-semibold text-amber-400">{preview.duplicateCount}</p>
                      <p className="text-xs text-muted-foreground">Duplicados na planilha</p>
                    </div>
                    <div className="rounded-lg bg-accent p-3">
                      <p className="text-lg font-semibold text-danger">{preview.invalidCount}</p>
                      <p className="text-xs text-muted-foreground">Inválidos</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setPreview(null)}>Escolher outro arquivo</Button>
                    <Button onClick={confirmImport} disabled={importing || preview.valid.length === 0}>
                      {importing ? "Importando..." : `Importar ${preview.valid.length} leads`}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        itemName={deleting?.companyName}
        onConfirm={() => deleting && removeLead(deleting.id)}
      />

      <ConfirmDeleteDialog
        open={deletingAll}
        onOpenChange={(o) => !deletingAllLoading && !o && setDeletingAll(false)}
        itemName={`todos os ${leads.length} leads`}
        onConfirm={handleDeleteAll}
      />
    </DashboardShell>
  );
}