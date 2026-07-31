import "server-only";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
XLSX.set_fs(fs);   // ← esta linha nova

import {
  mockClients,
  mockProjects,
  mockDeals,
  mockTransactions,
  mockEquipments,
  mockContracts,
  mockEvents,
  mockUsers,
} from "@/lib/mock/data";

/**
 * Banco de dados em Excel.
 *
 * Toda a persistência do sistema fica em um único arquivo .xlsx dentro da
 * pasta /data na raiz do projeto (fora do controle de versão). Cada aba da
 * planilha representa um módulo (clientes, projetos, negocios, etc). Você
 * pode abrir esse arquivo diretamente no Excel a qualquer momento - ele é
 * o "banco de dados" de verdade da aplicação, não apenas um export.
 *
 * IMPORTANTE: feche o arquivo ivs-database.xlsx no Excel antes de criar,
 * editar ou excluir algo pelo site. Com o arquivo aberto no Excel, o Windows
 * trava o arquivo para escrita e a gravação falha silenciosamente em alguns
 * casos.
 */

export const DB_DIR = path.join(process.cwd(), "data");
export const DB_PATH = path.join(DB_DIR, "ivs-database.xlsx");

export type SheetName =
  | "clientes"
  | "projetos"
  | "negocios"
  | "financeiro"
  | "equipamentos"
  | "contratos"
  | "agenda"
  | "equipe"
  | "checklist";

const SEED = {
  clientes: mockClients,
  projetos: mockProjects.map((p) => ({ ...p, team: p.team.join(",") })),
  negocios: mockDeals,
  financeiro: mockTransactions,
  equipamentos: mockEquipments,
  contratos: mockContracts,
  agenda: mockEvents.map((e) => ({ ...e, team: (e.team ?? []).join(",") })),
  equipe: mockUsers,
  checklist: [
    { id: "1", projectId: "p1", title: "Aprovar roteiro com cliente", done: true },
    { id: "2", projectId: "p1", title: "Reservar equipamento de gravação", done: true },
    { id: "3", projectId: "p1", title: "Confirmar equipe e locação", done: false },
    { id: "4", projectId: "p1", title: "Gravação principal", done: false },
    { id: "5", projectId: "p1", title: "Corte inicial para aprovação", done: false },
    { id: "6", projectId: "p1", title: "Entrega final", done: false },
  ],
} as Record<SheetName, Record<string, unknown>[]>;

const ALL_SHEETS = Object.keys(SEED) as SheetName[];

class ExcelDbError extends Error {
  constructor(message: string, cause?: unknown) {
    super(cause instanceof Error ? `${message}: ${cause.message}` : message);
    this.name = "ExcelDbError";
  }
}

function log(...args: unknown[]) {
  // Logs sempre aparecem no terminal onde você rodou "npm run dev".
  console.log("[excel-db]", ...args);
}

function ensureFile() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
      const wb = XLSX.utils.book_new();

      for (const sheet of ALL_SHEETS) {
        const ws = XLSX.utils.json_to_sheet(SEED[sheet]);
        XLSX.utils.book_append_sheet(wb, ws, sheet);
      }

      XLSX.writeFile(wb, DB_PATH);

      log("arquivo criado em", DB_PATH);
    }
  } catch (err) {
    console.error("ERRO REAL AO CRIAR EXCEL:", err);
    throw err;
  }
}

function readWorkbook(): XLSX.WorkBook {
  ensureFile();
  try {
    return XLSX.readFile(DB_PATH);
  } catch (err) {
    throw new ExcelDbError(
      `Não foi possível ler ${DB_PATH}. Se o arquivo estiver aberto no Excel, feche-o e tente de novo`,
      err
    );
  }
}

function writeWorkbook(wb: XLSX.WorkBook) {
  try {
    XLSX.writeFile(wb, DB_PATH);
  } catch (err) {
    throw new ExcelDbError(
      `Não foi possível salvar em ${DB_PATH}. Se o arquivo estiver aberto no Excel (ou sincronizando no OneDrive/Google Drive), feche-o e tente de novo`,
      err
    );
  }
}

/** Converte valores "planos" (strings com vírgula) de volta pra array em campos conhecidos. */
function coerceRow(sheet: SheetName, row: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...row };
  if ((sheet === "projetos" || sheet === "agenda") && typeof out.team === "string") {
    out.team = out.team ? String(out.team).split(",").filter(Boolean) : [];
  }
  if (sheet === "projetos" && typeof out.progress === "string") out.progress = Number(out.progress);
  if (sheet === "projetos" && typeof out.budget === "string") out.budget = Number(out.budget);
  if ((sheet === "negocios" || sheet === "financeiro" || sheet === "equipamentos" || sheet === "contratos") && typeof out.value === "string") {
    out.value = Number(out.value);
  }
  if (sheet === "financeiro" && typeof out.amount === "string") out.amount = Number(out.amount);
  if (sheet === "clientes" && typeof out.totalBilled === "string") out.totalBilled = Number(out.totalBilled);
  if (sheet === "checklist" && typeof out.done === "string") out.done = out.done === "true" || out.done === "1";
  return out;
}

export function listItems<T = Record<string, unknown>>(sheet: SheetName): T[] {
  const wb = readWorkbook();
  const ws = wb.Sheets[sheet];
  if (!ws) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return rows.map((r) => coerceRow(sheet, r)) as T[];
}

export function createItem<T extends Record<string, unknown>>(sheet: SheetName, data: Omit<T, "id"> & { id?: string }): T {
  const wb = readWorkbook();
  const rows = listItems<Record<string, unknown>>(sheet);
  const id = data.id || `${sheet.slice(0, 2)}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const newRow = { ...data, id } as Record<string, unknown>;
  const nextRows = [...rows, newRow];
  const ws = XLSX.utils.json_to_sheet(serializeRows(sheet, nextRows), { header: headerFor(nextRows) });
  wb.Sheets[sheet] = ws;
  if (!wb.SheetNames.includes(sheet)) wb.SheetNames.push(sheet);
  writeWorkbook(wb);
  log("criado em", sheet, "->", id);
  return newRow as T;
}

export function updateItem<T extends Record<string, unknown>>(sheet: SheetName, id: string, patch: Partial<T>): T | null {
  const wb = readWorkbook();
  const rows = listItems<Record<string, unknown>>(sheet);
  const idx = rows.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) {
    log("update falhou: id não encontrado", sheet, id);
    return null;
  }
  const updated = { ...rows[idx], ...patch, id };
  rows[idx] = updated;
  const ws = XLSX.utils.json_to_sheet(serializeRows(sheet, rows), { header: headerFor(rows) });
  wb.Sheets[sheet] = ws;
  writeWorkbook(wb);
  log("atualizado em", sheet, "->", id);
  return updated as T;
}

export function deleteItem(sheet: SheetName, id: string): boolean {
  const wb = readWorkbook();
  const rows = listItems<Record<string, unknown>>(sheet);
  const next = rows.filter((r) => String(r.id) !== String(id));
  if (next.length === rows.length) {
    log("delete falhou: id não encontrado", sheet, id);
    return false;
  }
  const ws = XLSX.utils.json_to_sheet(serializeRows(sheet, next), { header: headerFor(next) });
  wb.Sheets[sheet] = ws;
  writeWorkbook(wb);
  log("excluído em", sheet, "->", id);
  return true;
}

/** Une as colunas de todas as linhas (algumas linhas têm campos opcionais ausentes, ex: contratos sem data de assinatura). */
function headerFor(rows: Record<string, unknown>[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) for (const k of Object.keys(row)) keys.add(k);
  // "id" sempre primeiro, o resto na ordem em que aparecer
  return ["id", ...Array.from(keys).filter((k) => k !== "id")];
}

/** Achata arrays em string separada por vírgula antes de gravar na planilha. */
function serializeRows(sheet: SheetName, rows: Record<string, unknown>[]) {
  return rows.map((row) => {
    const out: Record<string, unknown> = { ...row };
    if (Array.isArray(out.team)) out.team = (out.team as string[]).join(",");
    return out;
  });
}

export function getDbFileBuffer(): Buffer {
  ensureFile();
  return fs.readFileSync(DB_PATH);
}

export function getAllSheetNames(): SheetName[] {
  return ALL_SHEETS;
}
