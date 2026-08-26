import { NextRequest, NextResponse } from "next/server";
import { eq, or, isNull, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, agendaEvents, transactions, contracts, checklistItems, teamMembers, teamNotes, prospectLeads, prospectContacts, users } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { ROLE_PERMISSIONS } from "@/types";
import type { Permission, Role } from "@/types";

type SheetName = "clientes" | "agenda" | "financeiro" | "contratos" | "checklist" | "membros" | "recados" | "prospectos" | "prospeccaocontatos";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_SHEETS: SheetName[] = ["clientes", "agenda", "financeiro", "contratos", "checklist", "membros", "recados", "prospectos", "prospeccaocontatos"];

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

async function requireProspectAccess() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const [dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id));
  if (!dbUser) return null;

  const permissions = ROLE_PERMISSIONS[dbUser.role as Role] ?? [];
  if (!permissions.includes("prospectb2b.use" as Permission)) return null;

  return dbUser;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sheet: string }> }) {
  const { sheet } = await params;
  if (!isValidSheet(sheet)) {
    return NextResponse.json({ error: `Módulo "${sheet}" inválido` }, { status: 400 });
  }

  if (sheet === "prospectos" || sheet === "prospeccaocontatos") {
    const dbUser = await requireProspectAccess();
    if (!dbUser) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    if (sheet === "prospeccaocontatos") {
      const items = await db.select().from(prospectContacts).where(eq(prospectContacts.sentBy, dbUser.id));
      return NextResponse.json({ items });
    }
    // "prospectos": cada usuário só vê os leads que são dele (owner_id).
    // Leads sem dono (legado) não aparecem mais pra ninguém até serem
    // atribuídos via SQL.
    const items = await db.select().from(prospectLeads).where(eq(prospectLeads.ownerId, dbUser.id));
    return NextResponse.json({ items });
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
      case "contratos":
        items = await db.select().from(contracts);
        break;
      case "checklist":
        items = await db.select().from(checklistItems);
        break;
      case "membros":
        items = await db.select().from(teamMembers);
        break;
      case "recados":
        items = await db.select().from(teamNotes);
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
      case "contratos":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [item] = await db.insert(contracts).values(parseDates(body, ["signedAt", "expiresAt"]) as any).returning();
        break;
      case "checklist":
        [item] = await db.insert(checklistItems).values(body).returning();
        break;
      case "membros":
        [item] = await db.insert(teamMembers).values(body).returning();
        break;
      case "recados":
        [item] = await db.insert(teamNotes).values(body).returning();
        break;
      case "prospectos":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [item] = await db.insert(prospectLeads).values(parseDates(body, ["lastContactedAt"]) as any).returning();
        break;
      case "prospeccaocontatos":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [item] = await db.insert(prospectContacts).values(parseDates(body, ["sentAt"]) as any).returning();
        break;
    }
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("[api/data POST]", sheet, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao criar registro" }, { status: 500 });
  }
}