import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospectMessageTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_TEMPLATES: Record<number, string> = {
  1: "Olá, {{empresa}}! Tudo bem? Estava analisando o segmento de {{nicho}} e percebi uma coisa interessante na presença digital de vocês. Inclusive, tive uma ideia que poderia valorizar bastante a empresa. Posso te mostrar?",
  2: "Olá, {{empresa}}! Tudo bem? Estava dando uma olhada no segmento de {{nicho}} e notei alguns detalhes na presença digital de vocês que me chamaram atenção. Inclusive, pensei em uma ideia que pode deixar a empresa ainda mais valorizada no digital. Posso te mostrar?",
  3: "Olá, {{empresa}}! Tudo certo? Conheci vocês e, analisando um pouco a presença digital no segmento de {{nicho}}, tive uma ideia que acredito que poderia fazer bastante diferença. É algo bem simples, mas pode valorizar bastante a imagem da empresa. Posso te mostrar?",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    let items = await db.select().from(prospectMessageTemplates);
    if (items.length === 0) {
      items = await db
        .insert(prospectMessageTemplates)
        .values([1, 2, 3].map((index) => ({ index, content: DEFAULT_TEMPLATES[index] })))
        .returning();
    }
    items.sort((a, b) => a.index - b.index);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/prospect-b2b/templates GET]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao buscar mensagens" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { index, content } = body as { index: number; content: string };
    if (![1, 2, 3].includes(index) || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const [existing] = await db
      .select()
      .from(prospectMessageTemplates)
      .where(eq(prospectMessageTemplates.index, index));

    let item;
    if (existing) {
      [item] = await db
        .update(prospectMessageTemplates)
        .set({ content, updatedAt: new Date() })
        .where(eq(prospectMessageTemplates.index, index))
        .returning();
    } else {
      [item] = await db.insert(prospectMessageTemplates).values({ index, content }).returning();
    }
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[api/prospect-b2b/templates PUT]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao salvar mensagem" }, { status: 500 });
  }
}