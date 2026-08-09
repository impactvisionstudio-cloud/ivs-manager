import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospectSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DAILY_LIMIT_KEY = "daily_limit";
const DEFAULT_DAILY_LIMIT = "40";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [row] = await db
      .select()
      .from(prospectSettings)
      .where(eq(prospectSettings.key, DAILY_LIMIT_KEY));

    if (!row) {
      const [created] = await db
        .insert(prospectSettings)
        .values({ key: DAILY_LIMIT_KEY, value: DEFAULT_DAILY_LIMIT })
        .returning();
      return NextResponse.json({ dailyLimit: Number(created.value) });
    }

    return NextResponse.json({ dailyLimit: Number(row.value) });
  } catch (err) {
    console.error("[api/prospect-b2b/settings GET]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao buscar configurações" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { dailyLimit } = body as { dailyLimit: number };
    if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 500) {
      return NextResponse.json({ error: "Limite diário inválido" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(prospectSettings)
      .where(eq(prospectSettings.key, DAILY_LIMIT_KEY));

    if (existing) {
      await db
        .update(prospectSettings)
        .set({ value: String(dailyLimit), updatedAt: new Date() })
        .where(eq(prospectSettings.key, DAILY_LIMIT_KEY));
    } else {
      await db.insert(prospectSettings).values({ key: DAILY_LIMIT_KEY, value: String(dailyLimit) });
    }

    return NextResponse.json({ dailyLimit });
  } catch (err) {
    console.error("[api/prospect-b2b/settings PUT]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao salvar configurações" }, { status: 500 });
  }
}