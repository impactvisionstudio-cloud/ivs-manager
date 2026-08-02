import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiInsights } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get("clientId");

    const rows = clientId
      ? await db
          .select()
          .from(aiInsights)
          .where(eq(aiInsights.clientId, clientId))
          .orderBy(desc(aiInsights.createdAt))
      : await db.select().from(aiInsights).orderBy(desc(aiInsights.createdAt));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Erro ao buscar histórico da IVS AI:", err);
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type OutputKey = "postIdeas" | "painPoints" | "differentiators" | "visualIdentitySuggestions";

const OUTPUT_LABELS: Record<OutputKey, string> = {
  postIdeas: "10 ideias de post para redes sociais, virais e específicas para o nicho",
  painPoints: "as principais dores do nicho do cliente, cada uma com uma sugestão de solução",
  differentiators: "diferenciais que essa empresa pode explorar em relação aos concorrentes do nicho",
  visualIdentitySuggestions: "sugestões de identidade visual (cores, estilo, tom de comunicação) para o nicho",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientId,
      contractId,
      niche,
      observations,
      outputs,
    }: {
      clientId: string;
      contractId?: string;
      niche: string;
      observations?: string;
      outputs: OutputKey[];
    } = body;

    if (!clientId || !niche || !outputs?.length) {
      return NextResponse.json(
        { error: "clientId, niche e outputs são obrigatórios" },
        { status: 400 }
      );
    }

    const sections = outputs
      .map((key) => `"${key}": ${OUTPUT_LABELS[key]}`)
      .join("\n");

    const prompt = `
Você é um estrategista de marketing e social media especializado em produção audiovisual.

Nicho do cliente: ${niche}
Observações adicionais: ${observations || "nenhuma"}

Gere um JSON válido, e SOMENTE o JSON (sem markdown, sem texto antes ou depois), com exatamente estas chaves:
${sections}

Regras de formato:
- "postIdeas": array de strings (cada string é uma ideia de post)
- "painPoints": array de objetos { "pain": string, "solution": string }
- "differentiators": array de strings
- "visualIdentitySuggestions": array de strings

Só inclua no JSON as chaves pedidas acima. Responda em português.
`.trim();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "A IA retornou uma resposta em formato inválido. Tente novamente." },
        { status: 502 }
      );
    }

    const [inserted] = await db
      .insert(aiInsights)
      .values({
        clientId,
        contractId: contractId || null,
        niche,
        observations: observations || null,
        postIdeas: outputs.includes("postIdeas") ? parsed.postIdeas : null,
        painPoints: outputs.includes("painPoints") ? parsed.painPoints : null,
        differentiators: outputs.includes("differentiators") ? parsed.differentiators : null,
        visualIdentitySuggestions: outputs.includes("visualIdentitySuggestions")
          ? parsed.visualIdentitySuggestions
          : null,
      })
      .returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error("Erro na rota ai-insights:", err);
    return NextResponse.json(
      { error: "Erro ao gerar insights com a IA" },
      { status: 500 }
    );
  }
}