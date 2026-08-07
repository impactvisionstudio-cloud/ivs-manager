import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, leadMessages, leadHistory } from "@/lib/db/schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildPrompt(params: {
  name: string;
  category: string | null;
  city: string | null;
  kind: "mensagem" | "followup_1" | "followup_2";
  previousMessages: string[];
}) {
  const { name, category, city, kind, previousMessages } = params;

  const base = `
Você é um especialista em prospecção comercial da Impact Vision Studio (IVS), agência de Produção Audiovisual e Marketing Digital.

Escreva uma mensagem de WhatsApp para abordar a empresa "${name}"${category ? `, do segmento "${category}"` : ""}${city ? `, localizada em ${city}` : ""}.

Regras:
- Adapte totalmente o tom, vocabulário e argumentos ao segmento da empresa (o tom pra uma academia é diferente de um advogado, que é diferente de uma confeitaria, etc). NUNCA use uma mensagem genérica que sirva pra qualquer nicho.
- Seja direto, natural, como se fosse escrito por uma pessoa real no WhatsApp — nada de linguagem corporativa ou robótica.
- Mensagem curta (no máximo 4-5 linhas).
- Não use emojis em excesso (no máximo 1-2, se fizer sentido).
- Não invente números ou resultados específicos.
- Não assine com nome de pessoa, apenas mencione a IVS ao final se fizer sentido.
- Responda APENAS com o texto da mensagem, sem aspas, sem explicações antes ou depois.
`.trim();

  if (kind === "mensagem") {
    return `${base}\n\nEssa é a PRIMEIRA mensagem de contato — o objetivo é despertar curiosidade e abrir uma conversa, sem ser insistente ou vender de cara.`;
  }

  const previousBlock = previousMessages.length
    ? `\n\nMensagens já enviadas anteriormente para esse mesmo lead (NÃO repita o conteúdo, o tom ou a abertura de nenhuma delas):\n${previousMessages.map((m, i) => `${i + 1}. ${m}`).join("\n")}`
    : "";

  const followupContext =
    kind === "followup_1"
      ? "O lead não respondeu a primeira mensagem. Escreva um FOLLOW-UP educado, leve, sem soar chato ou desesperado, trazendo um ângulo novo."
      : "O lead ainda não respondeu depois de dois contatos. Escreva um ÚLTIMO follow-up, ainda mais leve e curto, dando a entender que essa é a última tentativa sem parecer ríspido.";

  return `${base}\n\n${followupContext}${previousBlock}`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const items = await db
      .select()
      .from(leadMessages)
      .where(eq(leadMessages.leadId, id))
      .orderBy(asc(leadMessages.createdAt));
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/leads/id/messages GET]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao ler mensagens" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const userId = typeof body?.userId === "string" ? body.userId : null;

    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }

    const existing = await db
      .select()
      .from(leadMessages)
      .where(eq(leadMessages.leadId, id))
      .orderBy(asc(leadMessages.createdAt));

    let kind: "mensagem" | "followup_1" | "followup_2" = "mensagem";
    if (existing.length === 1) kind = "followup_1";
    else if (existing.length >= 2) kind = "followup_2";

    const prompt = buildPrompt({
      name: lead.name,
      category: lead.category,
      city: lead.city,
      kind,
      previousMessages: existing.map((m) => m.content),
    });

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    const [saved] = await db.insert(leadMessages).values({ leadId: id, kind, content }).returning();

    const actionLabel =
      kind === "mensagem" ? "Gerou mensagem" : kind === "followup_1" ? "Gerou 1º follow-up" : "Gerou 2º follow-up";
    await db.insert(leadHistory).values({ leadId: id, userId, action: actionLabel });

    // Primeira mensagem gerada já move o lead pra "Primeira Mensagem" se ainda estava "Não Contatado"
    if (kind === "mensagem" && lead.status === "nao_contatado") {
      await db.update(leads).set({ status: "primeira_mensagem" }).where(eq(leads.id, id));
    }

    return NextResponse.json({ item: saved, kind }, { status: 201 });
  } catch (err) {
    console.error("[api/leads/id/messages POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao gerar mensagem" }, { status: 500 });
  }
}