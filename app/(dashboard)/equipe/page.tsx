"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Mail, Pencil, Trash2 } from "lucide-react";
import { ROLE_LABELS } from "@/types";
import type { User } from "@/types";
import { initials, formatDate } from "@/lib/utils";
import { useCollection } from "@/lib/hooks/use-collection";
import { EntityFormDialog, type FieldConfig } from "@/components/shared/entity-form-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DownloadSheetButton } from "@/components/shared/download-sheet-button";

const FIELDS: FieldConfig[] = [
  { name: "name", label: "Nome", type: "text", required: true },
  { name: "email", label: "E-mail", type: "text", required: true },
  {
    name: "role",
    label: "Função",
    type: "select",
    required: true,
    options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
  },
];

export default function EquipePage() {
  const { items: users, loading, create, update, remove } = useCollection<User>("equipe");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (u: User) => { setEditing(u); setFormOpen(true); };

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipe</h1>
          <p className="text-sm text-muted-foreground">{users.length} membros ativos</p>
        </div>
        <div className="flex gap-2">
          <DownloadSheetButton />
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Convidar membro</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {users.map((u) => (
            <Card key={u.id} className="group relative transition-colors hover:border-primary-600/40">
              <CardContent className="p-5">
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => setDeleting(u)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback>{initials(u.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{u.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><Mail className="h-3 w-3" /> {u.email}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <Badge>{ROLE_LABELS[u.role]}</Badge>
                  <span className="text-[11px] text-muted-foreground">Desde {formatDate(u.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {users.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nenhum membro cadastrado.</p>}
        </div>
      )}

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Editar membro" : "Convidar membro"}
        fields={FIELDS}
        initialValues={editing ?? undefined}
        onSubmit={async (values) => {
          if (editing) {
            return await update(editing.id, values as Partial<User>);
          }
          return await create({ ...(values as Omit<User, "id" | "createdAt">), createdAt: new Date().toISOString() } as Omit<User, "id">);
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
