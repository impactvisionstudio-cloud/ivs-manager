import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiConversations, aiMessages, aiInsights } from "@/lib/db/schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

const SYSTEM_PROMPT = `
Você é a IVS AI, assistente de estratégia de marketing da Impact Vision Studio (produtora audiovisual e agência de marketing).

O usuário inicia a conversa mencionando um nicho/cliente com @ (ex: "@Academia Santiago" ou "tenho um cliente chamado Power Fit, dono de uma @academia").

Fluxo obrigatório:
1. Na primeira mensagem, identifique o nicho/negócio mencionado e faça, em uma única mensagem, a lista completa de perguntas: (1) a empresa tem identidade visual forte? (2) tem site? (3) tem Instagram? se sim, quantos seguidores aproximadamente? (4) as fotos publicadas são boas? (5) tem integração com WhatsApp? Não pergunte uma de cada vez, mande a lista toda de uma vez, curta e direta.
2. Quando o usuário responder essas perguntas (mesmo que de forma resumida ou incompleta), você deve gerar o resultado final em uma única resposta, e essa resposta deve ser SOMENTE um JSON válido (sem markdown, sem texto antes ou depois), com este formato exato:

{
  "ready": true,
  "niche": "<nicho identificado>",
  "hasInstagram": true|false,
  "hasVisualIdentity": true|false,
  "competitors": [ { "name": string, "handle": string, "followers": string, "note": string } ]  (10 itens, concorrentes conhecidos do nicho, com base no seu conhecimento, seguidores aproximados),
  "postIdeas": [ string ] (10 ideias virais de post, específicas pro nicho),
  "painPoints": [ { "pain": string, "solution": string } ]  (EXATAMENTE 10 itens, nem a mais nem a menos. Dores reais do CLIENTE FINAL desse nicho -- ou seja, a dor de quem CONTRATARIA um negocio como esse, nao a dor de quem JA TEM o negocio. Ex: pro nicho academia, e a dor de quem quer malhar (falta de tempo, vergonha de comecar, nao ver resultado); pro nicho audiovisual, e a dor de quem precisa gravar video (nao sabe roteirizar, medo de aparecer, achou caro antes). Para cada dor, a "solution" deve ser como ESSE NEGOCIO resolve isso, funcionando como gancho de venda/conteudo),
  "instagramNameSuggestions": [ string ] | null (só preencha se hasInstagram for false; senão null),
  "visualIdentityTips": [ string ] | null (só preencha se hasVisualIdentity for false; senão null)
}

Regras importantes:
- Enquanto ainda não tiver as respostas das perguntas, NUNCA gere esse JSON — responda normalmente em texto perguntando o que falta.
- Uma vez que gerar o JSON final, essa é a última mensagem da conversa — não adicione texto explicativo fora do JSON.
- Responda sempre em português.
`.trim();

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message }: { conversationId?: string; message: string } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "message é obrigatório" }, { status: 400 });
    }

    // Cria conversa nova se não veio conversationId
    let convoId = conversationId;
    if (!convoId) {
      const nicheMatch = message.match(/@([\p{L}0-9_]+(?:\s[\p{L}0-9_]+)*)/u);
      const title = nicheMatch ? nicheMatch[1] : message.slice(0, 40);

      const [convo] = await db
        .insert(aiConversations)
        .values({ title })
        .returning();
      convoId = convo.id;
    }

    // Salva a mensagem do usuário
    await db.insert(aiMessages).values({
      conversationId: convoId,
      role: "user",
      content: message,
    });

    // Busca histórico completo da conversa
    const history = await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, convoId))
      .orderBy(asc(aiMessages.createdAt));

    const chatHistory = history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Entendido, vou seguir esse fluxo." }] },
        ...chatHistory.slice(0, -1),
      ],
    });

    const result = await chat.sendMessage(history[history.length - 1].content);
    const rawText = result.response.text();

    const parsed = extractJson(rawText);

    if (parsed && parsed.ready === true) {
      // Resultado final: salva em ai_insights e responde estruturado
      const [insight] = await db
        .insert(aiInsights)
        .values({
          niche: (parsed.niche as string) || "",
          postIdeas: parsed.postIdeas ?? null,
          painPoints: parsed.painPoints ?? null,
          differentiators: parsed.competitors ?? null,
          visualIdentitySuggestions: parsed.visualIdentityTips ?? null,
        })
        .returning();

      await db.insert(aiMessages).values({
        conversationId: convoId,
        role: "assistant",
        content: JSON.stringify(parsed),
      });

      return NextResponse.json({
        conversationId: convoId,
        done: true,
        result: {
          ...parsed,
          insightId: insight.id,
        },
      });
    }

    // Ainda é conversa (perguntas), salva a resposta da IA como mensagem normal
    await db.insert(aiMessages).values({
      conversationId: convoId,
      role: "assistant",
      content: rawText,
    });

    return NextResponse.json({
      conversationId: convoId,
      done: false,
      message: rawText,
    });
  } catch (err) {
    console.error("Erro na rota ai-chat:", err);
    return NextResponse.json({ error: "Erro ao processar mensagem" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const conversationId = req.nextUrl.searchParams.get("conversationId");

    if (conversationId) {
      const messages = await db
        .select()
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, conversationId))
        .orderBy(asc(aiMessages.createdAt));
      return NextResponse.json(messages);
    }

    const conversations = await db
      .select()
      .from(aiConversations)
      .orderBy(desc(aiConversations.createdAt));
    return NextResponse.json(conversations);
  } catch (err) {
    console.error("Erro ao buscar conversas:", err);
    return NextResponse.json({ error: "Erro ao buscar conversas" }, { status: 500 });
  }
}