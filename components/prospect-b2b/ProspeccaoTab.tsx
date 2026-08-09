"use client";

import { useEffect, useState } from "react";
import { MessageSquareText, CheckCircle2, Clock } from "lucide-react";

interface QueueItem {
  id: string;
  empresa: string;
  telefone: string; // esperado já em formato E.164 sem "+", ex: 5511999999999
  nicho: string;
  messageId: 1 | 2 | 3;
  text: string;
}

interface QueueResponse {
  windowOpen: boolean;
  reason?: string;
  queue: QueueItem[];
  contatadosHoje: number;
  restanteHoje: number;
}

export default function ProspeccaoTab() {
  const [data, setData] = useState<QueueResponse | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/prospect-b2b/prospeccao")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function abrirWhatsApp(item: QueueItem) {
    // Marca como contatado e registra no histórico ANTES de abrir o link,
    // pra não depender do usuário voltar à aba pra confirmar o envio.
    await fetch("/api/prospect-b2b/prospeccao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: item.id, messageId: item.messageId, text: item.text }),
    });
    setSentIds((prev) => new Set(prev).add(item.id));
    window.open(`https://wa.me/${item.telefone}?text=${encodeURIComponent(item.text)}`, "_blank");
  }

  if (loading) return <p className="text-sm text-ivs-muted p-4">Carregando fila do dia…</p>;
  if (!data) return null;

  if (!data.windowOpen) {
    return (
      <div className="card p-8 text-center">
        <Clock size={24} className="mx-auto text-ivs-muted mb-3" />
        <p className="text-sm text-ivs-muted">{data.reason}</p>
        <p className="text-xs text-ivs-muted/70 mt-1">
          Prospecção roda de segunda a sábado, a partir das 9h (horário de Brasília).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ivs-muted">
          {data.contatadosHoje}/30 contatados hoje · {data.restanteHoje} vagas restantes na fila
        </p>
      </div>

      <div className="space-y-2">
        {data.queue.map((item) => {
          const done = sentIds.has(item.id);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-ivs-surface2 border border-ivs-border p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-ivs-purple/15 flex items-center justify-center shrink-0">
                  <MessageSquareText size={14} className="text-ivs-purple2" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.empresa}</p>
                  <p className="text-xs text-ivs-muted truncate">
                    {item.nicho} · Mensagem {item.messageId}
                  </p>
                </div>
              </div>
              {done ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 shrink-0">
                  <CheckCircle2 size={13} /> Enviado
                </span>
              ) : (
                <button onClick={() => abrirWhatsApp(item)} className="btn-primary text-xs py-1.5 px-3 shrink-0">
                  Abrir no WhatsApp
                </button>
              )}
            </div>
          );
        })}
        {data.queue.length === 0 && (
          <p className="text-sm text-ivs-muted p-4">
            Nenhum lead novo disponível hoje. Importe mais leads para continuar.
          </p>
        )}
      </div>
    </div>
  );
}
