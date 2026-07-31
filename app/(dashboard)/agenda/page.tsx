"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import type { AgendaEvent } from "@/types";
import { useCollection } from "@/lib/hooks/use-collection";
import { EntityFormDialog, type FieldConfig } from "@/components/shared/entity-form-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DownloadSheetButton } from "@/components/shared/download-sheet-button";

const TYPE_COLOR: Record<string, string> = {
  reuniao: "#3b82f6",
  gravacao: "#7C3AED",
  entrega: "#22c55e",
  interno: "#a1a1aa",
};

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Título", type: "text", required: true, colSpan: 2 },
  { name: "start", label: "Início", type: "datetime-local", required: true },
  { name: "end", label: "Fim", type: "datetime-local", required: true },
  {
    name: "type",
    label: "Tipo",
    type: "select",
    required: true,
    options: [
      { value: "reuniao", label: "Reunião" },
      { value: "gravacao", label: "Gravação" },
      { value: "entrega", label: "Entrega" },
      { value: "interno", label: "Interno" },
    ],
  },
  { name: "clientName", label: "Cliente", type: "text" },
];

export default function AgendaPage() {
  const { items: mockEvents, loading, create, update, remove } = useCollection<AgendaEvent>("agenda");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaEvent | null>(null);
  const [deleting, setDeleting] = useState<AgendaEvent | null>(null);

  const events = mockEvents.map((ev) => ({
    id: ev.id,
    title: ev.title,
    start: ev.start,
    end: ev.end,
    allDay: ev.allDay,
    backgroundColor: TYPE_COLOR[ev.type],
    borderColor: TYPE_COLOR[ev.type],
  }));

  const openCreate = () => { setEditing(null); setFormOpen(true); };

  const handleDateClick = (arg: DateClickArg) => {
    setEditing({ id: "", title: "", start: arg.dateStr, end: arg.dateStr, type: "reuniao" } as AgendaEvent);
    setFormOpen(true);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const found = mockEvents.find((e) => e.id === arg.event.id);
    if (found) {
      setEditing(found);
      setFormOpen(true);
    }
  };

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">Reuniões, gravações e entregas da equipe</p>
        </div>
        <div className="flex gap-2">
          <DownloadSheetButton />
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo evento</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 ivs-calendar">
          {!loading && (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
              }}
              locale="pt-br"
              editable
              selectable
              height="auto"
              events={events}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              buttonText={{ today: "Hoje", month: "Mês", week: "Semana", day: "Dia", list: "Lista" }}
            />
          )}
        </CardContent>
      </Card>

      {editing?.id && (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" className="text-danger" onClick={() => setDeleting(editing)}>
            <Trash2 className="h-4 w-4" /> Excluir evento selecionado
          </Button>
        </div>
      )}

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing?.id ? "Editar evento" : "Novo evento"}
        fields={FIELDS}
        initialValues={editing ?? undefined}
        onSubmit={async (values) => {
          if (editing?.id) {
            return await update(editing.id, values as Partial<AgendaEvent>);
          }
          return await create(values as Omit<AgendaEvent, "id">);
        }}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        itemName={deleting?.title}
        onConfirm={async () => {
          if (deleting) {
            await remove(deleting.id);
            setEditing(null);
          }
        }}
      />

      <style jsx global>{`
        .ivs-calendar .fc {
          --fc-border-color: hsl(240 5% 18%);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: hsl(240 4% 10%);
          --fc-list-event-hover-bg-color: hsl(240 5% 16%);
          --fc-today-bg-color: rgba(124, 58, 237, 0.08);
          color: hsl(0 0% 96%);
        }
        .ivs-calendar .fc-button {
          background: hsl(240 5% 16%) !important;
          border: 1px solid hsl(240 5% 18%) !important;
          text-transform: capitalize;
          box-shadow: none !important;
        }
        .ivs-calendar .fc-button-active {
          background: #7c3aed !important;
          border-color: #7c3aed !important;
        }
        .ivs-calendar .fc-toolbar-title {
          font-size: 1rem;
          font-weight: 600;
        }
        .ivs-calendar .fc-daygrid-day-number,
        .ivs-calendar .fc-col-header-cell-cushion {
          color: hsl(240 5% 74%);
        }
      `}</style>
    </DashboardShell>
  );
}
