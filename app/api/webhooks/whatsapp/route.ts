import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// A Meta chama esse GET pra verificar a URL quando você salva no painel
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// A Meta chama esse POST toda vez que chega mensagem ou status de envio
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Por enquanto só logamos pra confirmar que está chegando.
  // Depois vamos processar (marcar lead como "Respondeu", salvar histórico, etc.)
  console.log("Webhook WhatsApp recebido:", JSON.stringify(body, null, 2));

  return new NextResponse("OK", { status: 200 });
}