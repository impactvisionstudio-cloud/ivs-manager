import { NextResponse } from "next/server";
import { and, eq, gte, isNull, or, sql } from "drizzle-orm";
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

const DEFAULT_DAILY_LIMIT = 30;

// Confere login (Supabase Auth) + busca o usuário correspondente na tabela
// `users` do app + confere se o cargo é "gestor" (único liberado por ora
// pro Prospect B2B). Devolve o usuário do banco (com o id em uuid usado
// nas FKs) ou null se não tiver acesso.
async function requireGestor() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const [dbUser] = await db.select().from(users).where(eq(users.authId, authUser.id));
  if (!dbUser || dbUser.role !== "gestor") return null;

  return dbUser;
}

async function getDailyLimit(): Promise<number> {
  const rows = await db.select().from(prospectSettings).where(eq(prospectSettings.key, "daily_limit"));
  const parsed = rows[0]?.value ? parseInt(rows[0].value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_LIMIT;
}

function personalize(template: string, companyName: string): string {
  return template.replaceAll("[Empresa]", companyName);
}

// GET → devolve a fila de hoje. Um lead só entra na fila uma vez por dia:
// se já tem assignedDate = hoje, ele é reaproveitado (com a mesma mensagem
// já sorteada); senão, sorteamos novos leads "novo" até bater o restante da
// meta diária e gravamos assignedDate/assignedMessageIndex neles.
export async function GET() {
  const dbUser = await requireGestor();
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
    });
  }

  const dailyLimit = await getDailyLimit();
  const inicioDoDia = new Date(`${schedule.dateKeyBrasilia}T00:00:00-03:00`);

  const contatadosHojeResult = await db
    .select({ count: sql<number>`count(distinct ${prospectContacts.leadId})` })
    .from(prospectContacts)
    .where(gte(prospectContacts.sentAt, inicioDoDia));
  const contatadosHoje = Number(contatadosHojeResult[0]?.count ?? 0);
  const restanteHoje = Math.max(dailyLimit - contatadosHoje, 0);

  if (restanteHoje === 0) {
    return NextResponse.json({ windowOpen: true, queue: [], contatadosHoje, restanteHoje: 0 });
  }

  // As 3 mensagens editáveis (index 1/2/3), cadastradas em prospect_message_templates.
  const templates = await db.select().from(prospectMessageTemplates);
  const templateByIndex = new Map(templates.map((t) => [t.index, t.content]));

  // Leads já reservados pra hoje (reaproveita se a página for recarregada).
  const jaReservados = await db
    .select()
    .from(prospectLeads)
    .where(and(eq(prospectLeads.status, "novo"), eq(prospectLeads.assignedDate, schedule.dateKeyBrasilia)));

  const faltamReservar = restanteHoje - jaReservados.length;
  const novosReservados: (typeof prospectLeads.$inferSelect)[] = [];

  if (faltamReservar > 0) {
    const candidatos = await db
      .select()
      .from(prospectLeads)
      .where(
        and(
          eq(prospectLeads.status, "novo"),
          or(isNull(prospectLeads.assignedDate), sql`${prospectLeads.assignedDate} <> ${schedule.dateKeyBrasilia}`)
        )
      )
      .limit(faltamReservar);

    for (const lead of candidatos) {
      const messageIndex = Math.floor(Math.random() * 3) + 1;
      await db
        .update(prospectLeads)
        .set({ assignedDate: schedule.dateKeyBrasilia, assignedMessageIndex: messageIndex })
        .where(eq(prospectLeads.id, lead.id));
      novosReservados.push({ ...lead, assignedDate: schedule.dateKeyBrasilia, assignedMessageIndex: messageIndex });
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
      text: personalize(template, lead.companyName),
    };
  });

  return NextResponse.json({ windowOpen: true, queue, contatadosHoje, restanteHoje });
}

// POST → chamado quando o Daniel clica em "Abrir no WhatsApp": grava o
// histórico em prospect_contacts (mensagem exata que foi mostrada/enviada)
// e marca o lead como "contatado".
export async function POST(req: Request) {
  const dbUser = await requireGestor();
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