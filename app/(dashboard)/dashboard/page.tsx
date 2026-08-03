"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Pencil, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/auth-store";
import { cn } from "@/lib/utils";
import { useDashboardMessageStore, type TitleSize } from "@/lib/store/dashboard-message-store";
import { getHourlyVerse } from "@/lib/data/bible-verses";

const currentMonthName = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date());

const titleSizeClasses: Record<TitleSize, string> = {
  sm: "text-2xl sm:text-3xl",
  md: "text-3xl sm:text-4xl",
  lg: "text-4xl sm:text-5xl",
  xl: "text-5xl sm:text-6xl",
};

function useHourlyVerse() {
  const [verse, setVerse] = useState(() => getHourlyVerse());

  useEffect(() => {
    const msUntilNextHour =
      3600000 - (Date.now() % 3600000);

    const timeout = setTimeout(() => {
      setVerse(getHourlyVerse());
    }, msUntilNextHour + 1000);

    const interval = setInterval(() => {
      setVerse(getHourlyVerse());
    }, 3600000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return verse;
}

function DashboardHero() {
  const user = useAuthStore((s) => s.user);
  const { purposePhrase, monthMessage, titleSize, setMessages } = useDashboardMessageStore();
  const verse = useHourlyVerse();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ purposePhrase, monthMessage, titleSize });

  const firstName = user?.name?.split(" ")[0] ?? "";

  function startEditing() {
    setDraft({ purposePhrase, monthMessage, titleSize });
    setIsEditing(true);
  }

  function save() {
    setMessages(draft);
    setIsEditing(false);
  }

  function cancel() {
    setIsEditing(false);
  }

  return (
    <div className="relative min-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl bg-black p-8 sm:p-12">
      <button
        type="button"
        onClick={isEditing ? cancel : startEditing}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
        aria-label={isEditing ? "Cancelar edição" : "Editar frases"}
      >
        {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-full max-w-2xl flex-col items-center justify-center text-center mx-auto"
      >
        <h1 className={cn("font-bold tracking-tight text-primary-400", titleSizeClasses[titleSize])}>
          Seja Bem-vindo, {firstName}
        </h1>

        {!isEditing ? (
          <>
            <p className="mt-6 text-base italic leading-relaxed text-white/85 sm:text-lg">
              &ldquo;{verse.text}&rdquo;{" "}
              <span className="not-italic text-white/50">{verse.ref}</span>
            </p>
            <p className="mt-4 text-xs font-medium text-white/70 sm:text-sm">
              {purposePhrase}
            </p>
            <p className="mt-2 text-xs uppercase tracking-wide text-white/40">
              {monthMessage || `${currentMonthName} é o nosso mês.`}
            </p>
          </>
        ) : (
          <div className="mt-6 flex w-full flex-col gap-3 text-left">
            <label className="flex flex-col gap-1 text-xs text-white/60">
              Tamanho do título
              <select
                value={draft.titleSize}
                onChange={(e) => setDraft((d) => ({ ...d, titleSize: e.target.value as TitleSize }))}
                className="rounded-lg border border-white/20 bg-white/5 p-2 text-sm text-white outline-none focus:border-white/40"
              >
                <option value="sm">Pequeno</option>
                <option value="md">Médio</option>
                <option value="lg">Grande</option>
                <option value="xl">Extra grande</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-white/60">
              Frase de propósito
              <input
                value={draft.purposePhrase}
                onChange={(e) => setDraft((d) => ({ ...d, purposePhrase: e.target.value }))}
                className="rounded-lg border border-white/20 bg-white/5 p-2 text-sm text-white outline-none focus:border-white/40"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-white/60">
              Mensagem do mês
              <input
                value={draft.monthMessage}
                onChange={(e) => setDraft((d) => ({ ...d, monthMessage: e.target.value }))}
                className="rounded-lg border border-white/20 bg-white/5 p-2 text-sm text-white outline-none focus:border-white/40"
              />
            </label>
            <p className="text-[11px] text-white/40">
              O versículo troca automaticamente a cada hora e não é mais editável aqui.
            </p>
            <button
              type="button"
              onClick={save}
              className="mt-1 flex w-fit items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-500"
            >
              <Check className="h-3.5 w-3.5" />
              Salvar
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHero />
    </DashboardShell>
  );
}