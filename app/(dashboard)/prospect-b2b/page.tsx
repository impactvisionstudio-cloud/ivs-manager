"use client";

import { useRef, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Send, MessageSquare, Star, Trophy, Target, Upload, X, Trash2 } from "lucide-react";
import type { ProspectLead, ProspectContact, ProspectLeadStatus } from "@/types";
import { PROSPECT_LEAD_STATUS_LABELS } from "@/types";
import { useCollection } from "@/lib/hooks/use-collection";
import { parseSpreadsheet, type ParseResult } from "@/lib/prospect-import";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { toast } from "sonner";

const DAILY_GOAL = 30;

const STATUS_OPTIONS: ProspectLeadStatus[] = [
  "novo", "contatado", "respondeu", "interessado", "negociacao",
  "site_em_producao", "cliente", "sem_interesse", "sem_resposta",
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
};

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

  const loading = loadingLeads || loadingContacts;

  const contactedToday = new Set(
    contacts.filter((c) => isToday(c.sentAt)).map((c) => c.leadId)
  ).size;

  const responded = leads.filter((l) =>
    ["respondeu", "interessado", "negociacao", "site_em_producao", "cliente"].includes(l.status)
  ).length;

  const interested = leads.filter((l) =>
    ["interessado", "negociacao", "site_em_producao"].includes(l.status)
  ).length;

  const clients = leads.filter((l) => l.status === "cliente").length;

  const goalProgress = Math.min(100, Math.round((contactedToday / DAILY_GOAL) * 100));

  const cards = [
    { label: "Total de leads", value: leads.length, icon: Users },
    { label: "Contatados hoje", value: contactedToday, icon: Send },
    { label: "Responderam", value: responded, icon: MessageSquare },
    { label: "Interessados", value: interested, icon: Star },
    { label: "Clientes", value: clients, icon: Trophy },
  ];

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

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">IVS Prospect B2B</h1>
          <p className="text-sm text-muted-foreground">Prospecção organizada via WhatsApp</p>
        </div>
        <Button onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4" /> Importar leads
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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

          <Card className="mt-4">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary-400" />
                  <p className="text-sm font-medium">Meta diária</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {contactedToday} / {DAILY_GOAL} contatos
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
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Leads importados ({leads.length})</h2>
            <div className="space-y-2">
              {leads.map((lead) => (
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
              {leads.length === 0 && <p className="text-sm text-muted-foreground">Nenhum lead importado ainda.</p>}
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
    </DashboardShell>
  );
}