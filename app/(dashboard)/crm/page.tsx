"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CrmDeal, CrmStage } from "@/types";
import { useCollection } from "@/lib/hooks/use-collection";
import { EntityFormDialog, type FieldConfig } from "@/components/shared/entity-form-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DownloadSheetButton } from "@/components/shared/download-sheet-button";

const STAGES: { key: CrmStage; label: string }[] = [
  { key: "novo_lead", label: "Novo Lead" },
  { key: "contato", label: "Contato" },
  { key: "reuniao", label: "Reunião" },
  { key: "orcamento", label: "Orçamento" },
  { key: "negociacao", label: "Negociação" },
  { key: "fechado", label: "Fechado" },
  { key: "producao", label: "Produção" },
  { key: "entrega", label: "Entrega" },
  { key: "pos_venda", label: "Pós-venda" },
];

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Título do negócio", type: "text", required: true, colSpan: 2 },
  { name: "clientName", label: "Cliente", type: "text", required: true },
  { name: "value", label: "Valor (R$)", type: "number" },
  { name: "owner", label: "Responsável", type: "text" },
  {
    name: "stage",
    label: "Estágio",
    type: "select",
    required: true,
    options: STAGES.map((s) => ({ value: s.key, label: s.label })),
  },
];

export default function CrmPage() {
  const { items: deals, loading, create, update, remove } = useCollection<CrmDeal>("negocios");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CrmDeal | null>(null);
  const [deleting, setDeleting] = useState<CrmDeal | null>(null);

  const total = deals.reduce((sum, d) => sum + d.value, 0);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (d: CrmDeal) => { setEditing(d); setFormOpen(true); };

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
          <p className="text-sm text-muted-foreground">
            {deals.length} negócios em andamento · {formatCurrency(total)} em pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <DownloadSheetButton />
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo negócio</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage.key);
            const stageTotal = stageDeals.reduce((s, d) => s + d.value, 0);
            return (
              <div key={stage.key} className="w-72 shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <h3 className="text-sm font-medium text-muted-foreground">{stage.label}</h3>
                  <span className="text-xs text-muted-foreground">{stageDeals.length}</span>
                </div>
                <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-2 min-h-[120px]">
                  {stageDeals.map((deal) => (
                    <Card key={deal.id} className="group relative transition-colors hover:border-primary-600/40">
                      <CardContent className="p-3.5">
                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(deal)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-danger" onClick={() => setDeleting(deal)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="pr-10 text-sm font-medium leading-tight">{deal.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{deal.clientName}</p>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-sm font-semibold text-primary-300">{formatCurrency(deal.value)}</span>
                          <span className="text-[11px] text-muted-foreground">{formatDate(deal.updatedAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stageTotal > 0 && (
                    <p className="px-1 pt-1 text-[11px] text-muted-foreground">{formatCurrency(stageTotal)} no estágio</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Editar negócio" : "Novo negócio"}
        fields={FIELDS}
        initialValues={editing ?? undefined}
        onSubmit={async (values) => {
          if (editing) {
            return await update(editing.id, values as Partial<CrmDeal>);
          }
          return await create({ ...(values as Omit<CrmDeal, "id" | "updatedAt">), updatedAt: new Date().toISOString() } as Omit<CrmDeal, "id">);
        }}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        itemName={deleting?.title}
        onConfirm={() => deleting && remove(deleting.id)}
      />
    </DashboardShell>
  );
}
