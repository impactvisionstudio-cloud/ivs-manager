"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileSignature, Download, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Contract, ChecklistItem } from "@/types";
import { useCollection } from "@/lib/hooks/use-collection";
import { EntityFormDialog, type FieldConfig } from "@/components/shared/entity-form-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DownloadSheetButton } from "@/components/shared/download-sheet-button";
import { generateContractPdf } from "@/lib/pdf/contract-template";
import { detectPlan, PLAN_CHECKLISTS } from "@/lib/plan-checklists";

const statusVariant: Record<Contract["status"], "success" | "secondary" | "warning" | "danger"> = {
  assinado: "success",
  enviado: "warning",
  rascunho: "secondary",
  expirado: "danger",
};

const statusLabel: Record<Contract["status"], string> = {
  assinado: "Assinado",
  enviado: "Enviado",
  rascunho: "Rascunho",
  expirado: "Expirado",
};

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Título do contrato", type: "text", required: true, colSpan: 2 },
  { name: "clientName", label: "Cliente (Nome/Razão Social)", type: "text", required: true },
  { name: "clientDocument", label: "CPF/CNPJ", type: "text" },
  { name: "clientAddress", label: "Endereço", type: "text", colSpan: 2 },
  { name: "clientPhone", label: "Telefone", type: "text" },
  { name: "clientEmail", label: "E-mail", type: "text" },
  { name: "serviceDescription", label: "Serviço/plano contratado", type: "textarea", colSpan: 2 },
  { name: "value", label: "Valor (R$)", type: "currency" },
  {
    name: "paymentType",
    label: "Forma de pagamento",
    type: "select",
    options: [
      { value: "integral", label: "Valor cheio" },
      { value: "entrada", label: "Deu entrada (50/50)" },
    ],
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: [
      { value: "rascunho", label: "Rascunho" },
      { value: "enviado", label: "Enviado" },
      { value: "assinado", label: "Assinado" },
      { value: "expirado", label: "Expirado" },
    ],
  },
  { name: "signedAt", label: "Assinado em", type: "date" },
  { name: "expiresAt", label: "Expira em", type: "date" },
];

export default function ContratosPage() {
  const { items: contracts, loading, create, update, remove } = useCollection<Contract>("contratos");
  const { create: createChecklistItem } = useCollection<ChecklistItem>("checklist");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [deleting, setDeleting] = useState<Contract | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c: Contract) => { setEditing(c); setFormOpen(true); };

  const handleDownload = (c: Contract) => {
    generateContractPdf({
      title: c.title,
      clientName: c.clientName,
      clientDocument: c.clientDocument,
      clientAddress: c.clientAddress,
      clientPhone: c.clientPhone,
      clientEmail: c.clientEmail,
      serviceDescription: c.serviceDescription,
      value: c.value,
      paymentType: c.paymentType,
      date: c.signedAt,
    });
  };

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contratos</h1>
          <p className="text-sm text-muted-foreground">{contracts.length} contratos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <DownloadSheetButton />
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo contrato</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <Card key={c.id} className="transition-colors hover:border-primary-600/40">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-600/15 text-primary-400">
                    <FileSignature className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.clientName}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{formatCurrency(c.value)}</span>
                  {c.signedAt && <span className="text-xs text-muted-foreground">Assinado em {formatDate(c.signedAt)}</span>}
                  <Badge variant={statusVariant[c.status]}>{statusLabel[c.status]}</Badge>
                  <Button variant="ghost" size="icon" title="Baixar contrato em PDF" onClick={() => handleDownload(c)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-danger" onClick={() => setDeleting(c)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {contracts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum contrato cadastrado.</p>}
        </div>
      )}

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Editar contrato" : "Novo contrato"}
        fields={FIELDS}
        initialValues={editing ?? undefined}
        onSubmit={async (values) => {
          if (editing) {
            return await update(editing.id, values as Partial<Contract>);
          }

          const contract = await create(values as Omit<Contract, "id">);

          if (contract) {
            const planName = detectPlan(contract.serviceDescription);
            if (planName) {
              const deliverables = PLAN_CHECKLISTS[planName];
              await Promise.all(
                deliverables.map((title, index) =>
                  createChecklistItem({
                    contractId: contract.id,
                    title,
                    done: false,
                    order: index,
                  } as Omit<ChecklistItem, "id">)
                )
              );
            }
          }

          return contract;
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