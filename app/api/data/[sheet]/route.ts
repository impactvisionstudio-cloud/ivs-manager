import { NextRequest, NextResponse } from "next/server";
import { createItem, getAllSheetNames, listItems, type SheetName } from "@/lib/excel-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidSheet(sheet: string): sheet is SheetName {
  return (getAllSheetNames() as string[]).includes(sheet);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sheet: string }> }) {
  const { sheet } = await params;
  if (!isValidSheet(sheet)) {
    return NextResponse.json({ error: `Módulo "${sheet}" inválido` }, { status: 400 });
  }
  try {
    const items = listItems(sheet);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/data GET]", sheet, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao ler dados" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ sheet: string }> }) {
  const { sheet } = await params;
  if (!isValidSheet(sheet)) {
    return NextResponse.json({ error: `Módulo "${sheet}" inválido` }, { status: 400 });
  }
  try {
    const body = await req.json();
    const item = createItem(sheet, body);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("[api/data POST]", sheet, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao criar registro" }, { status: 500 });
  }
}
