"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check, Plus, Trash2 } from "lucide-react";
import type { Contract, ChecklistItem } from "@/types";
import { useCollection } from "@/lib/hooks/use-collection";
import { DownloadSheetButton } from "@/components/shared/download-sheet-button";

export default function ChecklistPage() {
  const { items: contracts } = useCollection<Contract>("contratos");
  const { items: checklist, loading, create, update, remove } = useCollection<ChecklistItem>("checklist");
  const [contractId, setContractId] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");

  const activeContractId = contractId || contracts[0]?.id || "";
  const items = useMemo(
    () =>
      checklist
        .filter((i) => i.contractId === activeContractId)
        .sort((a, b) => a.order - b.order),
    [checklist, activeContractId]
  );
  const activeContract = contracts.find((c) => c.id === activeContractId);
  const done = items.filter((i) => i.done).length;

  const toggle = (item: ChecklistItem) => update(item.id, { done: !item.done } as Partial<ChecklistItem>);

  const addItem = async () => {
    if (!newTitle.trim() || !activeContractId) return;
    await create({
      contractId: activeContractId,
      title: newTitle.trim(),
      done: false,
      order: items.length,
    } as Omit<ChecklistItem, "id">);
    setNewTitle("");
  };

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Checklist</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento de entregáveis por contrato</p>
        </div>
        <DownloadSheetButton />
      </div>

      <div className="mb-4 max-w-xl">
        <Select value={activeContractId} onChange={(e) => setContractId(e.target.value)}>
          {contracts.map((c) => (
            <option key={c.id} value={c.id}>{c.title} — {c.clientName}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>{activeContract?.title ?? "Selecione um contrato"}</CardTitle>
            <p className="text-xs text-muted-foreground">{done}/{items.length || 0} etapas concluídas</p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-primary transition-all"
                style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {items.map((item) => (
              <div key={item.id} className="group flex w-full items-center gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent">
                <button onClick={() => toggle(item)} className="flex flex-1 items-center gap-3 text-left">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      item.done ? "border-primary-600 bg-gradient-primary" : "border-border"
                    )}
                  >
                    {item.done && <Check className="h-3.5 w-3.5 text-white" />}
                  </span>
                  <span className={cn("text-sm", item.done && "text-muted-foreground line-through")}>{item.title}</span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-danger opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => remove(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {items.length === 0 && <p className="px-2 py-2 text-sm text-muted-foreground">Nenhuma etapa cadastrada ainda.</p>}

            <div className="flex items-center gap-2 pt-2">
              <Input
                placeholder="Nova etapa..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
              />
              <Button variant="outline" onClick={addItem}><Plus className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}