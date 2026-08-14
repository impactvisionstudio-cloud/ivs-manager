import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospectMessageTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_TEMPLATES: Record<number, string> = {
1: "Olá, {{empresa}}! Tudo bem? Muito prazer! Me chamo Daniel e trabalho com desenvolvimento de sites e posicionamento digital para {{nicho}}. Estava analisando a presença digital de vocês e percebi uma oportunidade que, na minha visão, poderia valorizar bastante a empresa e até facilitar a chegada de novos clientes. Inclusive, tive uma ideia específica pensando na empresa de vocês. Posso te mostrar?",
2: "Olá, {{empresa}}! Tudo bem? Meu nome é Daniel e trabalho com desenvolvimento de sites e posicionamento digital para {{nicho}}. Estive conhecendo um pouco mais sobre a presença digital de vocês e encontrei alguns pontos que acredito que poderiam ser melhor aproveitados. Inclusive, pensei em uma solução específica para a empresa de vocês. Posso te mostrar rapidamente?",
3: "Olá, {{empresa}}! Tudo certo? Sou o Daniel e trabalho ajudando {{nicho}} a melhorar sua presença digital através de sites profissionais e estratégias de posicionamento. Encontrei a {{empresa}} durante uma análise de empresas do segmento e achei o trabalho de vocês bem interessante. Vi uma oportunidade que poderia deixar a apresentação da empresa ainda mais profissional e ajudar vocês a transformar mais visitantes em clientes. Posso te mostrar a ideia que tive?",
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