// Regra de agendamento da fila diária de Prospect B2B:
// - roda de segunda a sábado
// - libera às 9h no horário de Brasília (America/Sao_Paulo)
// - domingo não libera fila nova
//
// Isso NÃO dispara envio automático (a API oficial do WhatsApp ainda não
// está conectada) — só controla quando a fila do dia fica disponível para
// o Daniel clicar em "Abrir no WhatsApp" manualmente.

const TIMEZONE = "America/Sao_Paulo";

interface BrasiliaNow {
  weekday: number;
  hour: number;
  minute: number;
  year: number;
  month: number;
  day: number;
}

function nowInBrasilia(): BrasiliaNow {
  // Converte "agora" para os componentes de data/hora de Brasília,
  // reconstruindo um objeto "local" equivalente pra facilitar comparações.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    weekday: weekdayMap[get("weekday")] ?? new Date().getDay(),
    hour: parseInt(get("hour"), 10),
    minute: parseInt(get("minute"), 10),
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10),
    day: parseInt(get("day"), 10),
  };
}

export interface ScheduleStatus {
  isProspectingDay: boolean; // segunda(1) a sábado(6), não domingo(0)
  isAfterStartTime: boolean; // já passou das 9h em Brasília
  windowOpen: boolean; // isProspectingDay && isAfterStartTime
  dateKeyBrasilia: string; // YYYY-MM-DD em Brasília, usado pra "contatados hoje"
  reason?: string;
}

export function getScheduleStatus(): ScheduleStatus {
  const b = nowInBrasilia();
  const isProspectingDay = b.weekday !== 0; // não é domingo
  const isAfterStartTime = b.hour >= 9;
  const dateKeyBrasilia = `${b.year}-${String(b.month).padStart(2, "0")}-${String(b.day).padStart(2, "0")}`;

  let reason: string | undefined;
  if (!isProspectingDay) reason = "Hoje é domingo — sem prospecção nova. Volte amanhã a partir das 9h.";
  else if (!isAfterStartTime) reason = "A fila de hoje libera às 9h (horário de Brasília).";

  return {
    isProspectingDay,
    isAfterStartTime,
    windowOpen: isProspectingDay && isAfterStartTime,
    dateKeyBrasilia,
    reason,
  };
}