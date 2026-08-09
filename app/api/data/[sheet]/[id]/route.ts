import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, agendaEvents, transactions, contracts, users, checklistItems, prospectLeads, prospectContacts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type SheetName = "clientes" | "agenda" | "financeiro" | "contratos" | "equipe" | "checklist" | "prospectos" | "prospeccaocontatos";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_SHEETS: SheetName[] = ["clientes", "agenda", "financeiro", "contratos", "equipe", "checklist", "prospectos", "prospeccaocontatos"];

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
      case "equipe":
        [item] = await db.update(users).set(body).where(eq(users.id, id)).returning();
        break;
      case "checklist":
        [item] = await db.update(checklistItems).set(body).where(eq(checklistItems.id, id)).returning();
        break;
      case "prospectos":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [item] = await db.update(prospectLeads).set({ ...parseDates(body, ["lastContactedAt"]), updatedAt: new Date() } as any).where(eq(prospectLeads.id, id)).returning();
        break;
      case "prospeccaocontatos":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [item] = await db.update(prospectContacts).set(parseDates(body, ["sentAt"]) as any).where(eq(prospectContacts.id, id)).returning();
        break;
    }
    if (!item) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[api/data PUT]", sheet, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao salvar alterações" }, { status: 500 });
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
      case "equipe":
        await db.delete(users).where(eq(users.id, id));
        break;
      case "checklist":
        await db.delete(checklistItems).where(eq(checklistItems.id, id));
        break;
      case "prospectos":
        // Apaga primeiro o histórico de contatos desse lead (senão o banco
        // bloqueia a exclusão por causa da referência entre as tabelas).
        await db.delete(prospectContacts).where(eq(prospectContacts.leadId, id));
        await db.delete(prospectLeads).where(eq(prospectLeads.id, id));
        break;
      case "prospeccaocontatos":
        await db.delete(prospectContacts).where(eq(prospectContacts.id, id));
        break;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/data DELETE]", sheet, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao excluir" }, { status: 500 });
  }
}