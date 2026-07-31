import { NextResponse } from "next/server";
import { getDbFileBuffer } from "@/lib/excel-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const buffer = getDbFileBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ivs-database.xlsx"`,
      },
    });
  } catch (err) {
    console.error("[api/data/export]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao gerar planilha" }, { status: 500 });
  }
}
