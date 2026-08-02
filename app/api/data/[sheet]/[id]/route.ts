import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, agendaEvents, transactions, contracts, checklistItems, teamMembers, teamNotes } from "@/lib/db/schema";

type SheetName = "clientes" | "agenda" | "financeiro" | "contratos" | "checklist" | "membros" | "recados";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_SHEETS: SheetName[] = ["clientes", "agenda", "financeiro", "contratos", "checklist", "membros", "recados"];

function isValidSheet(sheet: string): sheet is SheetName {
  return (VALID_SHEETS as string[]).includes(sheet);
}

function parseDates(body: Record<string, unknown>, fields: string[]) {
  const out = { ...body };
  for (const f of fields) {
    if (typeof out[f] === "string" && out[f]) {
      out[f] = new Date(out[f] as string);
    }
  }
  return out;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ sheet: string; id: string }> }) {
  const { sheet, id } = await params;
  if (!isValidSheet(sheet)) {
    return NextResponse.json({ error: `Módulo "${sheet}" inválido` }, { status: 400 });
  }
  try {
    const body = await req.json();
    let item;
    switch (sheet) {
      case "clientes":
        [item] = await db.update(clients).set(body).where(eq(clients.id, id)).returning();
        break;
      case "agenda":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [item] = await db.update(agendaEvents).set(parseDates(body, ["start", "end"]) as any).where(eq(agendaEvents.id, id)).returning();
        break;
      case "financeiro":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [item] = await db.update(transactions).set(parseDates(body, ["date"]) as any).where(eq(transactions.id, id)).returning();
        break;
      case "contratos":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [item] = await db.update(contracts).set(parseDates(body, ["signedAt", "expiresAt"]) as any).where(eq(contracts.id, id)).returning();
        break;
      case "checklist":
        [item] = await db.update(checklistItems).set(body).where(eq(checklistItems.id, id)).returning();
        break;
      case "membros":
        [item] = await db.update(teamMembers).set(body).where(eq(teamMembers.id, id)).returning();
        break;
      case "recados":
        [item] = await db.update(teamNotes).set(body).where(eq(teamNotes.id, id)).returning();
        break;
    }
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[api/data PUT]", sheet, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao atualizar registro" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ sheet: string; id: string }> }) {
  const { sheet, id } = await params;
  if (!isValidSheet(sheet)) {
    return NextResponse.json({ error: `Módulo "${sheet}" inválido` }, { status: 400 });
  }
  try {
    switch (sheet) {
      case "clientes":
        await db.delete(clients).where(eq(clients.id, id));
        break;
      case "agenda":
        await db.delete(agendaEvents).where(eq(agendaEvents.id, id));
        break;
      case "financeiro":
        await db.delete(transactions).where(eq(transactions.id, id));
        break;
      case "contratos":
        await db.delete(contracts).where(eq(contracts.id, id));
        break;
      case "checklist":
        await db.delete(checklistItems).where(eq(checklistItems.id, id));
        break;
      case "membros":
        await db.delete(teamMembers).where(eq(teamMembers.id, id));
        break;
      case "recados":
        await db.delete(teamNotes).where(eq(teamNotes.id, id));
        break;
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/data DELETE]", sheet, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao excluir registro" }, { status: 500 });
  }
}