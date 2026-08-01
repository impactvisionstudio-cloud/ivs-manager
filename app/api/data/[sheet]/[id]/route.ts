import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, agendaEvents, transactions, contracts, users } from "@/lib/db/schema";

type SheetName = "clientes" | "agenda" | "financeiro" | "contratos" | "equipe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_SHEETS: SheetName[] = ["clientes", "agenda", "financeiro", "contratos", "equipe"];

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
        [item] = await db.update(agendaEvents).set(parseDates(body, ["start", "end"])).where(eq(agendaEvents.id, id)).returning();
        break;
      case "financeiro":
        [item] = await db.update(transactions).set(parseDates(body, ["date"])).where(eq(transactions.id, id)).returning();
        break;
      case "contratos":
        [item] = await db.update(contracts).set(parseDates(body, ["signedAt", "expiresAt"])).where(eq(contracts.id, id)).returning();
        break;
      case "equipe":
        [item] = await db.update(users).set(body).where(eq(users.id, id)).returning();
        break;
    }
    if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[api/data PUT]", sheet, id, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao salvar alterações" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ sheet: string; id: string }> }) {
  const { sheet, id } = await params;
  if (!isValidSheet(sheet)) {
    return NextResponse.json({ error: `Módulo "${sheet}" inválido` }, { status: 400 });
  }
  try {
    let deleted;
    switch (sheet) {
      case "clientes":
        deleted = await db.delete(clients).where(eq(clients.id, id)).returning();
        break;
      case "agenda":
        deleted = await db.delete(agendaEvents).where(eq(agendaEvents.id, id)).returning();
        break;
      case "financeiro":
        deleted = await db.delete(transactions).where(eq(transactions.id, id)).returning();
        break;
      case "contratos":
        deleted = await db.delete(contracts).where(eq(contracts.id, id)).returning();
        break;
      case "equipe":
        deleted = await db.delete(users).where(eq(users.id, id)).returning();
        break;
    }
    if (!deleted || deleted.length === 0) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/data DELETE]", sheet, id, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao excluir" }, { status: 500 });
  }
}