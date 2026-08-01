import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { diagnostics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const [item] = await db
      .update(diagnostics)
      .set(body)
      .where(eq(diagnostics.id, params.id))
      .returning();

    if (!item) {
      return NextResponse.json({ error: "Diagnóstico não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (err) {
    console.error("[api/diagnostics/[id] PATCH]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao editar diagnóstico" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [item] = await db
      .delete(diagnostics)
      .where(eq(diagnostics.id, params.id))
      .returning();

    if (!item) {
      return NextResponse.json({ error: "Diagnóstico não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/diagnostics/[id] DELETE]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao apagar diagnóstico" }, { status: 500 });
  }
}