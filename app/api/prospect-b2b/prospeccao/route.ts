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
import { ROLE_PERMISSIONS } from "@/types";
import type { Permission, Role } from "@/types";

const DEFAULT_DAILY_LIMIT = 30;

// Confere login (Supabase Auth) + busca o usuário correspondente na tabela
// `users` do app + confere se o cargo dele tem a permissão "prospectb2b.use"
// (hoje: gestor e administrador, via ROLE_PERMISSIONS em @/types). Devolve
// o usuário do banco (com o id em uuid usado nas FKs) ou null se não tiver acesso.
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

// Limite diário de LEDs por usuário. Procura primeiro uma chave específica
// do usuário ("daily_limit:<userId>"); se não existir, cai pro limite
// global antigo ("daily_limit", pra não perder configuração que já existia)
// e por último no padrão de 30. Pra mudar o limite de alguém no futuro,
// basta criar/editar a linha com key = `daily_limit:${userId}` em
// prospect_settings — não precisa mexer em código.
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

function personalize(template: string, companyName: string): string {
  return template.replaceAll("[Empresa]", companyName);
}

// GET → devolve a fila de hoje, filtrada pelo usuário autenticado. Um lead
// só entra na fila de alguém uma vez por dia: se já tem assignedDate = hoje
// E assignedTo = esse usuário, ele é reaproveitado (com a mesma mensagem já
// sorteada); senão, sorteamos novos leads "novo" que NINGUÉM pegou hoje
// ainda E que não têm dono exclusivo de outra pessoa (ownerId nulo ou igual
// ao usuário atual), até bater o restante da meta diária DESSE usuário, e
// gravamos assignedDate/assignedMessageIndex/assignedTo neles — isso
// garante que Daniel e Eduardo nunca disputem ou repitam o mesmo lead no
// mesmo dia, e que leads reservados (ownerId) só entrem na fila do dono.
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

  const contatadosHojeResult = await db
    .select({ count: sql<number>`count(distinct ${prospectContacts.leadId})` })
    .from(prospectContacts)
    .where(and(gte(prospectContacts.sentAt, inicioDoDia), eq(prospectContacts.sentBy, dbUser.id)));
  const contatadosHoje = Number(contatadosHojeResult[0]?.count ?? 0);
  const restanteHoje = Math.max(dailyLimit - contatadosHoje, 0);

  if (restanteHoje === 0) {
    return NextResponse.json({ windowOpen: true, queue: [], contatadosHoje, restanteHoje: 0, dailyLimit });
  }

  // As 3 mensagens editáveis (index 1/2/3), cadastradas em prospect_message_templates.
  const templates = await db.select().from(prospectMessageTemplates);
  const templateByIndex = new Map(templates.map((t) => [t.index, t.content]));

  // Leads já reservados pra hoje PRA ESSE usuário (reaproveita se a página
  // for recarregada, sem misturar com a fila de outro usuário).
  const jaReservados = await db
    .select()
    .from(prospectLeads)
    .where(
      and(
        eq(prospectLeads.status, "novo"),
        eq(prospectLeads.assignedDate, schedule.dateKeyBrasilia),
        eq(prospectLeads.assignedTo, dbUser.id)
      )
    );

  const faltamReservar = restanteHoje - jaReservados.length;
  const novosReservados: (typeof prospectLeads.$inferSelect)[] = [];

  if (faltamReservar > 0) {
    // Só entram leads que ninguém pegou hoje ainda (assignedDate nulo ou
    // de outro dia) e que não têm dono exclusivo de outra pessoa.
    const candidatos = await db
      .select()
      .from(prospectLeads)
      .where(
        and(
          eq(prospectLeads.status, "novo"),
          or(isNull(prospectLeads.assignedDate), sql`${prospectLeads.assignedDate} <> ${schedule.dateKeyBrasilia}`),
          or(isNull(prospectLeads.ownerId), eq(prospectLeads.ownerId, dbUser.id))
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
      text: personalize(template, lead.companyName),
    };
  });

  return NextResponse.json({ windowOpen: true, queue, contatadosHoje, restanteHoje, dailyLimit });
}

// POST → chamado quando o usuário clica em "Abrir no WhatsApp": grava o
// histórico em prospect_contacts (mensagem exata que foi mostrada/enviada,
// com sentBy = quem enviou) e marca o lead como "contatado".
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