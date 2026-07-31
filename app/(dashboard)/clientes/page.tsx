"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Mail, Phone, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import type { Client } from "@/types";
import { useCollection } from "@/lib/hooks/use-collection";
import { EntityFormDialog, type FieldConfig } from "@/components/shared/entity-form-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DownloadSheetButton } from "@/components/shared/download-sheet-button";

const statusVariant: Record<Client["status"], "success" | "secondary" | "warning"> = {
  ativo: "success",
  inativo: "secondary",
  prospect: "warning",
};

const FIELDS: FieldConfig[] = [
  { name: "name", label: "Nome", type: "text", required: true },
  { name: "company", label: "Empresa", type: "text" },
  { name: "endereço", label: "E-mail", type: "text" },
  { name: "phone", label: "Telefone", type: "text" },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: [
      { value: "ativo", label: "Ativo" },
      { value: "prospect", label: "Prospect" },
      { value: "inativo", label: "Inativo" },
    ],
  },
  { name: "totalBilled", label: "Total faturado (R$)", type: "number" },
  { name: "notes", label: "Observações", type: "textarea", colSpan: 2 },
];

export default function ClientesPage() {
  const { items: clients, loading, create, update, remove } = useCollection<Client>("clientes");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const filtered = clients.filter((c) =>
    (c.name + c.company).toLowerCase().includes(query.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setFormOpen(true);
  };

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients.length} clientes cadastrados</p>
        </div>
        <div className="flex gap-2">
          <DownloadSheetButton />
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo cliente</Button>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente..." className="pl-9" />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => (
            <Card key={client.id} className="group relative transition-colors hover:border-primary-600/40">
              <CardContent className="p-5">
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(client)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => setDeleting(client)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback>{initials(client.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.company}</p>
                    </div>
                  </div>
                  <Badge variant={statusVariant[client.status]} className="capitalize">{client.status}</Badge>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {client.email}</div>
                  <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {client.phone}</div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-xs text-muted-foreground">Total faturado</span>
                  <span className="text-sm font-semibold">{formatCurrency(client.totalBilled)}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Cliente desde {formatDate(client.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          )}
        </div>
      )}

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Editar cliente" : "Novo cliente"}
        fields={FIELDS}
        initialValues={editing ?? undefined}
        onSubmit={async (values) => {
          if (editing) {
            return await update(editing.id, values as Partial<Client>);
          }
          return await create({ ...(values as Omit<Client, "id" | "createdAt">), createdAt: new Date().toISOString() } as Omit<Client, "id">);
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
