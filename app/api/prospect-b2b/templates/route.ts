import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospectMessageTemplates, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { ROLE_PERMISSIONS } from "@/types";
import type { Permission, Role } from "@/types";

const VALID_INDEXES = [1, 2, 3, 4, 5, 6];

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

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET → só as mensagens do usuário logado. Não cria mais padrão automático
// aqui, pois cada usuário já deve ter suas 6 mensagens criadas via
// migração inicial (uma vez por pessoa, no banco).
export async function GET() {
  try {
    const dbUser = await requireProspectUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const items = await db
      .select()
      .from(prospectMessageTemplates)
      .where(eq(prospectMessageTemplates.ownerId, dbUser.id));

    items.sort((a, b) => a.index - b.index);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/prospect-b2b/templates GET]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao buscar mensagens" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const dbUser = await requireProspectUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const { index, content } = body as { index: number; content: string };
    if (!VALID_INDEXES.includes(index) || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(prospectMessageTemplates)
      .where(and(eq(prospectMessageTemplates.index, index), eq(prospectMessageTemplates.ownerId, dbUser.id)));

    let item;
    if (existing) {
      [item] = await db
        .update(prospectMessageTemplates)
        .set({ content, updatedAt: new Date() })
        .where(and(eq(prospectMessageTemplates.index, index), eq(prospectMessageTemplates.ownerId, dbUser.id)))
        .returning();
    } else {
      [item] = await db.insert(prospectMessageTemplates).values({ index, content, ownerId: dbUser.id }).returning();
    }
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[api/prospect-b2b/templates PUT]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao salvar mensagem" }, { status: 500 });
  }
}