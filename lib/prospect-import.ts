import * as XLSX from "xlsx";

export interface ParsedLead {
  companyName: string;
  phone: string;
  niche: string;
  rawPhone: string;
}

export interface ParseResult {
  valid: ParsedLead[];
  invalidCount: number;
  duplicateCount: number;
}

const COMPANY_HEADERS = ["empresa", "nome da empresa", "nome", "company", "razao social"];
const PHONE_HEADERS = ["telefone", "phone", "celular", "whatsapp", "fone"];
const NICHE_HEADERS = ["nicho", "niche", "segmento", "categoria", "ramo"];

function normalizeHeader(h: string) {
  return h
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const idx = normalized.findIndex((h) => h === candidate);
    if (idx !== -1) return idx;
  }
  // fallback: contains match
  for (const candidate of candidates) {
    const idx = normalized.findIndex((h) => h.includes(candidate));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Normaliza telefone pro padrão internacional +55DDXXXXXXXXX.
 * Se já vier certo (com 55 e DDD), não mexe além de limpar formatação.
 * Retorna null se não for possível validar como telefone BR.
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.toString().replace(/\D/g, "");
  if (!digits) return null;

  let d = digits;
  // já tem código do país
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    return `+${d}`;
  }
  // numero local BR (DDD + numero, 10 ou 11 digitos) -> adiciona 55
  if (d.length === 10 || d.length === 11) {
    return `+55${d}`;
  }
  // numero com 55 mas tamanho errado, ou qualquer outro formato invalido
  return null;
}

export async function parseSpreadsheet(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (rows.length < 2) {
    return { valid: [], invalidCount: 0, duplicateCount: 0 };
  }

  const headers = (rows[0] as string[]).map((h) => String(h));
  const companyIdx = findColumnIndex(headers, COMPANY_HEADERS);
  const phoneIdx = findColumnIndex(headers, PHONE_HEADERS);
  const nicheIdx = findColumnIndex(headers, NICHE_HEADERS);

  const seenPhones = new Set<string>();
  const valid: ParsedLead[] = [];
  let invalidCount = 0;
  let duplicateCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const companyName = companyIdx !== -1 ? String(row[companyIdx] ?? "").trim() : "";
    const rawPhone = phoneIdx !== -1 ? String(row[phoneIdx] ?? "").trim() : "";
    const niche = nicheIdx !== -1 ? String(row[nicheIdx] ?? "").trim() : "";

    if (!companyName && !rawPhone) continue; // linha vazia

    const phone = normalizePhone(rawPhone);

    if (!companyName || !phone) {
      invalidCount++;
      continue;
    }

    if (seenPhones.has(phone)) {
      duplicateCount++;
      continue;
    }

    seenPhones.add(phone);
    valid.push({ companyName, phone, niche, rawPhone });
  }

  return { valid, invalidCount, duplicateCount };
}