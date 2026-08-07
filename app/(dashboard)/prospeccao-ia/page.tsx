"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Upload, Search, Bot, Users, PhoneOff, Send, MessageCircle,
  CalendarCheck, FileCheck2, TrendingUp, ChevronRight, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LeadDetailDialog } from "@/components/leads/lead-detail-dialog";

export type LeadStatus =
  | "nao_contatado"
  | "primeira_mensagem"
  | "respondeu"
  | "reuniao_marcada"
  | "proposta_enviada"
  | "cliente"
  | "perdido";

export interface Lead {
  id: string;
  name: string;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  mapsUrl: string | null;
  category: string | null;
  status: LeadStatus;
  responsibleId: string | null;
  notes: string | null;
  aiAnalysis: unknown;
  createdAt: string;
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  nao_contatado: "Não Contatado",
  primeira_mensagem: "Primeira Mensagem",
  respondeu: "Respondeu",
  reuniao_marcada: "Reunião Marcada",
  proposta_enviada: "Proposta Enviada",
  cliente: "Cliente",
  perdido: "Perdido",
};

const STATUS_VARIANT: Record<LeadStatus, "success" | "secondary" | "warning"> = {
  nao_contatado: "secondary",
  primeira_mensagem: "warning",
  respondeu: "warning",
  reuniao_marcada: "success",
  proposta_enviada: "success",
  cliente: "success",
  perdido: "secondary",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as LeadStatus[];

interface ImportRow {
  name: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  mapsUrl?: string;
  category?: string;
}

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function matchField(normalizedKey: string): keyof ImportRow | undefined {
  if (normalizedKey.startsWith("nome do local")) return "name";
  if (normalizedKey === "nome") return "name";
  if (normalizedKey === "titulo") return "title";
  if (normalizedKey === "endereco") return "address";
  if (normalizedKey === "cidade") return "city";
  if (normalizedKey === "estado") return "state";
  if (normalizedKey === "telefone" || normalizedKey === "fone") return "phone";
  if (normalizedKey.includes("url") && normalizedKey.includes("maps")) return "mapsUrl";
  if (normalizedKey.includes("categoria")) return "category";
  return undefined;
}

function parseSheetFile(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

        const rows: ImportRow[] = rawRows.map((raw) => {
          const row: Partial<ImportRow> = {};
          for (const key of Object.keys(raw)) {
            const normalizedKey = normalizeHeader(key);
            const field = matchField(normalizedKey);
            if (field) {
              const value = String(raw[key] ?? "").trim();
              if (value) row[field] = value;
            }
          }
          return row as ImportRow;
        });

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsBinaryString(file);
  });
}

export default function ProspeccaoIAPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads", { cache: "no-store" });
      if (!res.ok) {
        toast.error("Não foi possível carregar os leads.");
        return;
      }
      const data = await res.json();
      setLeads(data.items ?? []);
    } catch (err) {
      console.error("[prospeccao-ia] load", err);
      toast.error("Não foi possível conectar à API de leads.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const rows = await parseSheetFile(file);
      const validRows = rows.filter((r) => r.name && r.name.trim().length > 0);

      if (validRows.length === 0) {
        toast.error("Nenhuma linha válida encontrada na planilha (verifique a coluna 'Nome do Local').");
        return;
      }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao importar planilha.");
        return;
      }

      toast.success(
        `${data.imported} empresa(s) importada(s)${data.skipped > 0 ? `, ${data.skipped} ignorada(s) (vazia ou duplicada)` : ""}.`
      );
      loadLeads();
    } catch (err) {
      console.error("[prospeccao-ia] import", err);
      toast.error("Não foi possível ler o arquivo. Confirme que é um .xlsx ou .csv válido.");
    } finally {
      setImporting(false);
    }
  };

  const updateStatus = async (lead: Lead, status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error("Erro ao atualizar status.");
        loadLeads();
        return;
      }
      toast.success("Status atualizado!");
    } catch (err) {
      console.error("[prospeccao-ia] updateStatus", err);
      toast.error("Não foi possível conectar à API para atualizar o status.");
      loadLeads();
    }
  };

  const openLead = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setDialogOpen(true);
  };

  const categories = useMemo(
    () => Array.from(new Set(leads.map((l) => l.category).filter(Boolean))) as string[],
    [leads]
  );
  const cities = useMemo(
    () => Array.from(new Set(leads.map((l) => l.city).filter(Boolean))) as string[],
    [leads]
  );

  const filtered = leads.filter((l) => {
    const matchesQuery = (l.name + l.category + l.city + l.phone)
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesCategory = !categoryFilter || l.category === categoryFilter;
    const matchesCity = !cityFilter || l.city === cityFilter;
    const matchesStatus = !statusFilter || l.status === statusFilter;
    return matchesQuery && matchesCategory && matchesCity && matchesStatus;
  });

  const stats = useMemo(() => {
    const total = leads.length;
    const naoContatado = leads.filter((l) => l.status === "nao_contatado").length;
    const mensagemEnviada = leads.filter((l) => l.status !== "nao_contatado").length;
    const responderam = leads.filter((l) =>
      ["respondeu", "reuniao_marcada", "proposta_enviada", "cliente"].includes(l.status)
    ).length;
    const reunioes = leads.filter((l) =>
      ["reuniao_marcada", "proposta_enviada", "cliente"].includes(l.status)
    ).length;
    const propostas = leads.filter((l) => ["proposta_enviada", "cliente"].includes(l.status)).length;
    const clientes = leads.filter((l) => l.status === "cliente").length;
    const taxaConversao = total > 0 ? ((clientes / total) * 100).toFixed(1) : "0.0";
    return { total, naoContatado, mensagemEnviada, responderam, reunioes, propostas, clientes, taxaConversao };
  }, [leads]);

  const cards = [
    { label: "Leads Importados", value: stats.total, icon: Users },
    { label: "Não Contatados", value: stats.naoContatado, icon: PhoneOff },
    { label: "Mensagem Enviada", value: stats.mensagemEnviada, icon: Send },
    { label: "Responderam", value: stats.responderam, icon: MessageCircle },
    { label: "Reuniões", value: stats.reunioes, icon: CalendarCheck },
    { label: "Propostas", value: stats.propostas, icon: FileCheck2 },
    { label: "Clientes", value: stats.clientes, icon: Users },
    { label: "Taxa de Conversão", value: `${stats.taxaConversao}%`, icon: TrendingUp },
  ];

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Prospecção IA</h1>
            <p className="text-sm text-muted-foreground">{leads.length} empresas na base</p>
          </div>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={handleImportClick} disabled={importing}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {importing ? "Importando..." : "Importar Planilha"}
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <c.icon className="mb-2 h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-semibold tracking-tight">{c.value}</p>
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar empresa..."
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">Todas categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">Todas cidades</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">Todos status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-5 text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Empresa</th>
                    <th className="p-3 font-medium">Categoria</th>
                    <th className="p-3 font-medium">Cidade</th>
                    <th className="p-3 font-medium">Telefone</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Última ação</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => openLead(lead)}
                      className="cursor-pointer border-b border-border/60 transition-colors hover:bg-accent/40"
                    >
                      <td className="p-3 font-medium">{lead.name}</td>
                      <td className="p-3 text-muted-foreground">{lead.category || "—"}</td>
                      <td className="p-3 text-muted-foreground">{lead.city || "—"}</td>
                      <td className="p-3 text-muted-foreground">{lead.phone || "—"}</td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead, e.target.value as LeadStatus)}
                          className={cn(
                            "rounded-md border border-border/60 bg-card px-2 py-1 text-xs",
                          )}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                        <Badge variant={STATUS_VARIANT[lead.status]} className="ml-2 hidden">
                          {STATUS_LABEL[lead.status]}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3 text-right">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                        Nenhuma empresa encontrada. Importe uma planilha para começar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <LeadDetailDialog
        leadId={selectedLeadId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onChanged={loadLeads}
      />
    </DashboardShell>
  );
}