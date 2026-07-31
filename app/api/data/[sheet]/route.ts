import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";

type SheetName = "clientes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidSheet(sheet: string): sheet is SheetName {
  return sheet === "clientes";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sheet: string }> }) {
  const { sheet } = await params;
  if (!isValidSheet(sheet)) {
    return NextResponse.json({ error: `Módulo "${sheet}" inválido` }, { status: 400 });
  }
  try {
    if (sheet !== "clientes") {
  return NextResponse.json({ items: [] });
}

const items = await db.select().from(clients);

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

if (sheet === "clientes") {
  const [item] = await db
    .insert(clients)
    .values(body)
    .returning();

  return NextResponse.json({ item }, { status: 201 });
}

return NextResponse.json({ error: "Módulo não suportado" }, { status: 400 });

  } catch (err) {
    console.error("[api/data POST]", sheet, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao criar registro" }, { status: 500 });
  }
}
