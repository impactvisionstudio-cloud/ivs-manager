import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { diagnostics } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [item] = await db.insert(diagnostics).values(body).returning();
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("[api/diagnostics POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao salvar diagnóstico" }, { status: 500 });
  }
}