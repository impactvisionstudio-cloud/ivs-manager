"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import type { Project, ProjectStatus, User } from "@/types";
import { useCollection } from "@/lib/hooks/use-collection";
import { EntityFormDialog, type FieldConfig } from "@/components/shared/entity-form-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DownloadSheetButton } from "@/components/shared/download-sheet-button";

const COLUMNS: { key: ProjectStatus; label: string }[] = [
  { key: "planejamento", label: "Planejamento" },
  { key: "producao", label: "Produção" },
  { key: "pos_producao", label: "Pós-produção" },
  { key: "revisao", label: "Revisão" },
  { key: "entregue", label: "Entregue" },
];

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Título do projeto", type: "text", required: true, colSpan: 2 },
  { name: "clientName", label: "Cliente", type: "text", required: true },
  { name: "budget", label: "Orçamento (R$)", type: "number" },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: COLUMNS.map((c) => ({ value: c.key, label: c.label })),
  },
  { name: "progress", label: "Progresso (%)", type: "number" },
  { name: "deadline", label: "Prazo", type: "date" },
];

export default function ProjetosPage() {
  const { items: projects, loading, create, update, remove } = useCollection<Project>("projetos");
  const { items: users } = useCollection<User>("equipe");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const teamAvatars = (ids: string[]) => users.filter((u) => ids?.includes(u.id));

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p: Project) => { setEditing(p); setFormOpen(true); };

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground">{projects.length} projetos ativos</p>
        </div>
        <div className="flex gap-2">
          <DownloadSheetButton />
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo projeto</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colProjects = projects.filter((p) => p.status === col.key);
            return (
              <div key={col.key} className="w-80 shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <h3 className="text-sm font-medium text-muted-foreground">{col.label}</h3>
                  <span className="text-xs text-muted-foreground">{colProjects.length}</span>
                </div>
                <div className="min-h-[120px] space-y-2 rounded-xl border border-border/60 bg-muted/10 p-2">
                  {colProjects.map((p) => (
                    <Card key={p.id} className="group relative transition-colors hover:border-primary-600/40">
                      <CardContent className="p-3.5">
                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(p)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-danger" onClick={() => setDeleting(p)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="pr-10 text-sm font-medium leading-tight">{p.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{p.clientName}</p>

                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${p.progress}%` }} />
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {teamAvatars(p.team).map((u) => (
                              <Avatar key={u.id} className="h-6 w-6 border-2 border-card">
                                <AvatarFallback className="text-[10px]">{initials(u.name)}</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          {p.deadline && <Badge variant="outline" className="text-[10px]">{formatDate(p.deadline)}</Badge>}
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">{formatCurrency(p.budget)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Editar projeto" : "Novo projeto"}
        fields={FIELDS}
        initialValues={editing ?? undefined}
        onSubmit={async (values) => {
          if (editing) {
            return await update(editing.id, values as Partial<Project>);
          }
          return await create({ ...(values as Omit<Project, "id" | "team">), team: [] } as Omit<Project, "id">);
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
