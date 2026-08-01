import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { diagnostics } from "@/lib/db/schema";
import { desc, gte, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const items = await db.select().from(diagnostics).orderBy(desc(diagnostics.createdAt));
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/diagnostics GET]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao ler diagnósticos" }, { status: 500 });
  }
}

// Gera um protocolo tipo IVS-DDMMAA-001, sequencial dentro do mesmo dia
async function generateProtocol() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(diagnostics)
    .where(gte(diagnostics.createdAt, startOfDay));

  const seq = String(Number(count) + 1).padStart(3, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);

  return `IVS-${dd}${mm}${yy}-${seq}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const protocol = await generateProtocol();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // expira em 4 horas

    const [item] = await db
      .insert(diagnostics)
      .values({ ...body, protocol, expiresAt })
      .returning();

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("[api/diagnostics POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao salvar diagnóstico" }, { status: 500 });
  }
}