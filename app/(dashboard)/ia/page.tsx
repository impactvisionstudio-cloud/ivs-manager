"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: AiResult;
}

interface Competitor {
  name: string;
  handle: string;
  followers: string;
  note: string;
}

interface PainPoint {
  pain: string;
  solution: string;
}

interface AiResult {
  niche: string;
  hasInstagram: boolean;
  hasVisualIdentity: boolean;
  competitors: Competitor[];
  postIdeas: string[];
  painPoints: PainPoint[];
  instagramNameSuggestions: string[] | null;
  visualIdentityTips: string[] | null;
}

export default function IaPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou a IVS AI. Me diga o nicho ou cliente que você quer analisar usando @ (ex: \"@Academia Santiago\") que eu já começo a te fazer as perguntas.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar mensagem");
      }

      setConversationId(data.conversationId);

      if (data.done && data.result) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Aqui está a análise completa para ${data.result.niche}:`,
            result: data.result as AiResult,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: data.message },
        ]);
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
        content:
          "Beleza, vamos começar outra análise. Me diga o nicho ou cliente usando @ (ex: \"@Power Fit\").",
      },
    ]);
  };

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">IVS AI</h1>
            <p className="text-sm text-muted-foreground">
              Análise de nicho, concorrentes e estratégia de conteúdo
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={startNewConversation}>
          Nova conversa
        </Button>
      </div>

      <Card className="flex h-[70vh] flex-col">
        <CardContent className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-gradient-primary text-white"
                    : "border border-border bg-muted/30 text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.result && <ResultView result={m.result} />}
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
              placeholder='Ex: "@Academia Santiago" ou responda as perguntas...'
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

function ResultView({ result }: { result: AiResult }) {
  return (
    <div className="mt-3 space-y-4 border-t border-border/50 pt-3">
      <section>
        <p className="mb-1.5 font-medium text-primary-400">Top 10 concorrentes</p>
        <ul className="space-y-1">
          {result.competitors?.map((c, i) => (
            <li key={i}>
              <span className="font-medium">{c.name}</span>{" "}
              <span className="text-muted-foreground">({c.handle} — {c.followers})</span>
              {c.note && <span className="text-muted-foreground"> — {c.note}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="mb-1.5 font-medium text-primary-400">10 ideias de post</p>
        <ul className="list-inside list-disc space-y-1">
          {result.postIdeas?.map((idea, i) => (
            <li key={i}>{idea}</li>
          ))}
        </ul>
      </section>

      <section>
        <p className="mb-1.5 font-medium text-primary-400">Dores do nicho</p>
        <ul className="list-inside list-disc space-y-1">
          {result.painPoints?.map((p, i) => (
            <li key={i}>
              <span className="font-medium">{p.pain}:</span> {p.solution}
            </li>
          ))}
        </ul>
      </section>

      {!result.hasInstagram && result.instagramNameSuggestions && (
        <section>
          <p className="mb-1.5 font-medium text-primary-400">Sugestões de nome pro Instagram</p>
          <ul className="list-inside list-disc space-y-1">
            {result.instagramNameSuggestions.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      {!result.hasVisualIdentity && result.visualIdentityTips && (
        <section>
          <p className="mb-1.5 font-medium text-primary-400">Dicas de identidade visual</p>
          <ul className="list-inside list-disc space-y-1">
            {result.visualIdentityTips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}