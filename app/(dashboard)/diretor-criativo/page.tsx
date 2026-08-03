"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wand2, Send, History, Plus, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
}

interface DbMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Olá! Sou o Diretor Criativo. Me descreva o post (tema, cliente, objetivo) que eu já te devolvo uma legenda pronta com hashtags.",
};

export default function DiretorCriativoPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/creative");
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data as ConversationSummary[]);
    } catch {
      // silencioso: lista de histórico não é crítica pro chat funcionar
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const openConversation = async (id: string) => {
    if (id === conversationId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/creative?conversationId=${id}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as DbMessage[];

      const loaded: Message[] = data
        .filter((m) => m.content !== "[imagem gerada]")
        .map((m) => ({ id: m.id, role: m.role, content: m.content }));

      setConversationId(id);
      setMessages(loaded.length > 0 ? loaded : [WELCOME_MESSAGE]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Não consegui carregar essa conversa. Tenta de novo.",
        },
      ]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar mensagem");
      }

      const isNewConversation = !conversationId;
      setConversationId(data.conversationId);

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.message },
      ]);

      if (isNewConversation) {
        loadConversations();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            err instanceof Error
              ? `Ocorreu um erro: ${err.message}`
              : "Ocorreu um erro ao processar sua mensagem.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setConversationId(undefined);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Beleza, vamos criar outra legenda. Me descreve o post.",
      },
    ]);
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow">
            <Wand2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Diretor Criativo</h1>
            <p className="text-sm text-muted-foreground">
              Legendas prontas para posts, com hashtags sugeridas
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={startNewConversation}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nova conversa
        </Button>
      </div>

      <div className="flex h-[70vh] gap-4">
        <aside className="hidden w-64 shrink-0 flex-col md:flex">
          <Card className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <History className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Histórico</p>
            </div>
            <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-2">
              {conversations.length === 0 && (
                <p className="p-2 text-xs text-muted-foreground">
                  Suas legendas anteriores vão aparecer aqui.
                </p>
              )}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className={cn(
                    "w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    c.id === conversationId
                      ? "bg-gradient-primary text-white"
                      : "text-foreground hover:bg-muted/50"
                  )}
                  title={c.title}
                >
                  {c.title || "Sem título"}
                </button>
              ))}
            </div>
          </Card>
        </aside>

        <Card className="flex flex-1 flex-col">
          <CardContent className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-5">
            {loadingHistory && (
              <p className="text-center text-xs text-muted-foreground">Carregando conversa...</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "group relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-gradient-primary text-white"
                      : "border border-border bg-muted/30 text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.role === "assistant" && m.id !== "welcome" && (
                    <button
                      onClick={() => copyMessage(m.id, m.content)}
                      className="mt-2 flex items-center gap-1.5 rounded-md border border-border/50 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="h-3 w-3" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copiar legenda
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted/30 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-400"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
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
                placeholder="Ex: post sobre bastidores de gravação para cliente X..."
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}