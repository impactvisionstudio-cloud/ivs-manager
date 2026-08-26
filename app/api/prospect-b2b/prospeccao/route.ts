import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  prospectLeads,
  prospectContacts,
  prospectMessageTemplates,
  prospectSettings,
  users,
} from "@/lib/db/schema";
import { getScheduleStatus } from "@/lib/prospeccao-schedule";
import { createClient } from "@/lib/supabase/server";
import { ROLE_PERMISSIONS } from "@/types";
import type { Permission, Role } from "@/types";

const DEFAULT_DAILY_LIMIT = 30;

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

async function getDailyLimit(userId: string): Promise<number> {
  const perUserRows = await db
    .select()
    .from(prospectSettings)
    .where(eq(prospectSettings.key, `daily_limit:${userId}`));
  const perUserValue = perUserRows[0]?.value ? parseInt(perUserRows[0].value, 10) : NaN;
  if (Number.isFinite(perUserValue) && perUserValue > 0) return perUserValue;

  const globalRows = await db.select().from(prospectSettings).where(eq(prospectSettings.key, "daily_limit"));
  const globalValue = globalRows[0]?.value ? parseInt(globalRows[0].value, 10) : NaN;
  return Number.isFinite(globalValue) && globalValue > 0 ? globalValue : DEFAULT_DAILY_LIMIT;
}

// Troca [Empresa] pelo nome da empresa, [vendedor]/[Vendedor] pelo primeiro
// nome de quem está enviando (Daniel ou Eduardo) e {{nicho}} pelo nicho do lead.
function personalize(template: string, companyName: string, vendorFirstName: string, niche: string): string {
  return template
    .replace(/\[\s*empresa\s*\]/gi, companyName)
    .replace(/\{\{\s*empresa\s*\}\}/gi, companyName)
    .replace(/\[\s*vendedor\s*\]/gi, vendorFirstName)
    .replace(/\{\{\s*vendedor\s*\}\}/gi, vendorFirstName)
    .replace(/\{\{\s*nicho\s*\}\}/gi, niche);
}

// GET → fila de hoje, 100% isolada por dono do lead (owner_id). Cada
// usuário só sorteia entre os próprios leads "novo" — não existe mais
// disputa ou mistura entre Daniel e Eduardo.
export async function GET() {
  const dbUser = await requireProspectUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const schedule = getScheduleStatus();
  if (!schedule.windowOpen) {
    return NextResponse.json({
      windowOpen: false,
      reason: schedule.reason,
      queue: [],
      contatadosHoje: 0,
      restanteHoje: 0,
      dailyLimit: await getDailyLimit(dbUser.id),
    });
  }

  const dailyLimit = await getDailyLimit(dbUser.id);
  const inicioDoDia = new Date(`${schedule.dateKeyBrasilia}T00:00:00-03:00`);
  const vendorFirstName = dbUser.name.split(" ")[0];

  const contatadosHojeResult = await db
    .select({ count: sql<number>`count(distinct ${prospectContacts.leadId})` })
    .from(prospectContacts)
    .where(and(gte(prospectContacts.sentAt, inicioDoDia), eq(prospectContacts.sentBy, dbUser.id)));
  const contatadosHoje = Number(contatadosHojeResult[0]?.count ?? 0);
  const restanteHoje = Math.max(dailyLimit - contatadosHoje, 0);

  if (restanteHoje === 0) {
    return NextResponse.json({ windowOpen: true, queue: [], contatadosHoje, restanteHoje: 0, dailyLimit });
  }

  const templates = await db.select().from(prospectMessageTemplates);
  const templateByIndex = new Map(templates.map((t) => [t.index, t.content]));

  const jaReservados = await db
    .select()
    .from(prospectLeads)
    .where(
      and(
        eq(prospectLeads.status, "novo"),
        eq(prospectLeads.ownerId, dbUser.id),
        eq(prospectLeads.assignedDate, schedule.dateKeyBrasilia)
      )
    );

  const faltamReservar = restanteHoje - jaReservados.length;
  const novosReservados: (typeof prospectLeads.$inferSelect)[] = [];

  if (faltamReservar > 0) {
    const candidatos = await db
      .select()
      .from(prospectLeads)
      .where(
        and(
          eq(prospectLeads.status, "novo"),
          eq(prospectLeads.ownerId, dbUser.id),
          sql`(${prospectLeads.assignedDate} is null or ${prospectLeads.assignedDate} <> ${schedule.dateKeyBrasilia})`
        )
      )
      .limit(faltamReservar);

    for (const lead of candidatos) {
      const messageIndex = Math.floor(Math.random() * 3) + 1;
      await db
        .update(prospectLeads)
        .set({ assignedDate: schedule.dateKeyBrasilia, assignedMessageIndex: messageIndex, assignedTo: dbUser.id })
        .where(eq(prospectLeads.id, lead.id));
      novosReservados.push({
        ...lead,
        assignedDate: schedule.dateKeyBrasilia,
        assignedMessageIndex: messageIndex,
        assignedTo: dbUser.id,
      });
    }
  }

  const queue = [...jaReservados, ...novosReservados].map((lead) => {
    const idx = lead.assignedMessageIndex ?? 1;
    const template = templateByIndex.get(idx) ?? "";
    return {
      id: lead.id,
      empresa: lead.companyName,
      telefone: lead.phone,
      nicho: lead.niche ?? "",
      messageId: idx,
      text: personalize(template, lead.companyName, vendorFirstName, lead.niche ?? ""),
    };
  });

  return NextResponse.json({ windowOpen: true, queue, contatadosHoje, restanteHoje, dailyLimit });
}

export async function POST(req: Request) {
  const dbUser = await requireProspectUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const schedule = getScheduleStatus();
  if (!schedule.windowOpen) {
    return NextResponse.json({ error: schedule.reason }, { status: 400 });
  }

  const body = await req.json();
  const { leadId, messageId, text } = body as { leadId: string; messageId: number; text: string };
  if (!leadId || !messageId || !text) {
    return NextResponse.json({ error: "leadId, messageId e text são obrigatórios" }, { status: 400 });
  }

  await db.insert(prospectContacts).values({
    leadId,
    messageIndex: messageId,
    messageContent: text,
    sentBy: dbUser.id,
  });

  await db
    .update(prospectLeads)
    .set({ status: "contatado", lastContactedAt: new Date() })
    .where(eq(prospectLeads.id, leadId));

  return NextResponse.json({ ok: true });
}