"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Camera, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Equipment } from "@/types";
import { useCollection } from "@/lib/hooks/use-collection";
import { EntityFormDialog, type FieldConfig } from "@/components/shared/entity-form-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DownloadSheetButton } from "@/components/shared/download-sheet-button";

const statusVariant: Record<Equipment["status"], "success" | "warning" | "danger"> = {
  disponivel: "success",
  em_uso: "warning",
  manutencao: "danger",
};

const statusLabel: Record<Equipment["status"], string> = {
  disponivel: "Disponível",
  em_uso: "Em uso",
  manutencao: "Manutenção",
};

const FIELDS: FieldConfig[] = [
  { name: "name", label: "Nome do equipamento", type: "text", required: true, colSpan: 2 },
  { name: "category", label: "Categoria", type: "text" },
  { name: "serialNumber", label: "Número de série", type: "text" },
  { name: "value", label: "Valor (R$)", type: "number" },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: [
      { value: "disponivel", label: "Disponível" },
      { value: "em_uso", label: "Em uso" },
      { value: "manutencao", label: "Manutenção" },
    ],
  },
];

export default function EquipamentosPage() {
  const { items: equipments, loading, create, update, remove } = useCollection<Equipment>("equipamentos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [deleting, setDeleting] = useState<Equipment | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (eq: Equipment) => { setEditing(eq); setFormOpen(true); };

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipamentos</h1>
          <p className="text-sm text-muted-foreground">{equipments.length} itens no inventário</p>
        </div>
        <div className="flex gap-2">
          <DownloadSheetButton />
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo equipamento</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {equipments.map((eq) => (
            <Card key={eq.id} className="group relative transition-colors hover:border-primary-600/40">
              <CardContent className="p-5">
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(eq)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => setDeleting(eq)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600/15 text-primary-400">
                    <Camera className="h-5 w-5" />
                  </div>
                  <Badge variant={statusVariant[eq.status]}>{statusLabel[eq.status]}</Badge>
                </div>
                <p className="mt-3 text-sm font-semibold">{eq.name}</p>
                <p className="text-xs text-muted-foreground">{eq.category} · S/N {eq.serialNumber}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-xs text-muted-foreground">Valor</span>
                  <span className="text-sm font-semibold">{formatCurrency(eq.value)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {equipments.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nenhum equipamento cadastrado.</p>}
        </div>
      )}

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Editar equipamento" : "Novo equipamento"}
        fields={FIELDS}
        initialValues={editing ?? undefined}
        onSubmit={async (values) => {
          if (editing) {
            return await update(editing.id, values as Partial<Equipment>);
          }
          return await create(values as Omit<Equipment, "id">);
        }}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        itemName={deleting?.name}
        onConfirm={() => deleting && remove(deleting.id)}
      />
    </DashboardShell>
  );
}
