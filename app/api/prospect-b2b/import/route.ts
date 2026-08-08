import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospectLeads } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

interface ImportLead {
  companyName: string;
  phone: string;
  niche: string;
}

export async function POST(req: NextRequest) {
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