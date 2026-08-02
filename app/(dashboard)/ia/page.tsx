"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sparkles, Loader2, Lightbulb, AlertTriangle, Gem, Palette } from "lucide-react";

interface Client {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  title: string;
  clientId: string;
}

interface PainPoint {
  pain: string;
  solution: string;
}

interface AiInsight {
  id: string;
  clientId: string;
  contractId: string | null;
  niche: string;
  observations: string | null;
  postIdeas: string[] | null;
  painPoints: PainPoint[] | null;
  differentiators: string[] | null;
  visualIdentitySuggestions: string[] | null;
  createdAt: string;
}

type OutputKey = "postIdeas" | "painPoints" | "differentiators" | "visualIdentitySuggestions";

const OUTPUT_OPTIONS: { key: OutputKey; label: string; icon: typeof Lightbulb }[] = [
  { key: "postIdeas", label: "Ideias de post", icon: Lightbulb },
  { key: "painPoints", label: "Dores do nicho", icon: AlertTriangle },
  { key: "differentiators", label: "Diferenciais", icon: Gem },
  { key: "visualIdentitySuggestions", label: "Identidade visual", icon: Palette },
];

function extractArray<T = unknown>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    const data = (payload as Record<string, unknown>).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}

export default function IaPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [history, setHistory] = useState<AiInsight[]>([]);

  const [clientId, setClientId] = useState("");
  const [contractId, setContractId] = useState("");
  const [niche, setNiche] = useState("");
  const [observations, setObservations] = useState("");
  const [outputs, setOutputs] = useState<OutputKey[]>(["postIdeas", "painPoints"]);

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiInsight | null>(null);

  useEffect(() => {
    fetch("/api/data/clientes")
      .then((r) => r.json())
      .then((data) => setClients(extractArray<Client>(data)))
      .catch(() => setClients([]));

    fetch("/api/data/contratos")
      .then((r) => r.json())
      .then((data) => setContracts(extractArray<Contract>(data)))
      .catch(() => setContracts([]));
  }, []);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/ai-insights");
      const data = await res.json();
      setHistory(extractArray<AiInsight>(data));
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleOutput = (key: OutputKey) => {
    setOutputs((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const clientContracts = contracts.filter((c) => c.clientId === clientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !niche.trim() || outputs.length === 0) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          contractId: contractId || undefined,
          niche,
          observations: observations || undefined,
          outputs,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao gerar insights");
      }

      const data: AiInsight = await res.json();
      setResult(data);
      setHistory((prev) => [data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar insights");
    } finally {
      setLoading(false);
    }
  };

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name || "—";

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">IVS AI</h1>
          <p className="text-sm text-muted-foreground">
            Gere ideias de post, análise de dores, diferenciais e identidade visual por cliente
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="space-y-4 p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Cliente *</label>
                <Select
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setContractId("");
                  }}
                >
                  <option value="">Selecione o cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Contrato (opcional)</label>
                <Select
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  disabled={!clientId}
                >
                  <option value="">Selecione o contrato</option>
                  {clientContracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Nicho *</label>
              <Input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Ex: clínica odontológica, restaurante japonês, academia..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Observações</label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Contexto adicional sobre o cliente, concorrentes, objetivos..."
                rows={3}
                className="w-full rounded-md border border-border bg-transparent p-2.5 text-sm outline-none focus:ring-1 focus:ring-primary-600"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">O que gerar *</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {OUTPUT_OPTIONS.map(({ key, label, icon: Icon }) => {
                  const active = outputs.includes(key);
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => toggleOutput(key)}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors ${
                        active
                          ? "border-primary-600 bg-primary-600/10"
                          : "border-border bg-muted/20 hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-primary-400" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loading || !clientId || !niche.trim() || outputs.length === 0}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Gerar com IA
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="mb-6 border-primary-600/40">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-primary-400">
              Resultado — {clientName(result.clientId)}
            </h2>
            <InsightBody insight={result} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-sm font-semibold">Histórico</h2>
          {loadingHistory ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum resultado gerado ainda.</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <details key={item.id} className="rounded-xl border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    {clientName(item.clientId)} — {item.niche} —{" "}
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </summary>
                  <div className="mt-3">
                    <InsightBody insight={item} />
                  </div>
                </details>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function InsightBody({ insight }: { insight: AiInsight }) {
  return (
    <div className="space-y-4 text-sm">
      {insight.postIdeas && (
        <div>
          <p className="mb-1 font-medium text-primary-400">Ideias de post</p>
          <ul className="list-inside list-disc space-y-1">
            {insight.postIdeas.map((idea, i) => (
              <li key={i}>{idea}</li>
            ))}
          </ul>
        </div>
      )}
      {insight.painPoints && (
        <div>
          <p className="mb-1 font-medium text-primary-400">Dores do nicho</p>
          <ul className="list-inside list-disc space-y-1">
            {insight.painPoints.map((p, i) => (
              <li key={i}>
                <span className="font-medium">{p.pain}:</span> {p.solution}
              </li>
            ))}
          </ul>
        </div>
      )}
      {insight.differentiators && (
        <div>
          <p className="mb-1 font-medium text-primary-400">Diferenciais</p>
          <ul className="list-inside list-disc space-y-1">
            {insight.differentiators.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
      {insight.visualIdentitySuggestions && (
        <div>
          <p className="mb-1 font-medium text-primary-400">Identidade visual</p>
          <ul className="list-inside list-disc space-y-1">
            {insight.visualIdentitySuggestions.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}