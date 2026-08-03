import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const { authId } = await request.json();

  if (!authId) {
    return NextResponse.json({ error: "authId ausente" }, { status: 400 });
  }

  const found = await db.select().from(users).where(eq(users.authId, authId)).limit(1);

  if (found.length === 0) {
    return NextResponse.json({ error: "Usuário sem perfil cadastrado" }, { status: 404 });
  }

  const u = found[0];
  return NextResponse.json({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatarUrl ?? undefined,
    createdAt: u.createdAt.toISOString(),
  });
}
