"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Trash2, UserRound, Pencil } from "lucide-react";
import type { TeamMember, TeamNote, TeamNoteStatus, Client, Contract } from "@/types";
import { useCollection } from "@/lib/hooks/use-collection";

const statusLabel: Record<TeamNoteStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

const statusVariant: Record<TeamNoteStatus, "secondary" | "warning" | "success"> = {
  pendente: "secondary",
  em_andamento: "warning",
  concluido: "success",
};

export default function EquipePage() {
  const { items: members, create: createMember, remove: removeMember } = useCollection<TeamMember>("membros");
  const { items: notes, loading, create: createNote, update: updateNote, remove: removeNote } = useCollection<TeamNote>("recados");
  const { items: clients } = useCollection<Client>("clientes");
  const { items: contracts } = useCollection<Contract>("contratos");

  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");

  const [noteContent, setNoteContent] = useState("");
  const [noteAssignee, setNoteAssignee] = useState("");
  const [noteClient, setNoteClient] = useState("");
  const [noteContract, setNoteContract] = useState("");

  const addMember = async () => {
    if (!memberName.trim()) return;
    await createMember({ name: memberName.trim(), role: memberRole.trim() || undefined, active: true } as Omit<TeamMember, "id">);
    setMemberName("");
    setMemberRole("");
  };

  const addNote = async () => {
    if (!noteContent.trim()) return;
    await createNote({
      content: noteContent.trim(),
      assigneeId: noteAssignee || undefined,
      status: "pendente",
      clientId: noteClient || undefined,
      contractId: noteContract || undefined,
    } as Omit<TeamNote, "id">);
    setNoteContent("");
    setNoteAssignee("");
    setNoteClient("");
    setNoteContract("");
  };

  const cycleStatus = (note: TeamNote) => {
    const order: TeamNoteStatus[] = ["pendente", "em_andamento", "concluido"];
    const next = order[(order.indexOf(note.status) + 1) % order.length];
    updateNote(note.id, { status: next } as Partial<TeamNote>);
  };

  const memberName_ = (id?: string) => members.find((m) => m.id === id)?.name;
  const clientName_ = (id?: string) => clients.find((c) => c.id === id)?.name;
  const contractTitle_ = (id?: string) => contracts.find((c) => c.id === id)?.title;

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Equipe</h1>
        <p className="text-sm text-muted-foreground">Membros e mural de recados internos</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Membros */}
        <Card>
          <CardHeader>
            <CardTitle>Membros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {members.map((m) => (
              <div key={m.id} className="group flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600/15 text-primary-400">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    {m.role && <p className="text-xs text-muted-foreground">{m.role}</p>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-danger opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removeMember(m.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {members.length === 0 && <p className="text-sm text-muted-foreground">Nenhum membro cadastrado.</p>}

            <div className="space-y-2 border-t border-border pt-3">
              <Input placeholder="Nome do membro" value={memberName} onChange={(e) => setMemberName(e.target.value)} />
              <Input placeholder="Cargo (opcional)" value={memberRole} onChange={(e) => setMemberRole(e.target.value)} />
              <Button variant="outline" className="w-full" onClick={addMember}>
                <Plus className="h-4 w-4" /> Adicionar membro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mural de recados */}
        <Card>
          <CardHeader>
            <CardTitle>Mural de recados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <>
                {notes.map((n) => (
                  <div key={n.id} className="group rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm">
                          {memberName_(n.assigneeId) && (
                            <span className="font-semibold text-primary-400">@{memberName_(n.assigneeId)} </span>
                          )}
                          {n.content}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <button onClick={() => cycleStatus(n)}>
                            <Badge variant={statusVariant[n.status]} className="cursor-pointer">
                              {statusLabel[n.status]}
                            </Badge>
                          </button>
                          {clientName_(n.clientId) && (
                            <Badge variant="secondary">{clientName_(n.clientId)}</Badge>
                          )}
                          {contractTitle_(n.contractId) && (
                            <Badge variant="secondary">{contractTitle_(n.contractId)}</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-danger opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => removeNote(n.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-sm text-muted-foreground">Nenhum recado ainda.</p>}
              </>
            )}

            <div className="space-y-2 border-t border-border pt-3">
              <Input
                placeholder="Escreva um recado..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Select value={noteAssignee} onChange={(e) => setNoteAssignee(e.target.value)}>
                  <option value="">Responsável (opcional)</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
                <Select value={noteClient} onChange={(e) => setNoteClient(e.target.value)}>
                  <option value="">Cliente (opcional)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
                <Select value={noteContract} onChange={(e) => setNoteContract(e.target.value)}>
                  <option value="">Contrato (opcional)</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </Select>
              </div>
              <Button variant="outline" className="w-full" onClick={addNote}>
                <Plus className="h-4 w-4" /> Adicionar recado
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}