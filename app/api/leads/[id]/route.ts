import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, leadHistory, leadMessages } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [item] = await db.select().from(leads).where(eq(leads.id, id));
    if (!item) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    const history = await db
      .select()
      .from(leadHistory)
      .where(eq(leadHistory.leadId, id))
      .orderBy(leadHistory.createdAt);
    return NextResponse.json({ item, history: history.reverse() });
  } catch (err) {
    console.error("[api/leads/id GET]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao ler lead" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const allowed: Record<string, unknown> = {};
    for (const field of ["status", "notes", "responsibleId", "aiAnalysis"] as const) {
      if (field in body) allowed[field] = body[field];
    }
    const [item] = await db.update(leads).set(allowed).where(eq(leads.id, id)).returning();
    if (!item) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    if ("status" in allowed) {
      await db.insert(leadHistory).values({
        leadId: id,
        userId: typeof body.userId === "string" ? body.userId : null,
        action: `Status alterado para "${allowed.status}"`,
      });
    }
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[api/leads/id PATCH]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao atualizar lead" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(leadHistory).where(eq(leadHistory.leadId, id));
    await db.delete(leadMessages).where(eq(leadMessages.leadId, id));
    await db.delete(leads).where(eq(leads.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/leads/id DELETE]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao excluir lead" }, { status: 500 });
  }
}