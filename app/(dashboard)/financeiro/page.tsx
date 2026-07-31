"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpRight, ArrowDownRight, Pencil, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { revenueByMonth } from "@/lib/mock/data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types";
import { useCollection } from "@/lib/hooks/use-collection";
import { EntityFormDialog, type FieldConfig } from "@/components/shared/entity-form-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DownloadSheetButton } from "@/components/shared/download-sheet-button";

const statusVariant: Record<Transaction["status"], "success" | "warning" | "danger"> = {
  pago: "success",
  pendente: "warning",
  atrasado: "danger",
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
  { name: "amount", label: "Valor (R$)", type: "number" },
  { name: "date", label: "Data", type: "date" },
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
  { name: "clientName", label: "Cliente (opcional)", type: "text" },
];

export default function FinanceiroPage() {
  const { items: transactions, loading, create, update, remove } = useCollection<Transaction>("financeiro");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const receitas = transactions.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const despesas = transactions.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (t: Transaction) => { setEditing(t); setFormOpen(true); };

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Controle de receitas, despesas e fluxo de caixa</p>
        </div>
        <div className="flex gap-2">
          <DownloadSheetButton />
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo lançamento</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Receitas (mês)</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-2xl font-semibold text-success">
              <ArrowUpRight className="h-5 w-5" /> {formatCurrency(receitas)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Despesas (mês)</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-2xl font-semibold text-danger">
              <ArrowDownRight className="h-5 w-5" /> {formatCurrency(despesas)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="mt-1.5 text-2xl font-semibold text-gradient">{formatCurrency(receitas - despesas)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Fluxo de caixa</CardTitle></CardHeader>
        <CardContent className="h-72 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 18%)" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(240 5% 64%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(240 5% 64%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "hsl(240 6% 8%)", border: "1px solid hsl(240 5% 18%)", borderRadius: 12 }} formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="receita" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              <Bar dataKey="despesa" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Lançamentos recentes</CardTitle></CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium">Categoria</th>
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Valor</th>
                  <th className="pb-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-medium">{t.description}</td>
                    <td className="py-3 text-muted-foreground">{t.category}</td>
                    <td className="py-3 text-muted-foreground">{formatDate(t.date)}</td>
                    <td className="py-3"><Badge variant={statusVariant[t.status]} className="capitalize">{t.status}</Badge></td>
                    <td className={cn("py-3 text-right font-semibold", t.type === "receita" ? "text-success" : "text-danger")}>
                      {t.type === "receita" ? "+" : "-"} {formatCurrency(t.amount)}
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => setDeleting(t)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={6} className="py-3 text-muted-foreground">Nenhum lançamento cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

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
