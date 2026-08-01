"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Download, ClipboardList, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

// ── Perguntas do diagnóstico ─────────────────────────────────────────────
// Regra de pontuação combinada: Sim = 0, Mais ou menos/Parcial = 5, Não = 10
// (perguntas sem meio-termo natural ficam só com Sim=0 / Não=10)
type QuestionOption = { value: string; label: string; points: number };
type Question = {
  id: string;
  label: string;
  options: QuestionOption[];
  opportunity: { title: string; impact: "Alto" | "Médio" };
};

const QUESTIONS: Question[] = [
  {
    id: "site",
    label: "Possui site profissional?",
    options: [
      { value: "sim", label: "Sim", points: 0 },
      { value: "nao", label: "Não", points: 10 },
    ],
    opportunity: { title: "Criação de site profissional", impact: "Alto" },
  },
  {
    id: "identidadeVisual",
    label: "Possui identidade visual profissional?",
    options: [
      { value: "sim", label: "Sim", points: 0 },
      { value: "parcial", label: "Parcial", points: 5 },
      { value: "nao", label: "Não", points: 10 },
    ],
    opportunity: { title: "Identidade visual profissional", impact: "Alto" },
  },
  {
    id: "instagram",
    label: "Como está o Instagram?",
    options: [
      { value: "sempre", label: "Posta sempre", points: 0 },
      { value: "as_vezes", label: "Posta às vezes", points: 5 },
      { value: "nao_posta", label: "Não tem ou não posta", points: 10 },
    ],
    opportunity: { title: "Gestão de redes sociais", impact: "Alto" },
  },
  {
    id: "anunciosPagos",
    label: "Faz anúncios pagos?",
    options: [
      { value: "sim", label: "Sim", points: 0 },
      { value: "as_vezes", label: "Às vezes", points: 5 },
      { value: "nunca", label: "Nunca", points: 10 },
    ],
    opportunity: { title: "Gestão de tráfego pago", impact: "Alto" },
  },
  {
    id: "fotosVideos",
    label: "Utiliza fotos e vídeos profissionais?",
    options: [
      { value: "sim", label: "Sim", points: 0 },
      { value: "nao", label: "Não", points: 10 },
    ],
    opportunity: { title: "Produção audiovisual", impact: "Alto" },
  },
  {
    id: "clientesPorDia",
    label: "Quantos clientes por dia?",
    options: [
      { value: "mais_20", label: "Mais de 20", points: 0 },
      { value: "10_20", label: "Entre 10 e 20", points: 5 },
      { value: "ate_10", label: "Até 10", points: 10 },
    ],
    opportunity: { title: "Estratégia de captação de clientes", impact: "Médio" },
  },
  {
    id: "whatsapp",
    label: "O WhatsApp é comercial e organizado?",
    options: [
      { value: "sim", label: "Sim", points: 0 },
      { value: "nao", label: "Não", points: 10 },
    ],
    opportunity: { title: "Integração para WhatsApp", impact: "Médio" },
  },
  {
    id: "google",
    label: "A empresa aparece bem no Google?",
    options: [
      { value: "sim", label: "Sim", points: 0 },
      { value: "mais_ou_menos", label: "Mais ou menos", points: 5 },
      { value: "nao", label: "Não", points: 10 },
    ],
    opportunity: { title: "Google Meu Negócio otimizado", impact: "Médio" },
  },
  {
    id: "clientesInternet",
    label: "Os clientes chegam pela internet?",
    options: [
      { value: "sempre", label: "Sempre", points: 0 },
      { value: "as_vezes", label: "Às vezes", points: 5 },
      { value: "quase_nunca", label: "Quase nunca", points: 10 },
    ],
    opportunity: { title: "Criação de conteúdo", impact: "Alto" },
  },
  {
    id: "marketingAntes",
    label: "Já contratou marketing antes?",
    options: [
      { value: "sim", label: "Sim", points: 0 },
      { value: "nunca", label: "Nunca", points: 10 },
    ],
    opportunity: { title: "Consultoria de marketing estratégico", impact: "Médio" },
  },
];

interface Answer {
  questionId: string;
  question: string;
  answer: string;
  points: number;
}

interface Opportunity {
  title: string;
  impact: "Alto" | "Médio";
}

interface DiagnosticForm {
  companyName: string;
  responsible: string;
  phone: string;
  address: string;
  segment: string;
  city: string;
  marketTime: string;
  consultant: string;
  [questionId: string]: string;
}

interface Diagnostic {
  id: string;
  companyName: string;
  responsible: string | null;
  phone: string | null;
  address: string | null;
  segment: string | null;
  city: string | null;
  marketTime: string | null;
  consultant: string | null;
  protocol: string;
  answers: Answer[];
  opportunities: Opportunity[];
  score: number;
  expiresAt: string | null;
  createdAt: string;
}

const EMPTY_FORM: DiagnosticForm = {
  companyName: "",
  responsible: "",
  phone: "",
  address: "",
  segment: "",
  city: "",
  marketTime: "",
  consultant: "",
  ...Object.fromEntries(QUESTIONS.map((q) => [q.id, q.options[0].value])),
};

function levelFromScore(score: number) {
  if (score >= 71) return { label: "Urgência alta", color: "text-danger" };
  if (score >= 41) return { label: "Urgência média", color: "text-warning" };
  return { label: "Urgência baixa", color: "text-success" };
}

function pointColor(points: number) {
  if (points === 0) return "#16a34a";
  if (points <= 5) return "#d97706";
  return "#dc2626";
}

function impactColor(impact: string) {
  return impact === "Alto" ? "#7c3aed" : "#d97706";
}

export default function CrmPage() {
  const [form, setForm] = useState<DiagnosticForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Diagnostic | null>(null);
  const [history, setHistory] = useState<Diagnostic[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/diagnostics", { cache: "no-store" });
      const data = await res.json();
      setHistory(data.items ?? []);
    } catch (err) {
      console.error("[diagnostics] loadHistory", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const setField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const buildAnswers = (f: DiagnosticForm): Answer[] =>
    QUESTIONS.map((q) => {
      const chosen = q.options.find((o) => o.value === f[q.id]) ?? q.options[0];
      return { questionId: q.id, question: q.label, answer: chosen.label, points: chosen.points };
    });

  const buildOpportunities = (answers: Answer[]): Opportunity[] => {
    const map = new Map<string, Opportunity>();
    for (const a of answers) {
      if (a.points === 0) continue;
      const q = QUESTIONS.find((q) => q.id === a.questionId);
      if (!q) continue;
      const existing = map.get(q.opportunity.title);
      if (!existing || (existing.impact !== "Alto" && q.opportunity.impact === "Alto")) {
        map.set(q.opportunity.title, { ...q.opportunity });
      }
    }
    return Array.from(map.values());
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (d: Diagnostic) => {
    const next: DiagnosticForm = {
      companyName: d.companyName,
      responsible: d.responsible || "",
      phone: d.phone || "",
      address: d.address || "",
      segment: d.segment || "",
      city: d.city || "",
      marketTime: d.marketTime || "",
      consultant: d.consultant || "",
      ...Object.fromEntries(
        QUESTIONS.map((q) => {
          const saved = d.answers?.find((a) => a.questionId === q.id);
          const opt = q.options.find((o) => o.label === saved?.answer);
          return [q.id, opt?.value ?? q.options[0].value];
        })
      ),
    };
    setForm(next);
    setEditingId(d.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que quer apagar esse diagnóstico? Essa ação não pode ser desfeita.")) return;
    try {
      const res = await fetch(`/api/diagnostics/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao apagar diagnóstico");
      if (result?.id === id) setResult(null);
      loadHistory();
    } catch (err) {
      console.error("[diagnostics] delete", err);
      alert("Erro ao apagar diagnóstico");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const answers = buildAnswers(form);
      const score = answers.reduce((sum, a) => sum + a.points, 0);
      const opportunities = buildOpportunities(answers);

      const payload = {
        companyName: form.companyName,
        responsible: form.responsible || null,
        phone: form.phone || null,
        address: form.address || null,
        segment: form.segment || null,
        city: form.city || null,
        marketTime: form.marketTime || null,
        consultant: form.consultant || null,
        answers,
        opportunities,
        score,
      };

      const isEdit = Boolean(editingId);
      const res = await fetch(isEdit ? `/api/diagnostics/${editingId}` : "/api/diagnostics", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erro ao salvar diagnóstico");
      }

      const data = await res.json();
      setResult(data.item);
      resetForm();
      loadHistory();
    } catch (err) {
      console.error("[diagnostics] submit", err);
      alert(err instanceof Error ? err.message : "Erro ao calcular diagnóstico");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Diagnóstico Comercial</h1>
        <p className="text-sm text-muted-foreground">
          Responda as perguntas para gerar a análise de urgência do cliente
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:hidden">
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 text-sm font-semibold">
              {editingId ? "Editando diagnóstico" : "Dados da empresa"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Empresa *</Label>
                <Input id="companyName" required value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="responsible">Responsável</Label>
                  <Input id="responsible" value={form.responsible} onChange={(e) => setField("responsible", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Endereço (matriz)</Label>
                <Input id="address" value={form.address} onChange={(e) => setField("address", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="segment">Segmento</Label>
                  <Input id="segment" value={form.segment} onChange={(e) => setField("segment", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={form.city} onChange={(e) => setField("city", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="marketTime">Tempo de mercado</Label>
                  <Input id="marketTime" value={form.marketTime} onChange={(e) => setField("marketTime", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="consultant">Consultor</Label>
                  <Input id="consultant" value={form.consultant} onChange={(e) => setField("consultant", e.target.value)} />
                </div>
              </div>

              <div className="border-t border-border/60 pt-4">
                <h2 className="mb-3 text-sm font-semibold">Dados para análise</h2>
                <div className="space-y-3">
                  {QUESTIONS.map((q) => (
                    <div key={q.id} className="flex items-center justify-between gap-3">
                      <Label htmlFor={q.id}>{q.label}</Label>
                      <Select id={q.id} value={form[q.id]} onChange={(e) => setField(q.id, e.target.value)} className="w-40">
                        {q.options.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Calculando..." : editingId ? "Salvar edição" : "Calcular diagnóstico"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 text-sm font-semibold">Resultado</h2>
            {!result ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <ClipboardList className="h-8 w-8" />
                Preencha o formulário ao lado para ver o resultado do diagnóstico
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Pontuação</p>
                  <p className="text-4xl font-bold">{result.score}<span className="text-lg text-muted-foreground">/100</span></p>
                  <p className={`mt-1 text-sm font-medium ${levelFromScore(result.score).color}`}>
                    {levelFromScore(result.score).label}
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Empresa:</span> {result.companyName}</p>
                  {result.responsible && <p><span className="text-muted-foreground">Responsável:</span> {result.responsible}</p>}
                  {result.segment && <p><span className="text-muted-foreground">Segmento:</span> {result.segment}</p>}
                  <p><span className="text-muted-foreground">Protocolo:</span> {result.protocol}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={handlePrint}>
                  <Download className="h-4 w-4" /> Baixar PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Área usada só na hora de imprimir/gerar o PDF */}
      {result && (
        <div className="hidden print:block" style={{ fontFamily: "Arial, sans-serif", color: "#1a1a1a" }}>
          {/* Cabeçalho */}
          <div style={{ display: "flex", alignItems: "stretch", gap: "0" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: "20px" }}>
              <p style={{ fontSize: "22px", fontWeight: 800, color: "#4c1d95", letterSpacing: "1px" }}>IVS</p>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "#4c1d95" }}>IMPACT VISION STUDIO</p>
            </div>
            <div
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #4c1d95, #7c3aed)",
                color: "#ffffff",
                borderRadius: "10px",
                padding: "16px 22px",
                display: "grid",
                gridTemplateColumns: "1.3fr 1.3fr 1fr",
                gap: "10px",
                fontSize: "11px",
              }}
            >
              <div style={{ lineHeight: 1.9 }}>
                <p><strong>EMPRESA:</strong> {result.companyName}</p>
                <p><strong>RESPONSÁVEL:</strong> {result.responsible || "-"}</p>
                <p><strong>TELEFONE:</strong> {result.phone || "-"}</p>
              </div>
              <div style={{ lineHeight: 1.9 }}>
                <p><strong>SEGMENTO:</strong> {result.segment || "-"}</p>
                <p><strong>CIDADE:</strong> {result.city || "-"}</p>
                <p><strong>TEMPO DE MERCADO:</strong> {result.marketTime || "-"}</p>
              </div>
              <div style={{ lineHeight: 1.9 }}>
                <p><strong>PROTOCOLO:</strong> {result.protocol}</p>
                <p><strong>CONSULTOR:</strong> {result.consultant || "-"}</p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right", fontSize: "10px", color: "#666", marginTop: "10px" }}>
            {result.expiresAt && <p>Expira em 4 horas · {formatDate(result.expiresAt)}</p>}
            <p style={{ opacity: 0.6 }}>[{result.id}]</p>
          </div>

          {/* Duas colunas: situação e oportunidades */}
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "16px", marginTop: "16px" }}>
            <div style={{ border: "1px solid #e5e5e5", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ background: "#4c1d95", color: "#fff", padding: "8px 14px", fontSize: "12px", fontWeight: 700 }}>
                SITUAÇÃO ATUAL DA EMPRESA
              </div>
              <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #eee", color: "#888" }}>
                    <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 600 }}>ITEM AVALIADO</th>
                    <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 600 }}>SITUAÇÃO</th>
                    <th style={{ textAlign: "right", padding: "6px 10px", fontWeight: 600 }}>PONTOS</th>
                  </tr>
                </thead>
                <tbody>
                  {result.answers.map((a) => (
                    <tr key={a.questionId} style={{ borderBottom: "1px solid #f3f3f3" }}>
                      <td style={{ padding: "6px 10px" }}>{a.question}</td>
                      <td style={{ padding: "6px 10px", fontWeight: 700, color: pointColor(a.points) }}>{a.answer.toUpperCase()}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: pointColor(a.points) }}>+{a.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#faf9fc" }}>
                <span style={{ fontWeight: 700, color: "#4c1d95" }}>PONTUAÇÃO TOTAL</span>
                <span style={{ fontSize: "24px", fontWeight: 800, color: "#4c1d95" }}>
                  {result.score}<span style={{ fontSize: "12px", color: "#999" }}>/100</span>
                </span>
              </div>
            </div>

            <div>
              <div style={{ border: "1px solid #e5e5e5", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ background: "#4c1d95", color: "#fff", padding: "8px 14px", fontSize: "12px", fontWeight: 700 }}>
                  OPORTUNIDADES ENCONTRADAS
                </div>
                <div style={{ padding: "8px 0" }}>
                  {result.opportunities.length === 0 ? (
                    <p style={{ padding: "10px 14px", fontSize: "11px", color: "#888" }}>Nenhuma oportunidade crítica identificada.</p>
                  ) : (
                    result.opportunities.map((o) => (
                      <div key={o.title} style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", fontSize: "11px", borderBottom: "1px solid #f3f3f3" }}>
                        <span>{o.title.toUpperCase()}</span>
                        <span style={{ fontWeight: 700, color: impactColor(o.impact) }}>{o.impact.toUpperCase()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ border: "2px solid #4c1d95", borderRadius: "10px", padding: "14px", marginTop: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#4c1d95", marginBottom: "6px" }}>ANÁLISE ESTRATÉGICA</p>
                <p style={{ fontSize: "11px", lineHeight: 1.5 }}>
                  {levelFromScore(result.score).label === "Urgência alta"
                    ? "Sua empresa possui muitas oportunidades de crescimento e visibilidade no digital. As estratégias certas podem aumentar sua presença online, atrair mais clientes e fortalecer sua marca."
                    : levelFromScore(result.score).label === "Urgência média"
                    ? "Sua empresa já tem uma base construída, mas ainda existem pontos importantes a melhorar para aumentar a presença digital e a captação de clientes."
                    : "Sua empresa está bem estruturada no digital. Ainda assim, pequenos ajustes pontuais podem elevar ainda mais os resultados."}
                </p>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#4c1d95", marginTop: "8px" }}>
                  A decisão de evoluir está em suas mãos.
                </p>
              </div>
            </div>
          </div>

          <p style={{ marginTop: "20px", fontSize: "9px", color: "#999", textAlign: "center" }}>
            Este relatório é confidencial e de uso exclusivo da empresa analisada. Proibida a reprodução total ou parcial.
          </p>
        </div>
      )}

      <div className="mt-8 print:hidden">
        <h2 className="mb-3 text-sm font-semibold">Diagnósticos anteriores</h2>
        {loadingHistory ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum diagnóstico realizado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {history.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{d.companyName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => startEdit(d)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Apagar"
                        onClick={() => handleDelete(d.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className={`mt-2 text-sm font-medium ${levelFromScore(d.score).color}`}>
                    {d.score}/100 · {levelFromScore(d.score).label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}