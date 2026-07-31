import { NextRequest, NextResponse } from "next/server";
import { deleteItem, getAllSheetNames, updateItem, type SheetName } from "@/lib/excel-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidSheet(sheet: string): sheet is SheetName {
  return (getAllSheetNames() as string[]).includes(sheet);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ sheet: string; id: string }> }) {
  const { sheet, id } = await params;
  if (!isValidSheet(sheet)) {
    return NextResponse.json({ error: `Módulo "${sheet}" inválido` }, { status: 400 });
  }
  try {
    const body = await req.json();
    const item = updateItem(sheet, id, body);
    if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[api/data PUT]", sheet, id, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao salvar alterações" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ sheet: string; id: string }> }) {
  const { sheet, id } = await params;
  if (!isValidSheet(sheet)) {
    return NextResponse.json({ error: `Módulo "${sheet}" inválido` }, { status: 400 });
  }
  try {
    const ok = deleteItem(sheet, id);
    if (!ok) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/data DELETE]", sheet, id, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao excluir" }, { status: 500 });
  }
}
