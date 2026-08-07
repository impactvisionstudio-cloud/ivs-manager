import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { leadHistory } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const items = await db
      .select()
      .from(leadHistory)
      .where(eq(leadHistory.leadId, id))
      .orderBy(asc(leadHistory.createdAt));
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/leads/id/history GET]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao ler histórico" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const action = typeof body?.action === "string" ? body.action : null;
    const userId = typeof body?.userId === "string" ? body.userId : null;

    if (!action) {
      return NextResponse.json({ error: "action é obrigatório" }, { status: 400 });
    }

    const [saved] = await db.insert(leadHistory).values({ leadId: id, userId, action }).returning();
    return NextResponse.json({ item: saved }, { status: 201 });
  } catch (err) {
    console.error("[api/leads/id/history POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao registrar ação" }, { status: 500 });
  }
}