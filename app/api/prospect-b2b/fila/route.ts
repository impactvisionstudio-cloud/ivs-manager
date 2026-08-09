import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospectLeads, prospectMessageTemplates, prospectSettings } from "@/lib/db/schema";
import { eq, isNull, sql } from "drizzle-orm";
import { renderProspectMessage } from "@/lib/prospect-message";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function getDailyLimit() {
  const [row] = await db.select().from(prospectSettings).where(eq(prospectSettings.key, "daily_limit"));
  return row ? Number(row.value) : 40;
}

export async function GET() {
  try {
    const today = todayStr();
    const dailyLimit = await getDailyLimit();

    let templates = await db.select().from(prospectMessageTemplates);
    if (templates.length === 0) {
      return NextResponse.json({ error: "Nenhum modelo de mensagem cadastrado ainda" }, { status: 400 });
    }
    const templateByIndex = new Map(templates.map((t) => [t.index, t.content]));

    let todaysLeads = await db
      .select()
      .from(prospectLeads)
      .where(eq(prospectLeads.assignedDate, today));

    if (todaysLeads.length < dailyLimit) {
      const needed = dailyLimit - todaysLeads.length;

      const available = await db
        .select()
        .from(prospectLeads)
        .where(sql`${prospectLeads.status} = 'novo' AND ${prospectLeads.assignedDate} IS NULL`)
        .orderBy(sql`random()`)
        .limit(needed);

      for (const lead of available) {
        const messageIndex = [1, 2, 3][Math.floor(Math.random() * 3)];
        await db
          .update(prospectLeads)
          .set({ assignedDate: today, assignedMessageIndex: messageIndex, updatedAt: new Date() })
          .where(eq(prospectLeads.id, lead.id));
      }

      todaysLeads = await db
        .select()
        .from(prospectLeads)
        .where(eq(prospectLeads.assignedDate, today));
    }

    const queue = todaysLeads.map((lead) => {
      const template = templateByIndex.get(lead.assignedMessageIndex || 1) || "";
      const message = renderProspectMessage(template, lead);
      const sentToday = !!(lead.lastContactedAt && new Date(lead.lastContactedAt).toISOString().slice(0, 10) === today);
      return {
        id: lead.id,
        companyName: lead.companyName,
        phone: lead.phone,
        niche: lead.niche,
        status: lead.status,
        messageIndex: lead.assignedMessageIndex,
        message,
        sentToday,
      };
    });

    return NextResponse.json({
      date: today,
      dailyLimit,
      total: queue.length,
      sent: queue.filter((q) => q.sentToday).length,
      queue,
    });
  } catch (err) {
    console.error("[api/prospect-b2b/fila GET]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao montar fila" }, { status: 500 });
  }
}