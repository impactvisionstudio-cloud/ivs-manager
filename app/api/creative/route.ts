import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { creativeConversations, creativeMessages } from "@/lib/db/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_PROMPT = `
Você é o Diretor Criativo da Impact Vision Studio, especialista em criar legendas para posts de redes sociais (Instagram, principalmente).

Quando o usuário descrever o conteúdo do post (tema, cliente, objetivo), você deve gerar uma legenda pronta para publicar: chamativa, com quebra de linha quando fizer sentido, podendo incluir emojis com moderação e, ao final, sugestões de 5 a 8 hashtags relevantes.

Responda sempre em português, direto com a legenda pronta — sem explicações extras antes ou depois.
`.trim();

interface CreativeMessageRow {
  role: string;
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      conversationId,
      message,
      mode,
    }: { conversationId?: string; message: string; mode: "text" | "image" } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "message é obrigatório" }, { status: 400 });
    }

    // Cria conversa nova se não veio conversationId
    let convoId = conversationId;
    if (!convoId) {
      const [convo] = await db
        .insert(creativeConversations)
        .values({ title: message.slice(0, 40) })
        .returning();
      convoId = convo.id;
    }

    // Salva a mensagem do usuário
    await db.insert(creativeMessages).values({
      conversationId: convoId,
      role: "user",
      content: message,
    });

    if (mode === "image") {
      // Geração de imagem (Nano Banana)
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: message,
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((p) => p.inlineData);

      if (!imagePart?.inlineData?.data) {
        return NextResponse.json(
          { error: "Não foi possível gerar a imagem" },
          { status: 500 }
        );
      }

      const imageBase64 = imagePart.inlineData.data;

      await db.insert(creativeMessages).values({
        conversationId: convoId,
        role: "assistant",
        content: "[imagem gerada]",
        imageBase64,
      });

      return NextResponse.json({
        conversationId: convoId,
        imageBase64,
      });
    }

    // Modo texto (legenda)
    const history = await db
      .select()
      .from(creativeMessages)
      .where(eq(creativeMessages.conversationId, convoId))
      .orderBy(asc(creativeMessages.createdAt));

    const chatHistory = (history as CreativeMessageRow[])
      .filter((m) => !m.content.startsWith("[imagem"))
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Entendido, vou seguir esse estilo." }] },
        ...chatHistory,
      ],
    });

    const rawText = response.text ?? "";

    await db.insert(creativeMessages).values({
      conversationId: convoId,
      role: "assistant",
      content: rawText,
    });

    return NextResponse.json({
      conversationId: convoId,
      message: rawText,
    });
  } catch (err) {
    console.error("Erro na rota creative:", err);
    return NextResponse.json({ error: "Erro ao processar mensagem" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const conversationId = req.nextUrl.searchParams.get("conversationId");

    if (conversationId) {
      const messages = await db
        .select()
        .from(creativeMessages)
        .where(eq(creativeMessages.conversationId, conversationId))
        .orderBy(asc(creativeMessages.createdAt));
      return NextResponse.json(messages);
    }

    const conversations = await db
      .select()
      .from(creativeConversations)
      .orderBy(desc(creativeConversations.createdAt));
    return NextResponse.json(conversations);
  } catch (err) {
    console.error("Erro ao buscar conversas:", err);
    return NextResponse.json({ error: "Erro ao buscar conversas" }, { status: 500 });
  }
}