import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ImportRow {
  name: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  mapsUrl?: string;
  category?: string;
}

export async function GET() {
  try {
    const items = await db.select().from(leads).orderBy(leads.createdAt);
    return NextResponse.json({ items: items.reverse() });
  } catch (err) {
    console.error("[api/leads GET]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao ler leads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows: ImportRow[] = Array.isArray(body?.rows) ? body.rows : [];
    const receivedTotal = rows.length;

    if (receivedTotal === 0) {
      return NextResponse.json({ error: "Nenhuma linha válida encontrada na planilha." }, { status: 400 });
    }

    const validRows = rows.filter((r) => r.name && r.name.trim().length > 0);
    const skippedNoName = receivedTotal - validRows.length;

    const seenPhones = new Set<string>();
    const dedupedRows: ImportRow[] = [];
    for (const row of validRows) {
      const phone = (row.phone || "").replace(/\D/g, "");
      if (phone && seenPhones.has(phone)) continue;
      if (phone) seenPhones.add(phone);
      dedupedRows.push(row);
    }
    const skippedDuplicateInFile = validRows.length - dedupedRows.length;

    const existing = await db.select({ phone: leads.phone }).from(leads);
    const existingPhones = new Set(existing.map((e) => (e.phone || "").replace(/\D/g, "")).filter(Boolean));

    const toInsert = dedupedRows.filter((row) => {
      const phone = (row.phone || "").replace(/\D/g, "");
      return !phone || !existingPhones.has(phone);
    });
    const skippedAlreadyExists = dedupedRows.length - toInsert.length;

    let inserted: (typeof leads.$inferSelect)[] = [];
    if (toInsert.length > 0) {
      inserted = await db
        .insert(leads)
        .values(
          toInsert.map((row) => ({
            name: row.name.trim(),
            title: row.title || null,
            address: row.address || null,
            city: row.city || null,
            state: row.state || null,
            phone: row.phone || null,
            mapsUrl: row.mapsUrl || null,
            category: row.category || null,
          }))
        )
        .returning();
    }

    return NextResponse.json(
      {
        imported: inserted.length,
        receivedTotal,
        skippedNoName,
        skippedDuplicateInFile,
        skippedAlreadyExists,
        items: inserted,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/leads POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao importar leads" }, { status: 500 });
  }
}