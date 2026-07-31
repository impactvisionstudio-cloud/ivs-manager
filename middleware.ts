import { type NextRequest, NextResponse } from "next/server";

// Quando o Supabase estiver configurado (ver .env.example), este middleware
// pode ser expandido para validar a sessão via @supabase/ssr e redirecionar
// usuários não autenticados no servidor. Hoje a proteção de rotas roda no
// client (ver components/layout/dashboard-shell.tsx) com o Zustand mockado.
export function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
