"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction, Client, Contract } from "@/types";
import { useCollection } from "@/lib/hooks/use-collection";
import { EntityFormDialog, type FieldConfig } from "@/components/shared/entity-form-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DownloadSheetButton } from "@/components/shared/download-sheet-button";

const SOCIO_1 = "Daniel Gomes";
const SOCIO_2 = "Eduardo Lobato";

const statusVariant: Record<Transaction["status"], "success" | "warning" | "danger"> = {
  pago: "success",
  pendente: "warning",
  atrasado: "danger",
};

const statusLabel: Record<Transaction["status"], string> = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Atrasado",
};

const FIELDS: FieldConfig[] = [
  { name: "description", label: "Descrição", type: "text", required: true, colSpan: 2 },
  {
    name: "type",
    label: "Tipo",
    type: "select",
    required: true,
    options: [
      { value: "receita", label: "Receita" },
      { value: "despesa", label: "Despesa" },
    ],
  },
  { name: "category", label: "Categoria", type: "text" },
  { name: "amount", label: "Valor (R$)", type: "currency", required: true },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: [
      { value: "pago", label: "Pago" },
      { value: "pendente", label: "Pendente" },
      { value: "atrasado", label: "Atrasado" },
    ],
  },
  { name: "date", label: "Data", type: "date" },
];

function calcSplit(receitas: number, despesasPagas: number) {
  const dizimo = receitas * 0.1;
  const ivsBruto = receitas * 0.2;
  const ivs = ivsBruto - despesasPagas;
  const socios = receitas * 0.7;
  const cadaSocio = socios / 2;
  return { dizimo, ivs, cadaSocio };
}

export default function FinanceiroPage() {
  const { items: transactions, loading, create, update, remove } = useCollection<Transaction>("financeiro");
  const { items: clients } = useCollection<Client>("clientes");
  const { items: contracts } = useCollection<Contract>("contratos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (t: Transaction) => { setEditing(t); setFormOpen(true); };

  const totals = useMemo(() => {
    const receitas = transactions.filter((t) => t.type === "receita" && t.status === "pago");
    const totalReceitas = receitas.reduce((sum, t) => sum + Number(t.amount), 0);
    const despesasPagas = transactions
      .filter((t) => t.type === "despesa" && t.status === "pago")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const split = calcSplit(totalReceitas, despesasPagas);
    const pendentes = transactions.filter((t) => t.status !== "pago").reduce((sum, t) => sum + Number(t.amount), 0);
    return { totalReceitas, despesasPagas, split, pendentes };
  }, [transactions]);

  const clientName = (id?: string) => clients.find((c) => c.id === id)?.name;
  const contractTitle = (id?: string) => contracts.find((c) => c.id === id)?.title;

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">{transactions.length} lançamentos</p>
        </div>
        <div className="flex gap-2">
          <DownloadSheetButton />
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo lançamento</Button>
        </div>
      </div>

      {/* Resumo da divisão automática */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Recebido (pago)</p>
            <p className="text-lg font-semibold text-success">{formatCurrency(totals.totalReceitas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Dízimo (10%)</p>
            <p className="text-lg font-semibold">{formatCurrency(totals.split.dizimo)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">IVS (20% - despesas)</p>
            <p className={`text-lg font-semibold ${totals.split.ivs < 0 ? "text-danger" : ""}`}>
              {formatCurrency(totals.split.ivs)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pendente</p>
            <p className="text-lg font-semibold text-warning">{formatCurrency(totals.pendentes)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{SOCIO_1} (35%)</p>
            <p className="text-lg font-semibold text-primary-400">{formatCurrency(totals.split.cadaSocio)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{SOCIO_2} (35%)</p>
            <p className="text-lg font-semibold text-primary-400">{formatCurrency(totals.split.cadaSocio)}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((t) => (
            <Card key={t.id} className="transition-colors hover:border-primary-600/40">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.type === "receita" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                    {t.type === "receita" ? <TrendingUp className="h-4.5 w-4.5" /> : <TrendingDown className="h-4.5 w-4.5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {clientName(t.clientId) ?? t.category ?? "—"}
                      {contractTitle(t.contractId) && ` · ${contractTitle(t.contractId)}`}
                      {" · "}{formatDate(t.date)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-semibold ${t.type === "receita" ? "text-success" : "text-danger"}`}>
                    {t.type === "receita" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                  </span>
                  <Badge variant={statusVariant[t.status]}>{statusLabel[t.status]}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-danger" onClick={() => setDeleting(t)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {transactions.length === 0 && <p className="text-sm text-muted-foreground">Nenhum lançamento cadastrado.</p>}
        </div>
      )}

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Editar lançamento" : "Novo lançamento"}
        fields={FIELDS}
        initialValues={editing ?? undefined}
        onSubmit={async (values) => {
          if (editing) {
            return await update(editing.id, values as Partial<Transaction>);
          }
          return await create(values as Omit<Transaction, "id">);
        }}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        itemName={deleting?.description}
        onConfirm={() => deleting && remove(deleting.id)}
      />
    </DashboardShell>
  );
}