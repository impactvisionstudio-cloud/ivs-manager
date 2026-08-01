import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, agendaEvents, transactions, equipments, contracts, users } from "@/lib/db/schema";

type SheetName = "clientes" | "agenda" | "financeiro" | "equipamentos" | "contratos" | "equipe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_SHEETS: SheetName[] = ["clientes", "agenda", "financeiro", "equipamentos", "contratos", "equipe"];

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sheet: string }> }) {
  const { sheet } = await params;
  if (!isValidSheet(sheet)) {
    return NextResponse.json({ error: `Módulo "${sheet}" inválido` }, { status: 400 });
  }
  try {
    let items;
    switch (sheet) {
      case "clientes":
        items = await db.select().from(clients);
        break;
      case "agenda":
        items = await db.select().from(agendaEvents);
        break;
      case "financeiro":
        items = await db.select().from(transactions);
        break;
      case "equipamentos":
        items = await db.select().from(equipments);
        break;
      case "contratos":
        items = await db.select().from(contracts);
        break;
      case "equipe":
        items = await db.select().from(users);
        break;
    }
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/data GET]", sheet, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao ler dados" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ sheet: string }> }) {
  const { sheet } = await params;
  if (!isValidSheet(sheet)) {
    return NextResponse.json({ error: `Módulo "${sheet}" inválido` }, { status: 400 });
  }
  try {
    const body = await req.json();
    let item;
    switch (sheet) {
      case "clientes":
        [item] = await db.insert(clients).values(body).returning();
        break;
      case "agenda":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [item] = await db.insert(agendaEvents).values(parseDates(body, ["start", "end"]) as any).returning();
        break;
      case "financeiro":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [item] = await db.insert(transactions).values(parseDates(body, ["date"]) as any).returning();
        break;
      case "equipamentos":
        [item] = await db.insert(equipments).values(body).returning();
        break;
      case "contratos":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [item] = await db.insert(contracts).values(parseDates(body, ["signedAt", "expiresAt"]) as any).returning();
        break;
      case "equipe":
        [item] = await db.insert(users).values(body).returning();
        break;
    }
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("[api/data POST]", sheet, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao criar registro" }, { status: 500 });
  }
}