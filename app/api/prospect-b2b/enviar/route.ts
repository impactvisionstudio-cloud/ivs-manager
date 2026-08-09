import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospectLeads, prospectContacts, prospectMessageTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderProspectMessage, buildWhatsAppLink } from "@/lib/prospect-message";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, userId } = body as { leadId: string; userId?: string };
    if (!leadId) {
      return NextResponse.json({ error: "leadId é obrigatório" }, { status: 400 });
    }

    const [lead] = await db.select().from(prospectLeads).where(eq(prospectLeads.id, leadId));
    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }

    const today = todayStr();
    const alreadySentToday =
      lead.lastContactedAt && new Date(lead.lastContactedAt).toISOString().slice(0, 10) === today;

    if (alreadySentToday) {
      return NextResponse.json({ error: "Esse lead já foi contatado hoje" }, { status: 409 });
    }

    const messageIndex = lead.assignedMessageIndex || 1;
    const [template] = await db
      .select()
      .from(prospectMessageTemplates)
      .where(eq(prospectMessageTemplates.index, messageIndex));

    if (!template) {
      return NextResponse.json({ error: "Modelo de mensagem não encontrado" }, { status: 400 });
    }

    const message = renderProspectMessage(template.content, lead);
    const whatsappUrl = buildWhatsAppLink(lead.phone, message);

    await db.insert(prospectContacts).values({
      leadId: lead.id,
      messageIndex,
      messageContent: message,
      sentBy: userId || null,
    });

    await db
      .update(prospectLeads)
      .set({ status: "contatado", lastContactedAt: new Date(), updatedAt: new Date() })
      .where(eq(prospectLeads.id, lead.id));

    return NextResponse.json({ whatsappUrl, message });
  } catch (err) {
    console.error("[api/prospect-b2b/enviar POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao registrar envio" }, { status: 500 });
  }
}