import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospectLeads, prospectMessageTemplates, prospectSettings, users } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { renderProspectMessage } from "@/lib/prospect-message";
import { createClient } from "@/lib/supabase/server";
import { ROLE_PERMISSIONS } from "@/types";
import type { Permission, Role } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function getDailyLimit(userId: string): Promise<number> {
  const perUserRows = await db
    .select()
    .from(prospectSettings)
    .where(eq(prospectSettings.key, `daily_limit:${userId}`));
  const perUserValue = perUserRows[0]?.value ? parseInt(perUserRows[0].value, 10) : NaN;
  if (Number.isFinite(perUserValue) && perUserValue > 0) return perUserValue;

  const globalRows = await db.select().from(prospectSettings).where(eq(prospectSettings.key, "daily_limit"));
  const globalValue = globalRows[0]?.value ? parseInt(globalRows[0].value, 10) : NaN;
  return Number.isFinite(globalValue) && globalValue > 0 ? globalValue : 40;
}

export async function GET() {
  try {
    const dbUser = await requireProspectUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const today = todayStr();
    const dailyLimit = await getDailyLimit(dbUser.id);

    const templates = await db
      .select()
      .from(prospectMessageTemplates)
      .where(eq(prospectMessageTemplates.ownerId, dbUser.id));
    if (templates.length === 0) {
      return NextResponse.json({ error: "Nenhum modelo de mensagem cadastrado ainda" }, { status: 400 });
    }
    const templateByIndex = new Map(templates.map((t) => [t.index, t.content]));

    let todaysLeads = await db
      .select()
      .from(prospectLeads)
      .where(and(eq(prospectLeads.assignedDate, today), eq(prospectLeads.ownerId, dbUser.id)));

    if (todaysLeads.length < dailyLimit) {
      const needed = dailyLimit - todaysLeads.length;
      const available = await db
        .select()
        .from(prospectLeads)
        .where(
          sql`${prospectLeads.status} = 'novo' AND ${prospectLeads.assignedDate} IS NULL AND ${prospectLeads.ownerId} = ${dbUser.id}`
        )
        .orderBy(sql`random()`)
        .limit(needed);

      for (const lead of available) {
        const messageIndex = [1, 2, 3, 4, 5, 6][Math.floor(Math.random() * 6)];
        await db
          .update(prospectLeads)
          .set({ assignedDate: today, assignedMessageIndex: messageIndex, updatedAt: new Date() })
          .where(eq(prospectLeads.id, lead.id));
      }

      todaysLeads = await db
        .select()
        .from(prospectLeads)
        .where(and(eq(prospectLeads.assignedDate, today), eq(prospectLeads.ownerId, dbUser.id)));
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