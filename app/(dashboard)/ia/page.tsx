"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, FileText, Calendar, MessageSquareText, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  { icon: FileText, label: "Gerar proposta comercial" },
  { icon: Calendar, label: "Criar cronograma de produção" },
  { icon: MessageSquareText, label: "Resumir última reunião" },
  { icon: ListTodo, label: "Criar tarefas para o projeto" },
];

export default function IaPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Eu sou a IVS AI. Posso gerar propostas, contratos, cronogramas, roteiros, legendas, resumir reuniões, criar tarefas e responder dúvidas sobre a agência. Como posso ajudar?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Integração real com IA via API (/api/ai) deve ser conectada aqui.
    await new Promise((r) => setTimeout(r, 900));
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Esta é uma resposta de demonstração. Para respostas reais, conecte a IVS AI a um endpoint de modelo (ex: Claude via API) em /api/ai.",
      },
    ]);
    setLoading(false);
  };

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">IVS AI</h1>
          <p className="text-sm text-muted-foreground">Assistente integrado da agência</p>
        </div>
      </div>

      <Card className="flex h-[68vh] flex-col">
        <CardContent className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-gradient-primary text-white"
                    : "border border-border bg-muted/30 text-foreground"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted/30 px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-400" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}

          {messages.length === 1 && (
            <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.label)}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/20 p-3 text-left text-sm transition-colors hover:border-primary-600/50 hover:bg-accent"
                >
                  <s.icon className="h-4 w-4 text-primary-400" />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </CardContent>

        <div className="border-t border-border p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte algo à IVS AI..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </DashboardShell>
  );
}
