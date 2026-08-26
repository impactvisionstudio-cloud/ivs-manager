import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { prospectLeads, users } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { ROLE_PERMISSIONS } from "@/types";
import type { Permission, Role } from "@/types";

interface ImportLead {
  companyName: string;
  phone: string;
  niche: string;
}

async function requireProspectUser() {
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

export async function POST(req: NextRequest) {
  const dbUser = await requireProspectUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const incoming: ImportLead[] = body.leads ?? [];
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return NextResponse.json({ error: "Nenhum lead recebido para importar." }, { status: 400 });
    }
    const phones = incoming.map((l) => l.phone);
    const existing = await db
      .select({ phone: prospectLeads.phone })
      .from(prospectLeads)
      .where(inArray(prospectLeads.phone, phones));
    const existingPhones = new Set(existing.map((e) => e.phone));
    const toInsert = incoming.filter((l) => !existingPhones.has(l.phone));
    let inserted = 0;
    if (toInsert.length > 0) {
      const values = toInsert.map((l) => ({
        companyName: l.companyName,
        phone: l.phone,
        niche: l.niche || null,
        // Sempre exclusivo de quem importou — não existe mais pool compartilhado.
        ownerId: dbUser.id,
      }));
      const result = await db.insert(prospectLeads).values(values).returning({ id: prospectLeads.id });
      inserted = result.length;
    }
    return NextResponse.json({
      inserted,
      skippedExisting: incoming.length - toInsert.length,
    });
  } catch (err) {
    console.error("[prospect-b2b/import]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao importar planilha" },
      { status: 500 }
    );
  }
}